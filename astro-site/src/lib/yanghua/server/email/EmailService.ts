/* eslint-disable no-console */
import nodemailer, { type Transporter } from 'nodemailer';

export interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    address: string;
  };
  resendApiKey?: string;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export class EmailService {
  private transporter?: Transporter;
  private config: EmailConfig;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: EmailConfig, retryAttempts = 3, retryDelay = 1000) {
    this.config = config;
    this.retryAttempts = retryAttempts;
    this.retryDelay = retryDelay;
    if (!config.resendApiKey) {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        tls: config.secure ? {} : { rejectUnauthorized: false },
      });
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (this.config.resendApiKey) return true;
    if (!this.transporter) return false;

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt += 1) {
      try {
        const result = await this.attemptSend(options);
        return { success: true, messageId: result.messageId, timestamp: new Date() };
      } catch (err) {
        lastError = err as Error;
        console.error(`Email send attempt ${attempt} failed:`, err);
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    return { success: false, error: lastError?.message || 'Unknown error', timestamp: new Date() };
  }

  private async attemptSend(options: EmailOptions): Promise<any> {
    if (this.config.resendApiKey) {
      return this.sendWithResend(options);
    }

    if (!this.transporter) throw new Error('Email transport is not configured');

    const mailOptions = {
      from: `${this.config.from.name} <${this.config.from.address}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      priority: options.priority || 'normal',
      attachments: options.attachments,
    };

    return await this.transporter.sendMail(mailOptions);
  }

  private async sendWithResend(options: EmailOptions): Promise<{ messageId: string }> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${this.config.from.name} <${this.config.from.address}>`,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof payload?.message === 'string' ? payload.message : 'Resend rejected the email.';
      throw new Error(`Resend API error (${response.status}): ${message}`);
    }

    if (!payload?.id) throw new Error('Resend returned no message id');
    return { messageId: String(payload.id) };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createEmailService(): EmailService {
  const host = process.env.SMTP_HOST || undefined;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  const fromName = process.env.EMAIL_FROM_NAME || 'Yanghua Cable';
  const fromAddress = process.env.EMAIL_FROM || 'noreply@yhflexiblebusbar.com';
  const resendApiKey = process.env.RESEND_API_KEY?.trim() || undefined;

  const auth = user && pass ? { user, pass } : undefined;

  return new EmailService(
    {
      host,
      port,
      secure,
      auth,
      from: { name: fromName, address: fromAddress },
      resendApiKey,
    },
    parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '3', 10),
    parseInt(process.env.EMAIL_RETRY_DELAY_MS || '1000', 10),
  );
}

export async function addResendAudienceContact(email: string): Promise<'added' | 'existing' | null> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const audienceId = process.env.RESEND_AUDIENCE_ID?.trim();
  if (!apiKey || !audienceId) return null;

  const response = await fetch(`https://api.resend.com/audiences/${encodeURIComponent(audienceId)}/contacts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  });

  if (response.status === 409) return 'existing';
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.message === 'string' ? payload.message : 'Resend audience rejected the contact.';
    throw new Error(`Resend audience error (${response.status}): ${message}`);
  }

  return 'added';
}

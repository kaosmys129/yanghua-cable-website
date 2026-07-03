/* eslint-disable no-console */
import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    address: string;
  };
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
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: EmailConfig, retryAttempts = 3, retryDelay = 1000) {
    this.config = config;
    this.retryAttempts = retryAttempts;
    this.retryDelay = retryDelay;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: config.secure ? {} : { rejectUnauthorized: false },
    });
  }

  async verifyConnection(): Promise<boolean> {
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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createEmailService(): EmailService {
  const host = process.env.SMTP_HOST || 'localhost';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  const fromName = process.env.EMAIL_FROM_NAME || 'Yanghua Cable';
  const fromAddress = process.env.EMAIL_FROM || 'noreply@yhflexiblebusbar.com';

  const auth = user && pass ? { user, pass } : undefined;

  return new EmailService(
    {
      host,
      port,
      secure,
      auth,
      from: { name: fromName, address: fromAddress },
    },
    parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '3', 10),
    parseInt(process.env.EMAIL_RETRY_DELAY_MS || '1000', 10),
  );
}


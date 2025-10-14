import nodemailer from 'nodemailer';
import { getTranslations } from 'next-intl/server';

/**
 * 邮件服务配置接口
 */
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    address: string;
  };
}

/**
 * 邮件发送选项接口
 */
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

/**
 * 邮件发送结果接口
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

/**
 * 邮件提供商枚举
 */
export enum EmailProvider {
  SMTP = 'smtp',
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun'
}

/**
 * 核心邮件服务类
 * 支持多语言、多邮件提供商、高可靠性和安全性
 */
export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;
  private provider: EmailProvider;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(
    config: EmailConfig,
    provider: EmailProvider = EmailProvider.SMTP,
    retryAttempts: number = 3,
    retryDelay: number = 1000
  ) {
    this.config = config;
    this.provider = provider;
    this.retryAttempts = retryAttempts;
    this.retryDelay = retryDelay;
    this.transporter = this.createTransporter();
  }

  /**
   * 创建邮件传输器
   */
  private createTransporter(): nodemailer.Transporter {
    const transportConfig = this.getTransportConfig();
    return nodemailer.createTransport(transportConfig);
  }

  /**
   * 获取传输配置
   */
  private getTransportConfig(): any {
    switch (this.provider) {
      case EmailProvider.GMAIL:
        return {
          service: 'gmail',
          auth: this.config.auth,
        };
      
      case EmailProvider.OUTLOOK:
        return {
          service: 'hotmail',
          auth: this.config.auth,
        };
      
      case EmailProvider.SMTP:
      default:
        return {
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          auth: this.config.auth,
          tls: {
            rejectUnauthorized: false,
          },
        };
    }
  }

  /**
   * 验证邮件服务连接
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }

  /**
   * 发送邮件（带重试机制）
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await this.attemptSendEmail(options);
        return {
          success: true,
          messageId: result.messageId,
          timestamp: new Date(),
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`Email send attempt ${attempt} failed:`, error);

        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      timestamp: new Date(),
    };
  }

  /**
   * 尝试发送邮件
   */
  private async attemptSendEmail(options: EmailOptions): Promise<any> {
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

  /**
   * 批量发送邮件
   */
  async sendBulkEmails(emailList: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    for (const emailOptions of emailList) {
      const result = await this.sendEmail(emailOptions);
      results.push(result);
      
      // 添加延迟以避免被标记为垃圾邮件
      await this.delay(100);
    }
    
    return results;
  }

  /**
   * 发送多语言邮件
   */
  async sendLocalizedEmail(
    options: Omit<EmailOptions, 'subject' | 'html' | 'text'>,
    templateKey: string,
    templateData: Record<string, any>,
    locale: string = 'en'
  ): Promise<EmailResult> {
    try {
      const t = await getTranslations({ locale, namespace: 'email.templates' });
      
      // 获取本地化的主题和内容
      const subject = t(`${templateKey}.subject`, templateData);
      const html = await this.renderTemplate(templateKey, templateData, locale, 'html');
      const text = await this.renderTemplate(templateKey, templateData, locale, 'text');

      return await this.sendEmail({
        ...options,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('Failed to send localized email:', error);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 渲染邮件模板
   */
  private async renderTemplate(
    templateKey: string,
    data: Record<string, any>,
    locale: string,
    format: 'html' | 'text'
  ): Promise<string> {
    const t = await getTranslations({ locale, namespace: 'email.templates' });
    
    // 获取模板内容
    let template = t(`${templateKey}.${format}`);
    
    // 替换模板变量
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      template = template.replace(placeholder, String(value));
    });
    
    return template;
  }

  /**
   * 格式化日期（支持多语言）
   */
  formatDate(date: Date, locale: string): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    };
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 关闭邮件服务连接
   */
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
    }
  }

  /**
   * 获取服务状态
   */
  getStatus(): {
    provider: EmailProvider;
    config: Omit<EmailConfig, 'auth'>;
    isConnected: boolean;
  } {
    return {
      provider: this.provider,
      config: {
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        from: this.config.from,
      },
      isConnected: !!this.transporter,
    };
  }
}

/**
 * 邮件服务工厂函数
 */
export function createEmailService(
  provider: EmailProvider = EmailProvider.SMTP
): EmailService {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: {
      name: process.env.EMAIL_FROM_NAME || 'Yanghua Cable',
      address: process.env.EMAIL_FROM || 'noreply@yanghua.com',
    },
  };

  return new EmailService(config, provider);
}

/**
 * 默认邮件服务实例
 */
export const defaultEmailService = createEmailService();
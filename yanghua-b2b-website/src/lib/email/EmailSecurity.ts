import { z } from 'zod';

/**
 * 频率限制配置接口
 */
export interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  skipSuccessfulRequests?: boolean; // 是否跳过成功请求
  skipFailedRequests?: boolean; // 是否跳过失败请求
}

/**
 * 安全配置接口
 */
export interface SecurityConfig {
  rateLimit: RateLimitConfig;
  spamDetection: {
    enabled: boolean;
    maxLinksPerMessage: number;
    bannedWords: string[];
    suspiciousPatterns: RegExp[];
  };
  validation: {
    maxMessageLength: number;
    maxSubjectLength: number;
    allowedDomains?: string[];
    blockedDomains?: string[];
  };
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskScore: number; // 0-100，越高越可疑
}

/**
 * 频率限制存储接口
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * 邮件安全服务类
 */
export class EmailSecurity {
  private config: SecurityConfig;
  private rateLimitStore: RateLimitStore = {};
  private blacklist: Set<string> = new Set();

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15分钟
        maxRequests: 5,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
      },
      spamDetection: {
        enabled: true,
        maxLinksPerMessage: 3,
        bannedWords: [
          'spam', 'scam', 'free money', 'click here', 'urgent',
          'limited time', 'act now', 'guaranteed', 'no risk',
          'viagra', 'casino', 'lottery', 'winner', 'congratulations'
        ],
        suspiciousPatterns: [
          /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // 信用卡号
          /\b[A-Z]{2,}\s+[A-Z]{2,}\s+[A-Z]{2,}\b/, // 全大写单词
          /(.)\1{4,}/, // 重复字符
          /https?:\/\/[^\s]+/gi, // URL链接
        ],
      },
      validation: {
        maxMessageLength: 5000,
        maxSubjectLength: 200,
        allowedDomains: [],
        blockedDomains: [
          'tempmail.org', '10minutemail.com', 'guerrillamail.com',
          'mailinator.com', 'throwaway.email'
        ],
      },
      ...config,
    };
  }

  /**
   * 验证联系表单数据
   */
  validateContactForm(data: {
    name: string;
    email: string;
    company: string;
    country: string;
    phone?: string;
    subject: string;
    message: string;
  }, clientIP?: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    // 基础字段验证
    const baseValidation = this.validateBaseFields(data);
    errors.push(...baseValidation.errors);
    warnings.push(...baseValidation.warnings);
    riskScore += baseValidation.riskScore;

    // 垃圾邮件检测
    if (this.config.spamDetection.enabled) {
      const spamCheck = this.detectSpam(data.message, data.subject);
      errors.push(...spamCheck.errors);
      warnings.push(...spamCheck.warnings);
      riskScore += spamCheck.riskScore;
    }

    // 频率限制检查
    if (clientIP) {
      const rateLimitCheck = this.checkRateLimit(clientIP);
      if (!rateLimitCheck.allowed) {
        errors.push('Too many requests. Please try again later.');
        riskScore += 30;
      }
    }

    // 邮箱域名检查
    const domainCheck = this.validateEmailDomain(data.email);
    errors.push(...domainCheck.errors);
    warnings.push(...domainCheck.warnings);
    riskScore += domainCheck.riskScore;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskScore: Math.min(riskScore, 100),
    };
  }

  /**
   * 验证询盘表单数据
   */
  validateInquiryForm(data: {
    name: string;
    email: string;
    company: string;
    productInterest?: string;
    message: string;
  }, clientIP?: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    // 基础字段验证
    const baseValidation = this.validateBaseFields({
      ...data,
      country: '', // 询盘表单没有国家字段
      subject: data.productInterest || 'inquiry',
    });
    errors.push(...baseValidation.errors);
    warnings.push(...baseValidation.warnings);
    riskScore += baseValidation.riskScore;

    // 垃圾邮件检测
    if (this.config.spamDetection.enabled) {
      const spamCheck = this.detectSpam(data.message, data.productInterest || '');
      errors.push(...spamCheck.errors);
      warnings.push(...spamCheck.warnings);
      riskScore += spamCheck.riskScore;
    }

    // 频率限制检查
    if (clientIP) {
      const rateLimitCheck = this.checkRateLimit(clientIP);
      if (!rateLimitCheck.allowed) {
        errors.push('Too many requests. Please try again later.');
        riskScore += 30;
      }
    }

    // 邮箱域名检查
    const domainCheck = this.validateEmailDomain(data.email);
    errors.push(...domainCheck.errors);
    warnings.push(...domainCheck.warnings);
    riskScore += domainCheck.riskScore;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskScore: Math.min(riskScore, 100),
    };
  }

  /**
   * 基础字段验证
   */
  private validateBaseFields(data: {
    name: string;
    email: string;
    company: string;
    country: string;
    phone?: string;
    subject: string;
    message: string;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    // 姓名验证
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    } else if (data.name.length > 50) {
      errors.push('Name cannot exceed 50 characters');
    } else if (!/^[a-zA-Z\s\u00C0-\u017F\u4e00-\u9fff]+$/.test(data.name)) {
      warnings.push('Name contains unusual characters');
      riskScore += 10;
    }

    // 邮箱验证
    const emailSchema = z.string().email();
    if (!emailSchema.safeParse(data.email).success) {
      errors.push('Invalid email address');
    }

    // 公司名称验证
    if (!data.company || data.company.trim().length < 2) {
      errors.push('Company name must be at least 2 characters long');
    } else if (data.company.length > 100) {
      errors.push('Company name cannot exceed 100 characters');
    }

    // 消息内容验证
    if (!data.message || data.message.trim().length < 10) {
      errors.push('Message must be at least 10 characters long');
    } else if (data.message.length > this.config.validation.maxMessageLength) {
      errors.push(`Message cannot exceed ${this.config.validation.maxMessageLength} characters`);
    }

    // 主题验证
    if (data.subject && data.subject.length > this.config.validation.maxSubjectLength) {
      errors.push(`Subject cannot exceed ${this.config.validation.maxSubjectLength} characters`);
    }

    // 电话号码验证（如果提供）
    if (data.phone && data.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
        warnings.push('Phone number format may be invalid');
        riskScore += 5;
      }
    }

    return { isValid: errors.length === 0, errors, warnings, riskScore };
  }

  /**
   * 垃圾邮件检测
   */
  private detectSpam(message: string, subject: string = ''): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    const fullText = `${subject} ${message}`.toLowerCase();

    // 检查禁用词汇
    const foundBannedWords = this.config.spamDetection.bannedWords.filter(word =>
      fullText.includes(word.toLowerCase())
    );
    if (foundBannedWords.length > 0) {
      warnings.push(`Message contains potentially suspicious words: ${foundBannedWords.join(', ')}`);
      riskScore += foundBannedWords.length * 15;
    }

    // 检查可疑模式
    this.config.spamDetection.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(fullText)) {
        warnings.push('Message contains suspicious patterns');
        riskScore += 20;
      }
    });

    // 检查链接数量
    const linkCount = (fullText.match(/https?:\/\/[^\s]+/gi) || []).length;
    if (linkCount > this.config.spamDetection.maxLinksPerMessage) {
      warnings.push(`Message contains too many links (${linkCount})`);
      riskScore += (linkCount - this.config.spamDetection.maxLinksPerMessage) * 10;
    }

    // 检查重复字符
    const repeatedChars = fullText.match(/(.)\1{4,}/g);
    if (repeatedChars && repeatedChars.length > 0) {
      warnings.push('Message contains excessive repeated characters');
      riskScore += 15;
    }

    // 检查全大写文本
    const uppercaseRatio = (fullText.match(/[A-Z]/g) || []).length / fullText.length;
    if (uppercaseRatio > 0.5 && fullText.length > 50) {
      warnings.push('Message contains excessive uppercase text');
      riskScore += 20;
    }

    // 如果风险分数过高，标记为垃圾邮件
    if (riskScore >= 60) {
      errors.push('Message flagged as potential spam');
    }

    return { isValid: errors.length === 0, errors, warnings, riskScore };
  }

  /**
   * 验证邮箱域名
   */
  private validateEmailDomain(email: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      errors.push('Invalid email format');
      return { isValid: false, errors, warnings, riskScore: 100 };
    }

    // 检查黑名单域名
    if (this.config.validation.blockedDomains?.includes(domain)) {
      errors.push('Email domain is not allowed');
      riskScore += 50;
    }

    // 检查白名单域名（如果配置了）
    if (this.config.validation.allowedDomains?.length && 
        !this.config.validation.allowedDomains.includes(domain)) {
      warnings.push('Email domain is not in the allowed list');
      riskScore += 20;
    }

    // 检查临时邮箱域名
    const tempEmailPatterns = [
      /temp/i, /disposable/i, /throwaway/i, /fake/i, /trash/i
    ];
    if (tempEmailPatterns.some(pattern => pattern.test(domain))) {
      warnings.push('Email appears to be from a temporary email service');
      riskScore += 30;
    }

    return { isValid: errors.length === 0, errors, warnings, riskScore };
  }

  /**
   * 频率限制检查
   */
  checkRateLimit(identifier: string): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const key = `rate_limit_${identifier}`;
    const record = this.rateLimitStore[key];

    if (!record || now > record.resetTime) {
      // 创建新记录或重置过期记录
      this.rateLimitStore[key] = {
        count: 1,
        resetTime: now + this.config.rateLimit.windowMs,
      };
      return { allowed: true };
    }

    if (record.count >= this.config.rateLimit.maxRequests) {
      return { allowed: false, resetTime: record.resetTime };
    }

    // 增加计数
    record.count++;
    return { allowed: true };
  }

  /**
   * 添加到黑名单
   */
  addToBlacklist(identifier: string): void {
    this.blacklist.add(identifier);
  }

  /**
   * 从黑名单移除
   */
  removeFromBlacklist(identifier: string): void {
    this.blacklist.delete(identifier);
  }

  /**
   * 检查是否在黑名单中
   */
  isBlacklisted(identifier: string): boolean {
    return this.blacklist.has(identifier);
  }

  /**
   * 清理过期的频率限制记录
   */
  cleanupRateLimitStore(): void {
    const now = Date.now();
    Object.keys(this.rateLimitStore).forEach(key => {
      if (this.rateLimitStore[key].resetTime < now) {
        delete this.rateLimitStore[key];
      }
    });
  }

  /**
   * 获取安全统计信息
   */
  getSecurityStats(): {
    rateLimitRecords: number;
    blacklistedItems: number;
    config: SecurityConfig;
  } {
    return {
      rateLimitRecords: Object.keys(this.rateLimitStore).length,
      blacklistedItems: this.blacklist.size,
      config: this.config,
    };
  }

  /**
   * 更新安全配置
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * 创建邮件安全实例
 */
export function createEmailSecurity(config?: Partial<SecurityConfig>): EmailSecurity {
  return new EmailSecurity(config);
}

/**
 * 默认邮件安全实例
 */
export const defaultEmailSecurity = createEmailSecurity();

/**
 * 获取客户端IP地址的辅助函数
 */
export function getClientIP(request: Request): string {
  // 尝试从各种头部获取真实IP
  const headers = request.headers;
  
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIP = headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }

  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // 如果都没有，返回默认值
  return 'unknown';
}

/**
 * 验证模式工厂函数
 */
export function createValidationSchemas(locale: string = 'en') {
  const messages = {
    en: {
      nameRequired: 'Name is required',
      nameMinLength: 'Name must be at least 2 characters',
      nameMaxLength: 'Name cannot exceed 50 characters',
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      companyRequired: 'Company name is required',
      companyMinLength: 'Company name must be at least 2 characters',
      companyMaxLength: 'Company name cannot exceed 100 characters',
      countryRequired: 'Country is required',
      subjectRequired: 'Please select a subject',
      messageRequired: 'Message is required',
      messageMinLength: 'Message must be at least 10 characters',
      messageMaxLength: 'Message cannot exceed 1000 characters',
    },
    es: {
      nameRequired: 'El nombre es obligatorio',
      nameMinLength: 'El nombre debe tener al menos 2 caracteres',
      nameMaxLength: 'El nombre no puede exceder 50 caracteres',
      emailRequired: 'El correo electrónico es obligatorio',
      emailInvalid: 'Por favor, ingrese una dirección de correo electrónico válida',
      companyRequired: 'El nombre de la empresa es obligatorio',
      companyMinLength: 'El nombre de la empresa debe tener al menos 2 caracteres',
      companyMaxLength: 'El nombre de la empresa no puede exceder 100 caracteres',
      countryRequired: 'El país es obligatorio',
      subjectRequired: 'Por favor, seleccione un asunto',
      messageRequired: 'El mensaje es obligatorio',
      messageMinLength: 'El mensaje debe tener al menos 10 caracteres',
      messageMaxLength: 'El mensaje no puede exceder 1000 caracteres',
    }
  };

  const msg = messages[locale as keyof typeof messages] || messages.en;

  const contactFormSchema = z.object({
    name: z.string()
      .min(2, msg.nameMinLength)
      .max(50, msg.nameMaxLength),
    email: z.string()
      .min(1, msg.emailRequired)
      .email(msg.emailInvalid),
    company: z.string()
      .min(2, msg.companyMinLength)
      .max(100, msg.companyMaxLength),
    country: z.string()
      .min(2, msg.countryRequired)
      .max(50, msg.countryRequired),
    phone: z.string().optional(),
    subject: z.string().min(1, msg.subjectRequired),
    message: z.string()
      .min(10, msg.messageMinLength)
      .max(1000, msg.messageMaxLength),
  });

  const inquiryFormSchema = z.object({
    name: z.string()
      .min(2, msg.nameMinLength)
      .max(50, msg.nameMaxLength),
    email: z.string()
      .min(1, msg.emailRequired)
      .email(msg.emailInvalid),
    company: z.string()
      .min(2, msg.companyMinLength)
      .max(100, msg.companyMaxLength),
    productInterest: z.string().optional(),
    message: z.string()
      .min(10, msg.messageMinLength)
      .max(1000, msg.messageMaxLength),
  });

  return {
    contactFormSchema,
    inquiryFormSchema,
  };
}
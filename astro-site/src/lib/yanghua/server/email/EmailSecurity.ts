import { z } from 'zod';

/**
 * 旧站 EmailSecurity 的 framework-agnostic 迁移版本。
 * 目标：保持风控/限流/风险评分与错误信息结构，供 Astro `/api/email/send` 复用。
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

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

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskScore: number; // 0-100
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export class EmailSecurity {
  private config: SecurityConfig;
  private rateLimitStore: RateLimitStore = {};

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
      },
      spamDetection: {
        enabled: true,
        maxLinksPerMessage: 3,
        bannedWords: [
          'spam',
          'scam',
          'free money',
          'click here',
          'urgent',
          'limited time',
          'act now',
          'guaranteed',
          'no risk',
          'viagra',
          'casino',
          'lottery',
          'winner',
          'congratulations',
        ],
        suspiciousPatterns: [
          /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // credit card
          /\b[A-Z]{2,}\s+[A-Z]{2,}\s+[A-Z]{2,}\b/, // ALL CAPS
          /(.)\1{4,}/, // repeated chars
          /https?:\/\/[^\s]+/gi, // url
        ],
      },
      validation: {
        maxMessageLength: 5000,
        maxSubjectLength: 200,
        allowedDomains: [],
        blockedDomains: [
          'tempmail.org',
          '10minutemail.com',
          'guerrillamail.com',
          'mailinator.com',
          'throwaway.email',
        ],
      },
      ...config,
    };
  }

  validateContactForm(
    data: {
      name: string;
      email: string;
      company: string;
      country: string;
      phone?: string;
      subject: string;
      message: string;
    },
    clientIP?: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    const baseValidation = this.validateBaseFields(data);
    errors.push(...baseValidation.errors);
    warnings.push(...baseValidation.warnings);
    riskScore += baseValidation.riskScore;

    if (this.config.spamDetection.enabled) {
      const spamCheck = this.detectSpam(data.message, data.subject);
      errors.push(...spamCheck.errors);
      warnings.push(...spamCheck.warnings);
      riskScore += spamCheck.riskScore;
    }

    if (clientIP) {
      const rl = this.checkRateLimit(clientIP);
      if (!rl.allowed) {
        errors.push('Too many requests. Please try again later.');
        riskScore += 30;
      }
    }

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

  validateInquiryForm(
    data: {
      name: string;
      email: string;
      company: string;
      productInterest?: string;
      message: string;
    },
    clientIP?: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    const baseValidation = this.validateBaseFields({
      name: data.name,
      email: data.email,
      company: data.company,
      country: '',
      phone: '',
      subject: data.productInterest || 'inquiry',
      message: data.message,
    });
    errors.push(...baseValidation.errors);
    warnings.push(...baseValidation.warnings);
    riskScore += baseValidation.riskScore;

    if (this.config.spamDetection.enabled) {
      const spamCheck = this.detectSpam(data.message, data.productInterest || '');
      errors.push(...spamCheck.errors);
      warnings.push(...spamCheck.warnings);
      riskScore += spamCheck.riskScore;
    }

    if (clientIP) {
      const rl = this.checkRateLimit(clientIP);
      if (!rl.allowed) {
        errors.push('Too many requests. Please try again later.');
        riskScore += 30;
      }
    }

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

  validateSubscriptionForm(data: { email: string }, clientIP?: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    if (!z.string().email().safeParse(data.email).success) {
      errors.push('Invalid email address');
    }

    if (clientIP) {
      const rl = this.checkRateLimit(clientIP);
      if (!rl.allowed) {
        errors.push('Too many requests. Please try again later.');
        riskScore += 30;
      }
    }

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

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    } else if (data.name.length > 50) {
      errors.push('Name cannot exceed 50 characters');
    } else if (!/^[a-zA-Z\s\u00C0-\u017F\u4e00-\u9fff]+$/.test(data.name)) {
      warnings.push('Name contains unusual characters');
      riskScore += 10;
    }

    const emailSchema = z.string().email();
    if (!emailSchema.safeParse(data.email).success) {
      errors.push('Invalid email address');
    }

    const company = data.company?.trim() || '';
    if (company && company.length < 2) {
      errors.push('Company name must be at least 2 characters long');
    } else if (company.length > 100) {
      errors.push('Company name cannot exceed 100 characters');
    }

    if (!data.message || data.message.trim().length < 10) {
      errors.push('Message must be at least 10 characters long');
    } else if (data.message.length > this.config.validation.maxMessageLength) {
      errors.push(`Message cannot exceed ${this.config.validation.maxMessageLength} characters`);
    }

    if (data.subject && data.subject.length > this.config.validation.maxSubjectLength) {
      errors.push(`Subject cannot exceed ${this.config.validation.maxSubjectLength} characters`);
    }

    if (data.phone && data.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
        warnings.push('Phone number format may be invalid');
        riskScore += 5;
      }
    }

    return { isValid: errors.length === 0, errors, warnings, riskScore };
  }

  private detectSpam(message: string, subject: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    const lowerMessage = (message || '').toLowerCase();
    const lowerSubject = (subject || '').toLowerCase();

    // banned words
    for (const word of this.config.spamDetection.bannedWords) {
      if (lowerMessage.includes(word) || lowerSubject.includes(word)) {
        warnings.push('Message contains potentially spam content');
        riskScore += 20;
        break;
      }
    }

    // links count
    const links = (message || '').match(/https?:\/\/[^\s]+/gi) || [];
    if (links.length > this.config.spamDetection.maxLinksPerMessage) {
      warnings.push('Message contains too many links');
      riskScore += 25;
    }

    // suspicious patterns
    for (const pattern of this.config.spamDetection.suspiciousPatterns) {
      if (pattern.test(message || '') || pattern.test(subject || '')) {
        warnings.push('Message matches suspicious pattern');
        riskScore += 15;
        break;
      }
    }

    return { isValid: errors.length === 0, errors, warnings, riskScore };
  }

  private checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.rateLimitStore[identifier];
    const windowStart = now - this.config.rateLimit.windowMs;

    if (!record || record.resetTime < windowStart) {
      this.rateLimitStore[identifier] = { count: 1, resetTime: now };
      return { allowed: true, remaining: this.config.rateLimit.maxRequests - 1, resetTime: now };
    }

    if (record.count >= this.config.rateLimit.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime + this.config.rateLimit.windowMs };
    }

    record.count += 1;
    return { allowed: true, remaining: this.config.rateLimit.maxRequests - record.count, resetTime: record.resetTime + this.config.rateLimit.windowMs };
  }

  private validateEmailDomain(email: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    const domain = (email.split('@')[1] || '').toLowerCase();
    if (!domain) return { isValid: false, errors: ['Invalid email address'], warnings, riskScore };

    if (this.config.validation.allowedDomains && this.config.validation.allowedDomains.length > 0) {
      if (!this.config.validation.allowedDomains.includes(domain)) {
        errors.push('Email domain is not allowed');
        riskScore += 25;
      }
    }

    if (this.config.validation.blockedDomains && this.config.validation.blockedDomains.includes(domain)) {
      errors.push('Temporary email addresses are not allowed');
      riskScore += 40;
    }

    return { isValid: errors.length === 0, errors, warnings, riskScore };
  }
}

export function createEmailSecurity(config?: Partial<SecurityConfig>): EmailSecurity {
  return new EmailSecurity(config);
}

export const defaultEmailSecurity = createEmailSecurity();

export function getClientIP(request: Request): string {
  const headers = request.headers;
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  const xRealIP = headers.get('x-real-ip');
  if (xRealIP) return xRealIP;
  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;
  return 'unknown';
}

export function createValidationSchemas(locale: string = 'en') {
  const messages = {
    en: {
      nameMinLength: 'Name must be at least 2 characters',
      nameMaxLength: 'Name cannot exceed 50 characters',
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      companyMinLength: 'Company name must be at least 2 characters',
      companyMaxLength: 'Company name cannot exceed 100 characters',
      countryRequired: 'Country is required',
      subjectRequired: 'Please select a subject',
      messageMinLength: 'Message must be at least 10 characters',
      messageMaxLength: 'Message cannot exceed 1000 characters',
    },
    es: {
      nameMinLength: 'El nombre debe tener al menos 2 caracteres',
      nameMaxLength: 'El nombre no puede exceder 50 caracteres',
      emailRequired: 'El correo electrónico es obligatorio',
      emailInvalid: 'Por favor, ingrese una dirección de correo electrónico válida',
      companyMinLength: 'El nombre de la empresa debe tener al menos 2 caracteres',
      companyMaxLength: 'El nombre de la empresa no puede exceder 100 caracteres',
      countryRequired: 'El país es obligatorio',
      subjectRequired: 'Por favor, seleccione un asunto',
      messageMinLength: 'El mensaje debe tener al menos 10 caracteres',
      messageMaxLength: 'El mensaje no puede exceder 1000 caracteres',
    },
  };

  const msg = (messages as any)[locale] || messages.en;

  const contactFormSchema = z.object({
    name: z.string().min(2, msg.nameMinLength).max(50, msg.nameMaxLength),
    email: z.string().min(1, msg.emailRequired).email(msg.emailInvalid),
    company: z.string().max(100, msg.companyMaxLength).optional().default(''),
    country: z.string().optional().default(''),
    phone: z.string().optional(),
    subject: z.string().optional().default(''),
    message: z.string().min(10, msg.messageMinLength).max(1000, msg.messageMaxLength),
  });

  const inquiryFormSchema = z.object({
    name: z.string().min(2, msg.nameMinLength).max(50, msg.nameMaxLength),
    email: z.string().min(1, msg.emailRequired).email(msg.emailInvalid),
    company: z.string().max(100, msg.companyMaxLength).optional().default(''),
    productInterest: z.string().optional(),
    message: z.string().min(10, msg.messageMinLength).max(1000, msg.messageMaxLength),
  });

  return { contactFormSchema, inquiryFormSchema };
}

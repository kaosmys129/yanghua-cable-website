import { NextRequest, NextResponse } from 'next/server';

// Content Security Policy configuration
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js
    "'unsafe-eval'", // Required for development
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://vercel.live',
    'https://vitals.vercel-analytics.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and CSS-in-JS
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'https://images.unsplash.com',
    'https://res.cloudinary.com',
    'https://yanghua-strapi-cms.onrender.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:',
  ],
  'connect-src': [
    "'self'",
    'https://api.strapi.io',
    'https://yanghua-strapi-cms.onrender.com',
    'https://fruitful-presence-02d7be759c.strapiapp.com',
    'https://www.google-analytics.com',
    'https://vitals.vercel-analytics.com',
    'wss://ws.vercel.live',
  ],
  'frame-src': [
    "'self'",
    'https://www.youtube.com',
    'https://player.vimeo.com',
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

// Generate CSP header value
export function generateCSPHeader(directives: typeof CSP_DIRECTIVES = CSP_DIRECTIVES): string {
  return Object.entries(directives)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

// Security headers configuration
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': generateCSPHeader(),
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=()',
    'usb=()',
  ].join(', '),
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Cross-Origin Embedder Policy
  'Cross-Origin-Embedder-Policy': 'credentialless',
  
  // Cross-Origin Opener Policy
  'Cross-Origin-Opener-Policy': 'same-origin',
  
  // Cross-Origin Resource Policy
  'Cross-Origin-Resource-Policy': 'cross-origin',
};

// Apply security headers to response
// 清理 Link 响应头中包含 hreflang 的 rel="alternate" 条目，避免从HTTP头输出hreflang
function cleanHreflangLinkHeader(value: string): string | null {
  // 将多个 Link 条目按逗号拆分（Link 头通常以逗号分隔多个链接）
  const segments = value.split(',');
  const kept = segments.filter((seg) => {
    const lower = seg.toLowerCase();
    const hasAlternate = lower.includes('rel="alternate"') || lower.includes('rel=alternate');
    const hasHreflang = lower.includes('hreflang="') || lower.includes('hreflang=');
    // 只有当同时包含 rel=alternate 和 hreflang 时才移除该片段
    return !(hasAlternate && hasHreflang);
  });
  const result = kept.map((s) => s.trim()).filter(Boolean).join(', ');
  return result.length ? result : null;
}
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // 在应用完其它安全头后，最后清理可能出现的 Link hreflang 片段
  const linkHeader = response.headers.get('Link') || response.headers.get('link');
  if (linkHeader) {
    const cleaned = cleanHreflangLinkHeader(linkHeader);
    if (cleaned) {
      response.headers.set('Link', cleaned);
    } else {
      response.headers.delete('Link');
    }
  }
  
  return response;
}

// Create secure response with headers
export function createSecureResponse(
  body?: BodyInit | null,
  init?: ResponseInit
): NextResponse {
  const response = new NextResponse(body, init);
  return applySecurityHeaders(response);
}

// Validate and sanitize input
export class InputValidator {
  // Email validation
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Phone validation
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  // URL validation
  static isValidURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // Sanitize HTML input
  static sanitizeHTML(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Sanitize SQL input (basic)
  static sanitizeSQL(input: string): string {
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }

  // Validate and sanitize form data
  static validateFormData(data: Record<string, any>): {
    isValid: boolean;
    errors: string[];
    sanitized: Record<string, any>;
  } {
    const errors: string[] = [];
    const sanitized: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // Basic sanitization
        sanitized[key] = this.sanitizeHTML(value.trim());

        // Specific validations
        if (key.toLowerCase().includes('email')) {
          if (!this.isValidEmail(value)) {
            errors.push(`Invalid email format: ${key}`);
          }
        }

        if (key.toLowerCase().includes('phone')) {
          if (!this.isValidPhone(value)) {
            errors.push(`Invalid phone format: ${key}`);
          }
        }

        if (key.toLowerCase().includes('url') || key.toLowerCase().includes('website')) {
          if (value && !this.isValidURL(value)) {
            errors.push(`Invalid URL format: ${key}`);
          }
        }

        // Length validations
        if (value.length > 1000) {
          errors.push(`Field too long: ${key}`);
        }
      } else {
        sanitized[key] = value;
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
    };
  }
}

// Rate limiting
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly MAX_REQUESTS = 100; // requests per window

  static isRateLimited(identifier: string, maxRequests = this.MAX_REQUESTS): boolean {
    const now = Date.now();
    const windowStart = now - this.WINDOW_MS;

    // Clean up old entries
    for (const [key, data] of this.requests.entries()) {
      if (data.resetTime < windowStart) {
        this.requests.delete(key);
      }
    }

    const current = this.requests.get(identifier);
    
    if (!current || current.resetTime < windowStart) {
      // New window
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      });
      return false;
    }

    if (current.count >= maxRequests) {
      return true;
    }

    current.count++;
    return false;
  }

  static getRemainingRequests(identifier: string, maxRequests = this.MAX_REQUESTS): number {
    const current = this.requests.get(identifier);
    if (!current) return maxRequests;
    return Math.max(0, maxRequests - current.count);
  }

  static getResetTime(identifier: string): number {
    const current = this.requests.get(identifier);
    return current?.resetTime || Date.now();
  }
}

// CSRF protection
export class CSRFProtection {
  private static readonly SECRET = process.env.CSRF_SECRET || 'default-csrf-secret';
  private static readonly TOKEN_HEADER = 'X-CSRF-Token';
  private static readonly COOKIE_NAME = 'csrf-token';

  static generateToken(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return Buffer.from(`${timestamp}:${random}:${this.SECRET}`).toString('base64');
  }

  static validateToken(token: string, maxAge = 3600000): boolean { // 1 hour default
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [timestamp, random, secret] = decoded.split(':');
      
      if (secret !== this.SECRET) return false;
      
      const tokenAge = Date.now() - parseInt(timestamp);
      return tokenAge <= maxAge;
    } catch {
      return false;
    }
  }

  static addTokenToResponse(response: NextResponse): NextResponse {
    const token = this.generateToken();
    response.cookies.set(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
    });
    return response;
  }

  static validateRequest(request: NextRequest): boolean {
    const token = request.headers.get(this.TOKEN_HEADER) || 
                  request.cookies.get(this.COOKIE_NAME)?.value;
    
    if (!token) return false;
    return this.validateToken(token);
  }
}

// Security middleware utilities
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || 'unknown';
}

export function isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

export function isSEOTool(userAgent: string): boolean {
  const seoToolPatterns = [
    /screaming frog/i,
    /screamingfrog/i,
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /telegrambot/i,
    /semrushbot/i,
    /ahrefsbot/i,
    /mj12bot/i,
    /dotbot/i,
  ];
  
  return seoToolPatterns.some(pattern => pattern.test(userAgent));
}

// Security audit logging
export interface SecurityEvent {
  type: 'rate_limit' | 'csrf_violation' | 'xss_attempt' | 'sql_injection' | 'suspicious_request';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  url: string;
  timestamp: number;
  details?: Record<string, any>;
}

export class SecurityAuditor {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_EVENTS = 1000;

  static logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.events.push(securityEvent);

    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Log critical events immediately
    if (event.severity === 'critical') {
      console.error('CRITICAL SECURITY EVENT:', securityEvent);
    }

    // Send to monitoring system
    this.sendToMonitoring(securityEvent);
  }

  static getRecentEvents(count = 100): SecurityEvent[] {
    return this.events.slice(-count);
  }

  static getEventsByType(type: SecurityEvent['type']): SecurityEvent[] {
    return this.events.filter(event => event.type === type);
  }

  static getEventsByIP(ip: string): SecurityEvent[] {
    return this.events.filter(event => event.ip === ip);
  }

  private static async sendToMonitoring(event: SecurityEvent): Promise<void> {
    try {
      // Send to monitoring API
      if (typeof fetch !== 'undefined') {
        await fetch('/api/monitoring/security', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }).catch(() => {
          // Silently fail to avoid affecting security
        });
      }
    } catch (error) {
      // Silently fail
    }
  }
}

// Export main security utilities
export const security = {
  headers: SECURITY_HEADERS,
  csp: CSP_DIRECTIVES,
  validator: InputValidator,
  rateLimiter: RateLimiter,
  csrf: CSRFProtection,
  auditor: SecurityAuditor,
  applySecurityHeaders,
  createSecureResponse,
  generateCSPHeader,
  getClientIP,
  isBot,
  isSEOTool,
};
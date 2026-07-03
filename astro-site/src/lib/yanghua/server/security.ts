/* eslint-disable no-console */
/**
 * 复用旧站安全策略（framework-agnostic 版本）
 * - 安全响应头（CSP + 常见安全头）
 * - CSRF token：timestamp + random + secret（base64），支持过期校验
 *
 * 参考来源（旧站 Next 实现）：
 * - `yanghua-b2b-website/src/lib/security.ts`
 */

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://vercel.live',
    'https://vitals.vercel-analytics.com',
  ],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'blob:', 'https:', 'https://images.unsplash.com', 'https://res.cloudinary.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
  'connect-src': ["'self'", 'https://www.google-analytics.com', 'https://vitals.vercel-analytics.com', 'wss://ws.vercel.live'],
  'frame-src': ["'self'", 'https://www.youtube.com', 'https://player.vimeo.com'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
} as const;

export function generateCSPHeader(directives: typeof CSP_DIRECTIVES = CSP_DIRECTIVES): string {
  return Object.entries(directives)
    .map(([directive, sources]) => {
      if (!sources || sources.length === 0) return directive;
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': generateCSPHeader(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=()',
    'usb=()',
  ].join(', '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'cross-origin',
};

function resolveCsrfSecret(): string {
  const secret = process.env.CSRF_SECRET || '';
  if (import.meta.env.PROD && secret.length < 32) {
    throw new Error('CSRF_SECRET must be set to at least 32 characters in production.');
  }
  return secret || 'development-csrf-secret';
}

/**
 * 为 Response 添加安全头。注意：Fetch Response 对象的 header 可能在部分运行时不可变，
 * 因此这里优先尝试原地写入；如果失败再回退为拷贝后的新 Response。
 */
export function applySecurityHeaders(response: Response): Response {
  try {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value);
    }
    return response;
  } catch {
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(key, value);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}

function base64Encode(input: string): string {
  // Node 环境优先使用 Buffer
  if (typeof (globalThis as any).Buffer !== 'undefined') {
    return (globalThis as any).Buffer.from(input).toString('base64');
  }
  // fallback（理论上不会走到）
  return btoa(input);
}

function base64Decode(input: string): string {
  if (typeof (globalThis as any).Buffer !== 'undefined') {
    return (globalThis as any).Buffer.from(input, 'base64').toString();
  }
  return atob(input);
}

export class CSRFProtection {
  static readonly TOKEN_HEADER = 'X-CSRF-Token';
  static readonly COOKIE_NAME = 'csrf-token';

  static generateToken(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return base64Encode(`${timestamp}:${random}:${resolveCsrfSecret()}`);
  }

  static validateToken(token: string, maxAgeMs = 60 * 60 * 1000): boolean {
    try {
      const decoded = base64Decode(token);
      const [timestamp, _random, secret] = decoded.split(':');
      if (secret !== resolveCsrfSecret()) return false;
      const tokenAge = Date.now() - parseInt(timestamp, 10);
      return tokenAge <= maxAgeMs;
    } catch {
      return false;
    }
  }

  static getTokenFromRequest(request: Request, cookieToken?: string | null): string | null {
    return request.headers.get(this.TOKEN_HEADER) || cookieToken || null;
  }

  static validateRequest(request: Request, cookieToken?: string | null): boolean {
    const token = this.getTokenFromRequest(request, cookieToken);
    if (!token) return false;
    return this.validateToken(token);
  }
}

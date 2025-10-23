import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from '../i18n';
import { 
  applySecurityHeaders, 
  RateLimiter, 
  CSRFProtection, 
  SecurityAuditor, 
  getClientIP, 
  isBot,
  isSEOTool,
  InputValidator 
} from './lib/security';
import { monitoring } from './lib/monitoring';

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  // 始终使用语言前缀，与 app/[locale] 路由结构一致，避免默认语言无前缀导致的循环
  localePrefix: 'always',
  // 显式配置本地化路径名映射，确保 /es/productos 映射到路由 /[locale]/products
  pathnames: {
    '/': '/',
    '/about': { en: '/about', es: '/acerca-de' },
    '/products': { en: '/products', es: '/productos' },
    '/products/[id]': { en: '/products/[id]', es: '/productos/[id]' },
    '/solutions': { en: '/solutions', es: '/soluciones' },
    '/solutions/[id]': { en: '/solutions/[id]', es: '/soluciones/[id]' },
    '/services': { en: '/services', es: '/servicios' },
    '/projects': { en: '/projects', es: '/proyectos' },
    '/projects/[id]': { en: '/projects/[id]', es: '/proyectos/[id]' },
    '/contact': { en: '/contact', es: '/contacto' },
    '/articles': { en: '/articles', es: '/articulos' },
    '/articles/[slug]': { en: '/articles/[slug]', es: '/articulos/[slug]' },
    '/products/category': { en: '/products/category', es: '/productos/categoria' }
  }
});

export default async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;
  console.log('[Middleware] invoked for path:', pathname);

  // Skip middleware for static assets and API routes that don't need security
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/videos/') ||
    pathname.startsWith('/data/') ||
    pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next();
  }

  try {
    // 1. Rate limiting
    const rateLimitKey = `${clientIP}:${pathname}`;
    const isRateLimited = RateLimiter.isRateLimited(rateLimitKey);
    
    if (isRateLimited) {
      SecurityAuditor.logEvent({
        type: 'rate_limit',
        severity: 'medium',
        ip: clientIP,
        userAgent,
        url: request.url,
        details: { pathname },
      });

      const response = new NextResponse('Too Many Requests', { status: 429 });
      response.headers.set('Retry-After', '900'); // 15 minutes
      return applySecurityHeaders(response);
    }

    // 2. Bot detection and handling
    if (isBot(userAgent)) {
      monitoring.logger.info('Bot detected', {
        ip: clientIP,
        userAgent,
        pathname,
      });

      // Check if it's a legitimate SEO tool
      if (isSEOTool(userAgent)) {
        monitoring.logger.info('SEO tool detected', {
          ip: clientIP,
          userAgent,
          pathname,
        });

        // Allow SEO tools with more generous rate limiting
        const seoRateLimitKey = `seo:${clientIP}`;
        if (RateLimiter.isRateLimited(seoRateLimitKey, 500)) { // 500 requests per window for SEO tools
          return new NextResponse('SEO Tool Rate Limited', { status: 429 });
        }
      } else {
        // Apply stricter rate limiting for other bots
        const botRateLimitKey = `bot:${clientIP}`;
        if (RateLimiter.isRateLimited(botRateLimitKey, 10)) { // 10 requests per window for other bots
          return new NextResponse('Bot Rate Limited', { status: 429 });
        }
      }
    }

    // 3. CSRF protection for POST requests
    if (request.method === 'POST' && pathname.startsWith('/api/')) {
      if (!CSRFProtection.validateRequest(request)) {
        SecurityAuditor.logEvent({
          type: 'csrf_violation',
          severity: 'high',
          ip: clientIP,
          userAgent,
          url: request.url,
        });

        const response = new NextResponse('CSRF Token Invalid', { status: 403 });
        return applySecurityHeaders(response);
      }
    }

    // 4. Input validation for form submissions
    if (request.method === 'POST' && request.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await request.json();
        const validation = InputValidator.validateFormData(body);
        
        if (!validation.isValid) {
          SecurityAuditor.logEvent({
            type: 'suspicious_request',
            severity: 'medium',
            ip: clientIP,
            userAgent,
            url: request.url,
            details: { errors: validation.errors },
          });

          const response = NextResponse.json(
            { error: 'Invalid input data', details: validation.errors },
            { status: 400 }
          );
          return applySecurityHeaders(response);
        }

        // Create new request with sanitized data
        const sanitizedRequest = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(validation.sanitized),
        });
        
        request = sanitizedRequest;
      } catch (error) {
        // If JSON parsing fails, continue with original request
      }
    }

    // 5. 301 重定向：将旧的西语本地化路径统一到英文段规范路径
    // 例：/es/productos -> /es/products；/es/soluciones -> /es/solutions 等
    const legacyEsMappings: Array<{ from: RegExp; to: (m: RegExpMatchArray) => string }> = [
      // 将英文段在西语站的路径统一到西语翻译段（规范）
      { from: /^\/es\/products(\/.*)?$/i, to: (m) => `/es/productos${m[1] || ''}` },
      { from: /^\/es\/solutions(\/.*)?$/i, to: (m) => `/es/soluciones${m[1] || ''}` },
      { from: /^\/es\/services(\/.*)?$/i, to: (m) => `/es/servicios${m[1] || ''}` },
      { from: /^\/es\/projects(\/.*)?$/i, to: (m) => `/es/proyectos${m[1] || ''}` },
      { from: /^\/es\/contact(\/.*)?$/i, to: (m) => `/es/contacto${m[1] || ''}` },
      { from: /^\/es\/about(\/.*)?$/i, to: (m) => `/es/acerca-de${m[1] || ''}` },
      { from: /^\/es\/articles(\/.*)?$/i, to: (m) => `/es/articulos${m[1] || ''}` },
      // 分类与细分路径
      { from: /^\/es\/products\/category(\/.*)?$/i, to: (m) => `/es/productos/categoria${m[1] || ''}` },
    ];

    for (const rule of legacyEsMappings) {
      const match = pathname.match(rule.from);
      if (match) {
        console.log('[Middleware] 301 redirect legacy ES path:', pathname);
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = rule.to(match);
        return applySecurityHeaders(NextResponse.redirect(redirectUrl, 301));
      }
    }

    // 6. 西语翻译段动态路径 -> 路由内部英文段的 rewrite（不改变URL，避免30x，保证页面可访问）
    const esRewriteMappings: Array<{ from: RegExp; to: (m: RegExpMatchArray) => string }> = [
      { from: /^\/es\/productos\/categoria(\/.*)?$/i, to: (m) => `/es/products/category${m[1] || ''}` },
      { from: /^\/es\/productos\/(.+)$/i, to: (m) => `/es/products/${m[1]}` },
      { from: /^\/es\/soluciones\/(.+)$/i, to: (m) => `/es/solutions/${m[1]}` },
      { from: /^\/es\/proyectos\/(.+)$/i, to: (m) => `/es/projects/${m[1]}` },
      { from: /^\/es\/articulos\/(.+)$/i, to: (m) => `/es/articles/${m[1]}` }
    ];

    for (const rule of esRewriteMappings) {
      const match = pathname.match(rule.from);
      if (match) {
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = rule.to(match);
        console.log('[Middleware] rewrite ES translated path -> internal route:', pathname, '=>', rewriteUrl.pathname);
        return applySecurityHeaders(NextResponse.rewrite(rewriteUrl));
      }
    }

    // 7. Security headers and internationalization
    let response: NextResponse;

    // Apply internationalization middleware
    if (pathname.startsWith('/api/')) {
      // For API routes, just create a basic response
      response = NextResponse.next();
    } else {
      // For pages, apply internationalization
      response = intlMiddleware(request);
    }

    // 8. Apply security headers
    response = applySecurityHeaders(response);

    // 9. Add CSRF token for GET requests
    if (request.method === 'GET' && !pathname.startsWith('/api/')) {
      response = CSRFProtection.addTokenToResponse(response);
    }

    // 10. Add performance and security headers
    const processingTime = Date.now() - startTime;
    response.headers.set('X-Response-Time', `${processingTime}ms`);
    response.headers.set('X-Request-ID', Math.random().toString(36).substring(2, 15));

    // 11. Log request for monitoring
    monitoring.logger.info('Request processed', {
      method: request.method,
      pathname,
      ip: clientIP,
      userAgent,
      processingTime,
      status: response.status,
    });

    return response;

  } catch (error) {
    // Log security middleware errors
    SecurityAuditor.logEvent({
      type: 'suspicious_request',
      severity: 'high',
      ip: clientIP,
      userAgent,
      url: request.url,
      details: { 
        error: error instanceof Error ? error.message : String(error),
        middleware: 'security',
      },
    });

    monitoring.error.reportError(error instanceof Error ? error : new Error(String(error)), 'high', {
      middleware: 'security',
      pathname,
      ip: clientIP,
    });

    // Fallback to basic response with security headers
    const response = NextResponse.next();
    return applySecurityHeaders(response);
  }
}

export const config = {
  matcher: [
    // 拦截所有路径（交给函数内自行跳过静态资源与API）
    '/:path*',
  ],
};
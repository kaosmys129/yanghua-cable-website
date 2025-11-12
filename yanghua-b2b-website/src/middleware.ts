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
  // 使用 always：包括英文在内的所有语言都使用前缀（/en、/es），避免 / 与 /en 并存
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
    '/partners': { en: '/partners', es: '/socios' },
    '/contact': { en: '/contact', es: '/contacto' },
    '/articles': { en: '/articles', es: '/articulos' },
    '/articles/[slug]': { en: '/articles/[slug]', es: '/articulos/[slug]' },
    '/articles/hub': { en: '/articles/hub', es: '/articulos/hub' },
    '/articles/hub/[slug]': { en: '/articles/hub/[slug]', es: '/articulos/hub/[slug]' },
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
    // A. 方案B：对指定的旧URL返回 410 Gone（永久移除）
    // 列表来源：用户提供的7个 /en 前缀URL（当前均为404），明确标记为已删除
    const goneUrlPatterns: RegExp[] = [
      /^\/en\/products\/low-smoke-halogen-free-cables\/?$/i,
      /^\/en\/products\/fire-resistant-cables\/?$/i,
      /^\/en\/products\/general-purpose-cables\/?$/i,
      /^\/en\/projects\/data-center-power-distribution-system\/?$/i,
      /^\/en\/projects\/30mw-wind-power-project\/?$/i,
      /^\/en\/projects\/industrial-plant-renovation-project\/?$/i,
      /^\/en\/products\/category\/flexible-busbar-systems-accessories\/?$/i,
    ];

    if (goneUrlPatterns.some((re) => re.test(pathname))) {
      console.log('[Middleware] 410 Gone for removed URL:', pathname);
      const res = new NextResponse(
        '410 Gone - This URL has been permanently removed. Please visit our Products, Projects, or Home page for current content.',
        { status: 410 }
      );
      // 保持语言上下文为英文
      res.cookies.set('NEXT_LOCALE', 'en', { path: '/' });
      // 缓存一段时间，减少重复抓取（可按需调整）
      res.headers.set('Cache-Control', 'public, max-age=86400');
      return applySecurityHeaders(res);
    }

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
    monitoring.crawl.record({ ip: clientIP, userAgent, pathname, isSeoTool: isSEOTool(userAgent) });

      // Check if it's a legitimate SEO tool
    if (isSEOTool(userAgent)) {
      monitoring.logger.info('SEO tool detected', {
        ip: clientIP,
        userAgent,
        pathname,
      });
      monitoring.crawl.record({ ip: clientIP, userAgent, pathname, isSeoTool: true });

        // Allow SEO tools with more generous rate limiting
        const seoRateLimitKey = `seo:${clientIP}`;
        if (RateLimiter.isRateLimited(seoRateLimitKey, 500)) { // 500 requests per window for SEO tools
          return new NextResponse('SEO Tool Rate Limited', { status: 429 });
        }
      } else {
        // Apply stricter rate limiting for other bots, but allow some requests for testing
        const botRateLimitKey = `bot:${clientIP}`;
        if (RateLimiter.isRateLimited(botRateLimitKey, 50)) { // Increased from 10 to 50 requests per window for other bots
          return new NextResponse('Bot Rate Limited', { status: 429 });
        }
      }
    }

    // 3. CSRF protection for POST requests
    if (request.method === 'POST' && pathname.startsWith('/api/') && !pathname.startsWith('/api/monitoring/errors')) {
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

    // 5. 当访问未带语言前缀的英文路由段（/solutions 等）时，统一重定向到 /en/*
    if (!pathname.startsWith('/en/') && !pathname.startsWith('/es/') && pathname !== '/') {
      const englishRootPatterns: RegExp[] = [
        /^\/about(\/.*)?$/i,
        /^\/products(\/.*)?$/i,
        /^\/solutions(\/.*)?$/i,
        /^\/services(\/.*)?$/i,
        /^\/projects(\/.*)?$/i,
        /^\/partners(\/.*)?$/i,
        /^\/contact(\/.*)?$/i,
        /^\/articles(\/.*)?$/i,
        /^\/privacy(\/.*)?$/i,
        /^\/terms(\/.*)?$/i,
        /^\/products\/category(\/.*)?$/i
      ];
      if (englishRootPatterns.some(re => re.test(pathname))) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = `/en${pathname}`;
        // 移除可能存在的语言偏好影响，固定跳转到英文
        redirectUrl.searchParams.delete('hl');
        return applySecurityHeaders(NextResponse.redirect(redirectUrl, 308));
      }
    }

    // 6. 301 重定向：将旧的西语本地化路径统一到西语翻译段规范路径
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

    // 7. 西语翻译段动态路径 -> 路由内部英文段的 rewrite（不改变URL，避免30x，保证页面可访问）
    const esRewriteMappings: Array<{ from: RegExp; to: (m: RegExpMatchArray) => string }> = [
      // Top-level Spanish segments -> internal English route segments (rewrite, no URL change)
      { from: /^\/es\/productos\/?$/i, to: () => `/es/products` },
      { from: /^\/es\/soluciones\/?$/i, to: () => `/es/solutions` },
      { from: /^\/es\/servicios\/?$/i, to: () => `/es/services` },
      { from: /^\/es\/proyectos\/?$/i, to: () => `/es/projects` },
      { from: /^\/es\/contacto\/?$/i, to: () => `/es/contact` },
      { from: /^\/es\/acerca-de\/?$/i, to: () => `/es/about` },
      { from: /^\/es\/articulos\/?$/i, to: () => `/es/articles` },
      { from: /^\/es\/socios\/?$/i, to: () => `/es/partners` },
      { from: /^\/es\/privacidad\/?$/i, to: () => `/es/privacy` },
      { from: /^\/es\/terminos\/?$/i, to: () => `/es/terms` },

      // Nested segments
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

    // 8.1 301 重定向：将英文站点下带 -es 的西语文章路径统一到西语规范路径
    // 例如：/en/articles/foo-es -> /es/articulos/foo-es
    const enEsArticleMatch = pathname.match(/^\/en\/articles\/(.+-es)\/?$/i);
    if (enEsArticleMatch) {
      const slugEs = enEsArticleMatch[1];
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = `/es/articulos/${slugEs}`;
      console.log('[Middleware] 301 redirect EN -es article to ES canonical:', pathname, '=>', redirectUrl.pathname);
      return applySecurityHeaders(NextResponse.redirect(redirectUrl, 301));
    }

    // 8. Security headers and internationalization
    let response: NextResponse;

    // Apply internationalization middleware
    if (pathname.startsWith('/api/')) {
      // For API routes, just create a basic response
      response = NextResponse.next();
    } else {
      // For pages, apply internationalization
      response = intlMiddleware(request);
    }

    // 9. Apply security headers
    response = applySecurityHeaders(response);

    // 10. Add CSRF token for GET requests
    if (request.method === 'GET' && !pathname.startsWith('/api/')) {
      response = CSRFProtection.addTokenToResponse(response);
    }

    // 11. Add performance and security headers
    const processingTime = Date.now() - startTime;
    response.headers.set('X-Response-Time', `${processingTime}ms`);
    response.headers.set('X-Request-ID', Math.random().toString(36).substring(2, 15));

    // 12. Log request for monitoring
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

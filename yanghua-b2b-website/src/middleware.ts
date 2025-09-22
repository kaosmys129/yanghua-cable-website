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
  InputValidator 
} from './lib/security';
import { monitoring } from './lib/monitoring';

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export default async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;

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

      // Allow legitimate bots but with stricter rate limiting
      const botRateLimitKey = `bot:${clientIP}`;
      if (RateLimiter.isRateLimited(botRateLimitKey, 10)) { // 10 requests per window for bots
        return new NextResponse('Bot Rate Limited', { status: 429 });
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

    // 5. Security headers and internationalization
    let response: NextResponse;

    // Apply internationalization middleware
    if (pathname.startsWith('/api/')) {
      // For API routes, just create a basic response
      response = NextResponse.next();
    } else {
      // For pages, apply internationalization
      response = intlMiddleware(request);
    }

    // 6. Apply security headers
    response = applySecurityHeaders(response);

    // 7. Add CSRF token for GET requests
    if (request.method === 'GET' && !pathname.startsWith('/api/')) {
      response = CSRFProtection.addTokenToResponse(response);
    }

    // 8. Add performance and security headers
    const processingTime = Date.now() - startTime;
    response.headers.set('X-Response-Time', `${processingTime}ms`);
    response.headers.set('X-Request-ID', Math.random().toString(36).substring(2, 15));

    // 9. Log request for monitoring
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
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - images, videos, data directories
    // - files with extensions
    '/((?!api|_next/static|_next/image|favicon.ico|images|videos|data|.*\.).*)',
    // Also match API routes for security
    '/api/(.*)',
  ],
};
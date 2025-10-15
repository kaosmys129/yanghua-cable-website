import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/lib/i18n';
import { authMiddleware } from './src/lib/auth-middleware';
import { generateCSPHeader } from './src/lib/security';
import { 
  getPageKeyFromPath, 
  getLocalizedPath, 
  LOCALIZED_PATHS 
} from './src/lib/url-localization';

const intlMiddleware = createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'as-needed'
});

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 添加调试日志
  console.log('Middleware called for:', pathname);
  
  // 明确排除所有静态资源，直接放行
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/videos') ||
    pathname.startsWith('/data') ||
    pathname.includes('.') // 所有包含点号的文件（图片、CSS、JS等）
  ) {
    console.log('Skipping middleware for static asset:', pathname);
    return NextResponse.next();
  }

  // 首先执行认证检查
  const authResponse = await authMiddleware(request);
  if (authResponse) {
    return authResponse;
  }

  // Handle root '/' redirect
  if (pathname === '/' || pathname === '') {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.redirect(url);
  }

  // URL本地化处理
  const urlRewriteResponse = handleUrlLocalization(request);
  if (urlRewriteResponse) {
    return urlRewriteResponse;
  }

  // 调用 next-intl 中间件
  console.log('Processing with intl middleware:', pathname);
  const response = intlMiddleware(request as any);

  // 添加安全头部
  if (response instanceof NextResponse) {
    const cspHeader = generateCSPHeader();
    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // CORS 头部（如果需要）
    if (pathname.startsWith('/api/')) {
      response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
  }

  return response;
}

/**
 * 处理URL本地化重写
 */
function handleUrlLocalization(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  
  // 提取语言代码和路径
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  
  const potentialLocale = segments[0];
  if (!locales.includes(potentialLocale as any)) return null;
  
  const locale = potentialLocale as typeof locales[number];
  const localizedPath = '/' + segments.slice(1).join('/');
  
  // 检查是否需要重写URL
  const pageKey = getPageKeyFromPath(pathname, locale);
  if (!pageKey) return null;
  
  // 获取标准路径
  const standardPath = LOCALIZED_PATHS[pageKey]?.en;
  if (!standardPath || standardPath === localizedPath) return null;
  
  // 执行URL重写
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${standardPath}`;
  
  console.log(`URL rewrite: ${pathname} -> ${url.pathname}`);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/((?!_next|api|images|videos|data|.*\.).*)',
  ]
};
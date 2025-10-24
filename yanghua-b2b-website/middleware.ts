import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/lib/i18n';
import { authMiddleware } from './src/lib/auth-middleware';
import { generateCSPHeader, CSRFProtection } from './src/lib/security';

const intlMiddleware = createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  // 强制使用子路径前缀，与 app/[locale] 结构一致，避免默认语言无前缀导致的循环
  localePrefix: 'always',
  // 禁用HTTP头部的hreflang生成，避免与HTML中的hreflang重复
  alternateLinks: false,
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
  const pathname = request.nextUrl.pathname;
  const pathParts = pathname.split('/').filter(Boolean);
  const pathLocale = (pathParts[0] || '').toLowerCase();
  const activeLocale = locales.includes(pathLocale as any) ? (pathLocale as typeof locales[number]) : defaultLocale;
  
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

  // 301 重定向：西语站下的英文段旧路径统一到西语翻译段（规范）
  // 例：/es/products -> /es/productos；/es/solutions -> /es/soluciones 等
  const legacyEsMappings: Array<{ from: RegExp; to: (m: RegExpMatchArray) => string }> = [
    // 一级路由（英文段 -> 西语翻译段）
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
      const url = request.nextUrl.clone();
      url.pathname = rule.to(match);
      // 使用 301 永久重定向，向搜索引擎明确规范 URL
      const res = NextResponse.redirect(url, 301);
      // 将活动语言写入 Cookie，确保 SSR 读取
      res.cookies.set('NEXT_LOCALE', 'es', { path: '/' });
      return res;
    }
  }

  // 西语翻译段动态路径 -> 路由内部英文段的 rewrite（不改变URL，避免30x，保证页面可访问）
  const esRewriteMappings: Array<{ from: RegExp; to: (m: RegExpMatchArray) => string }> = [
    { from: /^\/es\/productos\/categoria(\/.*)?$/i, to: (m) => `/es/products/category${m[1] || ''}` },
    { from: /^\/es\/productos\/(.+)$/i, to: (m) => `/es/products/${m[1]}` },
    { from: /^\/es\/soluciones\/(.+)$/i, to: (m) => `/es/solutions/${m[1]}` },
    { from: /^\/es\/proyectos\/(.+)$/i, to: (m) => `/es/projects/${m[1]}` },
    { from: /^\/es\/articulos\/(.+)$/i, to: (m) => `/es/articles/${m[1]}` },
  ];

  for (const rule of esRewriteMappings) {
    const match = pathname.match(rule.from);
    if (match) {
      const url = request.nextUrl.clone();
      url.pathname = rule.to(match);
      console.log('Rewrite ES translated path -> internal route:', pathname, '=>', url.pathname);
      const res = NextResponse.rewrite(url);
      res.cookies.set('NEXT_LOCALE', 'es', { path: '/' });
      return res;
    }
  }

  // 根路径：使用 rewrite 到默认语言，避免产生 30x
  if (pathname === '/' || pathname === '') {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    const res = NextResponse.rewrite(url);
    res.cookies.set('NEXT_LOCALE', defaultLocale, { path: '/' });
    return res;
  }

  // 调用 next-intl 中间件（现在包含pathnames配置）
  console.log('Processing with intl middleware:', pathname);
  let response = intlMiddleware(request as any);

  // 添加安全头部
  if (response instanceof NextResponse) {
    // 将当前活动语言写入 Cookie，提供给 SSR 根布局作为可靠来源
    response.cookies.set('NEXT_LOCALE', activeLocale, { path: '/' });
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

    // 为页面 GET 请求设置 CSRF cookie，便于后续 POST 通过校验
    if (request.method === 'GET' && !pathname.startsWith('/api/')) {
      response = CSRFProtection.addTokenToResponse(response);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|api|images|videos|data|.*\.).*)',
  ]
};
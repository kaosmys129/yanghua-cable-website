import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/lib/i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Debug
  console.log('[middleware] pathname:', pathname);
  console.log('[middleware] processing pathname:', pathname);

  // Skip static assets, API and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/videos') ||
    pathname.startsWith('/data') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/service-worker.js' ||
    /\.[a-zA-Z0-9]{2,5}$/.test(pathname) // files with extensions
  ) {
    return NextResponse.next();
  }

  // Handle /news to /articles redirect
  if (pathname === '/news' || pathname.startsWith('/news/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace('/news', `/${defaultLocale}/articles`);
    console.log('[middleware] redirect news to articles ->', url.pathname);
    return NextResponse.redirect(url);
  }

  // Handle locale-prefixed /blogs paths - redirect to articles (check first)
  if (pathname.match(/^\/[a-z]{2}\/blogs(\/.*)?$/)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace('/blogs', '/articles');
    console.log('[middleware] redirect locale blogs to articles ->', url.pathname);
    const response = NextResponse.redirect(url);
    response.headers.set('X-Middleware-Debug', 'locale-blogs-redirect');
    return response;
  }

  // Handle /blogs and /blogs/[id] paths - redirect to articles
  if (pathname === '/blogs' || pathname.startsWith('/blogs/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace('/blogs', `/${defaultLocale}/articles`);
    console.log('[middleware] redirect blogs to articles ->', url.pathname);
    return NextResponse.redirect(url);
  }
  
  // Handle /articles and /articles/[id] paths without locale prefix
  if (pathname === '/articles' || pathname.startsWith('/articles/')) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    console.log('[middleware] redirect articles ->', url.pathname);
    return NextResponse.redirect(url);
  }
  
  // Handle /projects and /projects/[id] paths without locale prefix
  if (pathname === '/projects' || pathname.startsWith('/projects/')) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    console.log('[middleware] redirect projects ->', url.pathname);
    return NextResponse.redirect(url);
  }

  // Handle root '/' redirect
  if (pathname === '/' || pathname === '') {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    console.log('[middleware] redirect ->', url.pathname);
    return NextResponse.redirect(url);
  }

  // Fallback to next-intl middleware for all other paths
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ]
};
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/lib/i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Debug
  console.log('[middleware] pathname:', pathname);

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

  // Handle /news and /news/[id] paths without locale prefix
  if (pathname === '/news' || pathname.startsWith('/news/')) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    console.log('[middleware] redirect news ->', url.pathname);
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
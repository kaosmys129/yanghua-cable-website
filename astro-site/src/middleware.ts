import { defineMiddleware } from 'astro:middleware';

const GONE_URL_PATTERNS: RegExp[] = [
  /^\/en\/products\/low-smoke-halogen-free-cables\/?$/i,
  /^\/en\/products\/fire-resistant-cables\/?$/i,
  /^\/en\/products\/general-purpose-cables\/?$/i,
  /^\/en\/projects\/data-center-power-distribution-system\/?$/i,
  /^\/en\/projects\/30mw-wind-power-project\/?$/i,
  /^\/en\/projects\/industrial-plant-renovation-project\/?$/i,
  /^\/en\/products\/category\/flexible-busbar-systems-accessories\/?$/i,
];

const ENGLISH_ROOT_PATTERNS: RegExp[] = [
  /^\/about(\/.*)?$/i,
  /^\/services(\/.*)?$/i,
  /^\/projects(\/.*)?$/i,
  /^\/partners(\/.*)?$/i,
  /^\/contact(\/.*)?$/i,
  /^\/articles(\/.*)?$/i,
  /^\/privacy(\/.*)?$/i,
  /^\/terms(\/.*)?$/i,
  /^\/products(\/.*)?$/i,
  /^\/solutions(\/.*)?$/i,
];

const LEGACY_ES_MAPPINGS: Array<{ from: RegExp; to: (m: RegExpMatchArray) => string }> = [
  { from: /^\/es\/products(\/.*)?$/i, to: (m) => `/es/productos${m[1] || ''}` },
  { from: /^\/es\/solutions(\/.*)?$/i, to: (m) => `/es/soluciones${m[1] || ''}` },
  { from: /^\/es\/services(\/.*)?$/i, to: (m) => `/es/servicios${m[1] || ''}` },
  { from: /^\/es\/projects(\/.*)?$/i, to: (m) => `/es/proyectos${m[1] || ''}` },
  { from: /^\/es\/contact(\/.*)?$/i, to: (m) => `/es/contacto${m[1] || ''}` },
  { from: /^\/es\/about(\/.*)?$/i, to: (m) => `/es/acerca-de${m[1] || ''}` },
  { from: /^\/es\/products\/category(\/.*)?$/i, to: (m) => `/es/productos/categoria${m[1] || ''}` },
];

function isLikelyAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap') ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (isLikelyAssetPath(pathname)) return next();

  // 1) 410 Gone
  if (GONE_URL_PATTERNS.some((re) => re.test(pathname))) {
    return new Response(
      '410 Gone - This URL has been permanently removed. Please visit our Products, Projects, or Home page for current content.',
      {
        status: 410,
        headers: {
          'Cache-Control': 'public, max-age=86400',
          'Content-Type': 'text/plain; charset=utf-8',
        },
      }
    );
  }

  // 2) / -> /en（保持与旧站“默认语言也带前缀”的策略一致）
  if (pathname === '/') {
    return context.redirect('/en', 308);
  }

  // 3) 无语言前缀的英文段 → /en 前缀（308）
  if (!pathname.startsWith('/en') && !pathname.startsWith('/es')) {
    if (ENGLISH_ROOT_PATTERNS.some((re) => re.test(pathname))) {
      return context.redirect(`/en${pathname}`, 308);
    }
  }

  // 4) /es 下出现英文段 → 301 到西语翻译段
  for (const rule of LEGACY_ES_MAPPINGS) {
    const match = pathname.match(rule.from);
    if (match) {
      return context.redirect(rule.to(match), 301);
    }
  }

  // 5) 英文站下带 -es 的文章 → 西语 canonical（旧站行为）
  const enEsArticleMatch = pathname.match(/^\/en\/articles\/(.+-es)\/?$/i);
  if (enEsArticleMatch) {
    return context.redirect(`/es/articulos/${enEsArticleMatch[1]}`, 301);
  }

  return next();
});


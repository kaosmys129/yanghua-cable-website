import type { Locale } from './loaders';

/**
 * 与旧站 `url-localization.ts` 语义对齐的最小路由表。
 * 约束：URL 必须是对外真实路径（西语使用翻译段，如 productos）。
 */
export const ROUTES = {
  home: { en: '/en', es: '/es' },
  about: { en: '/en/about', es: '/es/acerca-de' },
  services: { en: '/en/services', es: '/es/servicios' },
  contact: { en: '/en/contact', es: '/es/contacto' },
  partners: { en: '/en/partners', es: '/es/socios' },
  products: { en: '/en/products', es: '/es/productos' },
  productCategory: { en: '/en/products/category', es: '/es/productos/categoria' },
  solutions: { en: '/en/solutions', es: '/es/soluciones' },
  projects: { en: '/en/projects', es: '/es/proyectos' },
  articles: { en: '/en/articles', es: '/es/articulos' },
  hubs: { en: '/en/articles/hub', es: '/es/articulos/hub' },
  privacy: { en: '/en/privacy', es: '/es/privacidad' },
  terms: { en: '/en/terms', es: '/es/terminos' },
} as const;

export type RouteKey = keyof typeof ROUTES;

export function route(key: RouteKey, locale: Locale): string {
  return ROUTES[key][locale];
}

export function localeFromPathname(pathname: string): Locale | null {
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
  if (pathname === '/es' || pathname.startsWith('/es/')) return 'es';
  return null;
}

/**
 * en ↔ es URL 段映射，用于 Header 语言切换。
 * Key = en 段, Value = es 段（双向通过 Entry lookup）。
 */
const SEGMENT_MAP: Record<string, string> = {
  about: 'acerca-de',
  services: 'servicios',
  contact: 'contacto',
  products: 'productos',
  'products/category': 'productos/categoria',
  solutions: 'soluciones',
  projects: 'proyectos',
  articles: 'articulos',
  'articles/hub': 'articulos/hub',
  partners: 'socios',
  privacy: 'privacidad',
  terms: 'terminos',
};

const REVERSE_SEGMENT_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SEGMENT_MAP).map(([en, es]) => [es, en]),
);

/**
 * 根据当前路径和当前语言，返回另一语言的对应路径。
 * 无法匹配时 fallback 到目标语言首页。
 */
export function switchLocalePath(currentPath: string): string {
  const currentLocale = localeFromPathname(currentPath) ?? 'en';
  const targetLocale: Locale = currentLocale === 'en' ? 'es' : 'en';

  // 去掉语言前缀得到剩余路径段
  const unprefixed = currentPath.replace(/^\/(en|es)\/?/, '');

  if (!unprefixed) {
    // 就是首页
    return route('home', targetLocale);
  }

  // 尝试精确段映射
  const map = targetLocale === 'es' ? SEGMENT_MAP : REVERSE_SEGMENT_MAP;
  const mapped = map[unprefixed];
  if (mapped) {
    return `/${targetLocale}/${mapped}`;
  }

  // 尝试前缀匹配（如 /en/products/category/xxx → /es/productos/categoria/xxx）
  for (const [from, to] of Object.entries(map)) {
    if (unprefixed === from || unprefixed.startsWith(`${from}/`)) {
      const rest = unprefixed.slice(from.length);
      return `/${targetLocale}/${to}${rest}`;
    }
  }

  // Fallback
  return route('home', targetLocale);
}


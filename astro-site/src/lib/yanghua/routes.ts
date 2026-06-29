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


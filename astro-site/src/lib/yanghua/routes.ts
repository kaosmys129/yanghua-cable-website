import type { Locale } from './loaders';

/**
 * 与旧站 `url-localization.ts` 语义对齐的最小路由表。
 * 约束：URL 必须是对外真实路径（西语使用翻译段，如 productos）。
 */
export const ROUTES = {
  home: { en: '/en', es: '/es', pt: '/pt' },
  about: { en: '/en/about', es: '/es/acerca-de', pt: '/pt/sobre' },
  services: { en: '/en/services', es: '/es/servicios', pt: '/pt/servicos' },
  contact: { en: '/en/contact', es: '/es/contacto', pt: '/pt/contato' },
  partners: { en: '/en/partners', es: '/es/socios', pt: '/pt/parceiros' },
  products: { en: '/en/products', es: '/es/productos', pt: '/pt/produtos' },
  productCategory: { en: '/en/products/category', es: '/es/productos/categoria', pt: '/pt/produtos/categoria' },
  solutions: { en: '/en/solutions', es: '/es/soluciones', pt: '/pt/solucoes' },
  projects: { en: '/en/projects', es: '/es/proyectos', pt: '/pt/projetos' },
  articles: { en: '/en/articles', es: '/es/articulos', pt: '/pt/artigos' },
  hubs: { en: '/en/articles/hub', es: '/es/articulos/hub', pt: '/pt/artigos/hub' },
  privacy: { en: '/en/privacy', es: '/es/privacidad', pt: '/pt/privacidade' },
  terms: { en: '/en/terms', es: '/es/terminos', pt: '/pt/termos' },
} as const;

export type RouteKey = keyof typeof ROUTES;

export function route(key: RouteKey, locale: Locale): string {
  return ROUTES[key][locale];
}

export function localeFromPathname(pathname: string): Locale | null {
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
  if (pathname === '/es' || pathname.startsWith('/es/')) return 'es';
  if (pathname === '/pt' || pathname.startsWith('/pt/')) return 'pt';
  return null;
}

// en -> es 映射
const ES_SEGMENT_MAP: Record<string, string> = {
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
const REVERSE_ES_MAP = Object.fromEntries(
  Object.entries(ES_SEGMENT_MAP).map(([en, es]) => [es, en])
);

// en -> pt 映射
const PT_SEGMENT_MAP: Record<string, string> = {
  about: 'sobre',
  services: 'servicos',
  contact: 'contato',
  products: 'produtos',
  'products/category': 'produtos/categoria',
  solutions: 'solucoes',
  projects: 'projetos',
  articles: 'artigos',
  'articles/hub': 'artigos/hub',
  partners: 'parceiros',
  privacy: 'privacidade',
  terms: 'termos',
};
const REVERSE_PT_MAP = Object.fromEntries(
  Object.entries(PT_SEGMENT_MAP).map(([en, pt]) => [pt, en])
);

/**
 * 根据当前路径和目标语言，返回目标语言的对应路径。
 * 无法匹配时 fallback 到目标语言首页。
 */
export function switchLocalePath(currentPath: string, targetLocale: Locale): string {
  const currentLocale = localeFromPathname(currentPath) ?? 'en';
  if (currentLocale === targetLocale) return currentPath;

  // 1. 去掉当前语言前缀，获得未带前缀的路径
  const unprefixed = currentPath.replace(/^\/(en|es|pt)\/?/, '');
  if (!unprefixed) {
    return route('home', targetLocale);
  }

  // 2. 先把 unprefixed 转换为英文规范路径 (English Segment)
  let enSegment = unprefixed;
  if (currentLocale === 'es') {
    if (REVERSE_ES_MAP[unprefixed]) {
      enSegment = REVERSE_ES_MAP[unprefixed];
    } else {
      for (const [es, en] of Object.entries(REVERSE_ES_MAP)) {
        if (unprefixed.startsWith(`${es}/`)) {
          enSegment = en + unprefixed.slice(es.length);
          break;
        }
      }
    }
  } else if (currentLocale === 'pt') {
    if (REVERSE_PT_MAP[unprefixed]) {
      enSegment = REVERSE_PT_MAP[unprefixed];
    } else {
      for (const [pt, en] of Object.entries(REVERSE_PT_MAP)) {
        if (unprefixed.startsWith(`${pt}/`)) {
          enSegment = en + unprefixed.slice(pt.length);
          break;
        }
      }
    }
  }

  // 3. 将英文规范路径转换为 targetLocale 的路径
  if (targetLocale === 'en') {
    return `/en/${enSegment}`;
  }

  const map = targetLocale === 'es' ? ES_SEGMENT_MAP : PT_SEGMENT_MAP;
  
  if (map[enSegment]) {
    return `/${targetLocale}/${map[enSegment]}`;
  }
  
  for (const [en, target] of Object.entries(map)) {
    if (enSegment === en || enSegment.startsWith(`${en}/`)) {
      const rest = enSegment.slice(en.length);
      return `/${targetLocale}/${target}${rest}`;
    }
  }

  // Fallback
  return route('home', targetLocale);
}

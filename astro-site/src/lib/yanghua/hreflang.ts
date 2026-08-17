/**
 * hreflang helper — builds accurate <link rel="alternate" hreflang> alternates
 * for the en / es / pt multilingual site.
 *
 * Why a dedicated module (instead of Astro's i18n routing):
 *  - The site uses directory-prefix locales (/en, /es, /pt) but several
 *    path segments are localized (articles/articulos/artigos,
 *    products/productos/produtos, …). A naive prefix swap would produce
 *    URLs that 404, which is worse than no hreflang at all.
 *  - For CMS-driven content (articles) the set of available locales varies
 *    per slug, so callers pass `availableLocales` computed from real data.
 */

import type { Locale } from './loaders';

export const LOCALES: Locale[] = ['en', 'es', 'pt'];
export const DEFAULT_LOCALE: Locale = 'en';

/** Localized first/second-segment translations (en → es / pt).
 *  Values are partial per-locale maps; the English segment is always the key
 *  itself, so `m?.[target] ?? seg` keeps English unchanged. */
const SEGMENT_MAP: Record<string, Partial<Record<Locale, string>>> = {
  articles: { es: 'articulos', pt: 'artigos' },
  products: { es: 'productos', pt: 'produtos' },
  category: { es: 'categoria', pt: 'categoria' },
  projects: { es: 'proyectos', pt: 'projetos' },
  solutions: { es: 'soluciones', pt: 'solucoes' },
  about: { es: 'acerca-de', pt: 'sobre' },
  contact: { es: 'contacto', pt: 'contato' },
  privacy: { es: 'privacidad', pt: 'privacidade' },
  terms: { es: 'terminos', pt: 'termos' },
  partners: { es: 'socios', pt: 'parceiros' },
  services: { es: 'servicios', pt: 'servicos' },
  faq: { es: 'preguntas-frecuentes', pt: 'perguntas-frequentes' },
  'what-is-flexible-busbar': { es: 'what-is-flexible-busbar', pt: 'what-is-flexible-busbar' },
};

/**
 * Pages that do NOT exist in every locale. Keyed by the English path.
 * Only the listed locales (plus x-default) get an alternate for these.
 */
const LOCALE_EXCEPTIONS: Record<string, Locale[]> = {
  '/en/services': ['en', 'pt'],
  '/en/faq': ['en', 'es'],
  '/en/what-is-flexible-busbar': ['en'],
};

export function detectLocale(pathname: string): Locale {
  if (pathname.startsWith('/es')) return 'es';
  if (pathname.startsWith('/pt')) return 'pt';
  return 'en';
}

function localePrefix(locale: Locale): string {
  return locale === 'en' ? '/en' : `/${locale}`;
}

/** Translate a pathname to a given locale, swapping known localized segments. */
export function translatePath(pathname: string, target: Locale): string {
  const stripped = pathname.replace(/^\/(en|es|pt)(?=\/|$)/, '');
  const segs = stripped.split('/').filter(Boolean);
  const translated = segs.map((seg) => {
    const englishSegment = Object.entries(SEGMENT_MAP).find(
      ([english, localized]) => seg === english || Object.values(localized).includes(seg)
    )?.[0] ?? seg;
    const m = SEGMENT_MAP[englishSegment];
    return target === 'en' ? englishSegment : m?.[target] ?? englishSegment;
  });
  const base = localePrefix(target);
  return translated.length ? `${base}/${translated.join('/')}` : base;
}

/**
 * Build the list of hreflang alternates for a page.
 * @param pathname   current request pathname (e.g. /en/products)
 * @param siteUrl     absolute site origin (Astro.site)
 * @param availableLocales  locales that actually have this page; for CMS
 *                          content this is computed from real data. When
 *                          omitted, structural exceptions are applied and all
 *                          three locales are assumed available otherwise.
 */
export function buildHreflangAlternates(
  pathname: string,
  siteUrl: string,
  availableLocales?: Locale[],
): { hreflang: string; href: string }[] {
  const enPath = translatePath(pathname, 'en');
  const allowed = availableLocales ?? LOCALE_EXCEPTIONS[enPath] ?? LOCALES;
  const out: { hreflang: string; href: string }[] = [];

  for (const loc of LOCALES) {
    if (!allowed.includes(loc)) continue;
    const href = new URL(translatePath(pathname, loc), siteUrl).href;
    out.push({ hreflang: loc, href });
  }

  // x-default should point to the English version.
  out.push({ hreflang: 'x-default', href: new URL(translatePath(pathname, 'en'), siteUrl).href });
  return out;
}

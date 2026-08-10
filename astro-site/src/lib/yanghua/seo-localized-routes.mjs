const SITE_ORIGIN = 'https://www.yhflexiblebusbar.com';

export const PRODUCT_CATEGORY_GROUPS = [
  {
    en: 'general-purpose-cables',
    es: 'cables-de-proposito-general',
    pt: 'cabos-de-uso-geral',
  },
  {
    en: 'fire-resistant-cables',
    es: 'cables-resistentes-al-fuego',
    pt: 'cabos-resistentes-ao-fogo',
  },
  {
    en: 'low-smoke-halogen-free-cables',
    es: 'cables-libres-de-humo-y-halogenos',
    pt: 'cabos-com-baixo-teor-de-fumaca-e-sem-halogenio',
  },
  {
    en: 'flexible-busbar-systems-accessories',
    es: 'accesorios-y-componentes',
    pt: 'sistemas-e-acessorios-de-barramentos-flexiveis',
  },
  // This category exists only in Spanish, so it must not point at unrelated pages.
  { es: 'cables-retardantes-de-llama' },
];

export const PRODUCT_CATEGORY_ALIASES = {
  en: {
    general: 'general-purpose-cables',
    'fire-resistant': 'fire-resistant-cables',
    'low-smoke-halogen-free': 'low-smoke-halogen-free-cables',
    'accessories-components': 'flexible-busbar-systems-accessories',
  },
  es: {
    'cables-de-uso-general': 'cables-de-proposito-general',
    general: 'cables-de-proposito-general',
    'fire-resistant': 'cables-resistentes-al-fuego',
    'flame-retardant': 'cables-retardantes-de-llama',
    'low-smoke-halogen-free': 'cables-libres-de-humo-y-halogenos',
    'accessories-components': 'accesorios-y-componentes',
  },
  pt: {},
};

export const SOLUTION_GROUPS = [
  { en: 'new-energy', es: 'new-energy', pt: 'new-energy' },
  { en: 'power-system', es: 'power-system', pt: 'power-system' },
  { en: 'manufacturing', es: 'manufacturing', pt: 'manufacturing' },
  { en: 'data-center', es: 'data-center', pt: 'data-center' },
  { en: 'charging-station', es: 'charging-station', pt: 'charging-station' },
  { en: 'metallurgy', es: 'metallurgy', pt: 'metallurgy' },
  { en: 'wind-farm', es: 'wind-farm', pt: 'wind-farm' },
];

const CATEGORY_PREFIX = {
  en: '/en/products/category',
  es: '/es/productos/categoria',
  pt: '/pt/produtos/categoria',
};

const SOLUTION_PREFIX = {
  en: '/en/solutions',
  es: '/es/soluciones',
  pt: '/pt/solucoes',
};

function buildAlternates(groups, prefixes, locale, slug) {
  const group = groups.find((candidate) => candidate[locale] === slug);
  if (!group) return [];

  const alternates = ['en', 'es', 'pt']
    .filter((candidateLocale) => group[candidateLocale])
    .map((candidateLocale) => ({
      hreflang: candidateLocale,
      href: `${SITE_ORIGIN}${prefixes[candidateLocale]}/${encodeURIComponent(group[candidateLocale])}`,
    }));

  const defaultLocale = group.en ? 'en' : locale;
  alternates.push({
    hreflang: 'x-default',
    href: `${SITE_ORIGIN}${prefixes[defaultLocale]}/${encodeURIComponent(group[defaultLocale])}`,
  });
  return alternates;
}

export function buildProductCategoryAlternates(locale, slug) {
  return buildAlternates(PRODUCT_CATEGORY_GROUPS, CATEGORY_PREFIX, locale, slug);
}

export function buildSolutionAlternates(locale, slug) {
  return buildAlternates(SOLUTION_GROUPS, SOLUTION_PREFIX, locale, slug);
}

export function buildProductCategoryRedirects() {
  return Object.fromEntries(
    Object.entries(PRODUCT_CATEGORY_ALIASES).flatMap(([locale, aliases]) =>
      Object.entries(aliases).map(([alias, canonical]) => [
        `${CATEGORY_PREFIX[locale]}/${alias}`,
        { status: 301, destination: `${CATEGORY_PREFIX[locale]}/${canonical}` },
      ])
    )
  );
}

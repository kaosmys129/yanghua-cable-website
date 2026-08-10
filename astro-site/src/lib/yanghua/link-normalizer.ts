import type { Locale } from './loaders';

const VALID_SOLUTION_IDS = new Set([
  'new-energy',
  'power-system',
  'manufacturing',
  'data-center',
  'charging-station',
  'metallurgy',
  'wind-farm',
]);

const SOLUTION_ALIAS_MAP: Record<string, string> = {
  'solar-pv': 'new-energy',
  'energy-storage': 'new-energy',
  'bipv': 'new-energy',
  'ev-charging': 'charging-station',
  'charging': 'charging-station',
  'infrastructure': 'power-system',
  'substation': 'power-system',
  'power-plant': 'power-system',
  'grid': 'power-system',
  'factory': 'manufacturing',
  'automation': 'manufacturing',
  'industrial': 'manufacturing',
  'data-center-pue': 'data-center',
  'pue': 'data-center',
  'steel': 'metallurgy',
  'smelting': 'metallurgy',
  'wind': 'wind-farm',
  'offshore-wind': 'wind-farm',
};

const CATEGORY_SLUG_MAP: Record<Locale, Record<string, string>> = {
  en: {
    'fire-resistant': 'fire-resistant-cables',
    'accessories-components': 'accessories-components',
    'general': 'general',
    'low-smoke-halogen-free': 'low-smoke-halogen-free-cables',
    'flame-retardant': 'flame-retardant',
  },
  es: {
    'fire-resistant': 'cables-resistentes-al-fuego',
    'accessories-components': 'accesorios-y-componentes',
    'general': 'cables-de-uso-general',
    'low-smoke-halogen-free': 'cables-libres-de-humo-y-halogenos',
    'flame-retardant': 'cables-retardantes-de-llama',
  },
  pt: {
    'fire-resistant': 'cabos-resistentes-ao-fogo',
    'accessories-components': 'acessorios-e-componentes',
    'general': 'cabos-de-uso-geral',
    'low-smoke-halogen-free': 'cabos-livres-de-fumo-e-halogenos',
    'flame-retardant': 'cabos-retardantes-de-chama',
  },
};

export function normalizeSolutionHref(id: string, locale: Locale = 'en'): string {
  const base = locale === 'es' ? '/es/soluciones' : locale === 'pt' ? '/pt/solucoes' : '/en/solutions';
  const cleanId = id.trim().toLowerCase();

  if (VALID_SOLUTION_IDS.has(cleanId)) {
    return `${base}/${cleanId}`;
  }

  const mapped = SOLUTION_ALIAS_MAP[cleanId];
  if (mapped && VALID_SOLUTION_IDS.has(mapped)) {
    return `${base}/${mapped}`;
  }

  return base;
}

export function normalizeProductHref(id: string, locale: Locale = 'en'): string {
  const base = locale === 'es' ? '/es/productos' : locale === 'pt' ? '/pt/produtos' : '/en/products';
  const cleanId = id.trim().toLowerCase();

  const categoryMap = CATEGORY_SLUG_MAP[locale] || CATEGORY_SLUG_MAP.en;
  if (categoryMap[cleanId]) {
    const catBase = locale === 'es' ? '/es/productos/categoria' : locale === 'pt' ? '/pt/produtos/categoria' : '/en/products/category';
    return `${catBase}/${categoryMap[cleanId]}`;
  }

  return base;
}

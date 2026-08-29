const DEFAULT_BRAND_NAME = 'Yanghua Cable';
const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 160;

function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/gu, ' ').trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function removeTrailingBrand(title, brandName) {
  let result = normalizeWhitespace(title);
  const candidates = [brandName, DEFAULT_BRAND_NAME, 'Yanghua', 'YanghuaSTI']
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);

  let removedBrand = true;
  while (removedBrand) {
    removedBrand = false;
    for (const candidate of candidates) {
      const pattern = new RegExp(`(?:\\s*[|—–-]\\s*)?${escapeRegExp(candidate)}\\s*$`, 'iu');
      if (!pattern.test(result)) continue;
      result = result.replace(pattern, '').replace(/[|—–-]\s*$/u, '').trim();
      removedBrand = true;
      break;
    }
  }

  return result;
}

function removeBrandMentions(title, brandName) {
  let result = removeTrailingBrand(title, brandName);
  const candidates = [brandName, DEFAULT_BRAND_NAME, 'YanghuaSTI', 'Yanghua']
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);

  for (const candidate of candidates) {
    result = result.replace(new RegExp(escapeRegExp(candidate), 'giu'), ' ');
  }

  return result
    .replace(/^\s*(?:[|:—–-]\s*)+/u, '')
    .replace(/\s*(?:[|:—–-])\s*$/u, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function shortenAtBoundary(value, maxLength) {
  const text = normalizeWhitespace(value);
  const characters = Array.from(text);
  if (characters.length <= maxLength) return text;

  const clipped = characters.slice(0, Math.max(1, maxLength - 1)).join('').trim();
  const boundary = clipped.lastIndexOf(' ');
  const prefix = boundary >= Math.floor(clipped.length * 0.55)
    ? clipped.slice(0, boundary).trim()
    : clipped;
  return `${prefix}…`;
}

export function normalizeSeoTitle(title, brandName = DEFAULT_BRAND_NAME) {
  const brand = normalizeWhitespace(brandName) || DEFAULT_BRAND_NAME;
  const base = removeBrandMentions(title, brand);
  if (!base || base.toLocaleLowerCase() === brand.toLocaleLowerCase()) return brand;

  const suffix = ` — ${brand}`;
  const available = MAX_TITLE_LENGTH - Array.from(suffix).length;
  if (Array.from(base).length <= available) return `${base}${suffix}`;

  return `${shortenAtBoundary(base, available)}${suffix}`;
}

export function normalizeMetaDescription(description, fallbackDescription = '') {
  const source = normalizeWhitespace(description) || normalizeWhitespace(fallbackDescription);
  if (!source) return '';
  return shortenAtBoundary(source, MAX_DESCRIPTION_LENGTH);
}

/**
 * @param {{
 *   title?: string,
 *   description?: string,
 *   fallbackDescription?: string,
 *   brandName?: string,
 * }} options
 */
export function buildSeoMetadata(options = {}) {
  const {
    title,
    description,
    fallbackDescription,
    brandName = DEFAULT_BRAND_NAME,
  } = options;
  return {
    title: normalizeSeoTitle(title, brandName),
    description: normalizeMetaDescription(description, fallbackDescription),
  };
}

export { MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH };

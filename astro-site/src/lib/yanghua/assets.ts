export function publicAsset(path: string | undefined, fallback = '/images/no-image-available.webp'): string {
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/') ? path : `/${path}`;
}

export function productImageFromIndex(index: number | undefined): string {
  if (typeof index !== 'number') return '/images/no-image-available.webp';
  return `/images/product-center/${index}.jpg`;
}

/**
 * Maps a product category name (English or Spanish) to its dedicated image.
 * Falls back to index-based lookup if no named image exists.
 */
const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'General Purpose Cables': 'general-purpose-cables',
  'Fire Resistant Cables': 'fire-resistant-cables',
  'Low Smoke & Halogen-Free Cables': 'low-smoke-halogen-free-cables',
  'Cables de Propósito General': 'general-purpose-cables',
  'Cables Resistentes al Fuego': 'fire-resistant-cables',
  'Cables Libres de Humo y Halógenos': 'low-smoke-halogen-free-cables',
};

export function productImageFromName(name: string, index?: number): string {
  const mapped = CATEGORY_IMAGE_MAP[name];
  if (mapped) return `/images/product-center/${mapped}.jpg`;
  // Fallback to index-based image or placeholder
  return productImageFromIndex(index);
}

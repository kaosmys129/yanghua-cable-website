export function publicAsset(path: string | undefined, fallback = '/images/no-image-available.webp'): string {
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/') ? path : `/${path}`;
}

export function productImageFromIndex(index: number | undefined): string {
  if (typeof index !== 'number') return '/images/no-image-available.webp';
  return `/images/product-center/${index}.jpg`;
}

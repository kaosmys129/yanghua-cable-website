import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.yhflexiblebusbar.com';
  const locales = ['en', 'es'];
  const staticPaths = ['', 'articles', 'projects', 'products', 'solutions', 'services'];

  const items: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      items.push({
        url: `${baseUrl}/${locale}${path ? `/${path}` : ''}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: path ? 0.7 : 1.0,
      });
    }
  }

  // Known product detail pages (can be extended from CMS later)
  const productIds = ['flexible-busbar-2000a'];
  for (const locale of locales) {
    for (const id of productIds) {
      items.push({
        url: `${baseUrl}/${locale}/products/${id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    }
  }

  return items;
}
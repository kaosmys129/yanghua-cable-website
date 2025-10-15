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
  const productIds = ['flexible-busbar-2000a', 'flexible-busbar-1500a', 'flexible-busbar-2500a', 'insulation-accessories'];
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

  // Product categories
  const categories = ['general', 'fire-resistant', 'halogen-free', 'low-smoke', 'special-purpose'];
  for (const locale of locales) {
    for (const name of categories) {
      items.push({
        url: `${baseUrl}/${locale}/products/category/${name}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  // Projects detail pages
  const projectIds = ['1', '2', '3', '4', '5', '6', '7'];
  for (const locale of locales) {
    for (const id of projectIds) {
      items.push({
        url: `${baseUrl}/${locale}/projects/${id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  return items;
}
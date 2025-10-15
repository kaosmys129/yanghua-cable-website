import type { MetadataRoute } from 'next';
export const revalidate = 60 * 60 * 24 * 7; // Revalidate sitemap weekly

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

  // Articles detail pages (fetch from Strapi if available)
  const strapiBase = 'https://fruitful-presence-02d7be759c.strapiapp.com';
  async function fetchArticleSlugs(locale: string): Promise<string[]> {
    try {
      const url = `${strapiBase}/api/articles?fields[0]=slug&locale=${locale}`;
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (process.env.STRAPI_API_TOKEN) {
        headers.Authorization = `Bearer ${process.env.STRAPI_API_TOKEN}`;
      }
      const res = await fetch(url, { headers, next: { revalidate: 60 * 60 } });
      if (!res.ok) return [];
      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : [];
      return data.map((a: any) => a.slug).filter(Boolean);
    } catch (e) {
      console.error('Sitemap: failed to fetch article slugs', locale, e);
      return [];
    }
  }

  for (const locale of locales) {
    const slugs = await fetchArticleSlugs(locale);
    for (const slug of slugs) {
      items.push({
        url: `${baseUrl}/${locale}/articles/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  return items;
}
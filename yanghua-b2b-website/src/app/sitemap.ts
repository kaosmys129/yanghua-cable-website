import type { MetadataRoute } from 'next';
import { buildLocalizedUrl } from '@/lib/url-localization';

export const revalidate = 60 * 60 * 24 * 7; // Revalidate sitemap weekly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.yhflexiblebusbar.com';
  const locales = ['en', 'es'] as const;
  const staticPageKeys = ['home', 'articles', 'projects', 'products', 'solutions', 'services'] as const;

  const items: MetadataRoute.Sitemap = [];

  // 静态页面：使用统一的本地化URL生成确保西语输出翻译段
  for (const locale of locales) {
    for (const key of staticPageKeys) {
      items.push({
        url: buildLocalizedUrl(key, locale, undefined, baseUrl),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: key === 'home' ? 1.0 : 0.7,
      });
    }
  }

  // 已知产品详情页（后续可从CMS扩展）
  const productIds = ['flexible-busbar-2000a', 'flexible-busbar-1500a', 'flexible-busbar-2500a', 'insulation-accessories'];
  for (const locale of locales) {
    for (const id of productIds) {
      items.push({
        url: buildLocalizedUrl('products', locale, { id }, baseUrl),
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    }
  }

  // 产品分类
  const categories = ['general', 'fire-resistant', 'halogen-free', 'low-smoke', 'special-purpose'];
  for (const locale of locales) {
    for (const name of categories) {
      items.push({
        url: buildLocalizedUrl('products-category', locale, { name }, baseUrl),
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  // 项目详情页
  const projectIds = ['1', '2', '3', '4', '5', '6', '7'];
  for (const locale of locales) {
    for (const id of projectIds) {
      items.push({
        url: buildLocalizedUrl('projects-detail', locale, { id }, baseUrl),
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  // 文章详情页（从 Strapi 获取）
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
        url: buildLocalizedUrl('articles-detail', locale, { slug }, baseUrl),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  return items;
}
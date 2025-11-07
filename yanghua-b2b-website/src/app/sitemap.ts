import type { MetadataRoute } from 'next';
import { getLocalizedPath } from '@/lib/url-localization';
import { getSiteUrl } from '@/lib/site-url';

export const revalidate = 60 * 60 * 24 * 7; // Revalidate sitemap weekly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const locales = ['en', 'es'] as const;
  const staticPageKeys = ['home', 'articles', 'projects', 'products', 'solutions', 'services', 'articles-hub'] as const;

  const items: MetadataRoute.Sitemap = [];

  // 统一构建 sitemap URL：所有语言统一带语言前缀（包括英文 /en），以符合新的规范化策略
  const buildSitemapUrl = (
    pageKey: (typeof staticPageKeys)[number] | 'products-category' | 'products-detail' | 'projects-detail' | 'articles-detail' | 'articles-hub-detail',
    locale: (typeof locales)[number],
    params?: Record<string, string>
  ): string => {
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const localizedPath = getLocalizedPath(pageKey as any, locale as any, params);
    // 所有语言均带上语言前缀
    return `${cleanBaseUrl}/${locale}${localizedPath === '/' ? '' : localizedPath}`;
  };

  // 静态页面：使用统一的本地化URL生成确保西语输出翻译段
  for (const locale of locales) {
    for (const key of staticPageKeys) {
      items.push({
        url: buildSitemapUrl(key, locale, undefined),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: key === 'home' ? 1.0 : 0.7,
      });
    }
  }

  // 已知产品详情页（后续可从CMS扩展）
  // 包含所有可用的产品ID
  const productIds = ['flexible-busbar-2000a', 'flexible-busbar-1500a', 'flexible-busbar-2500a', 'insulation-accessories'];
  for (const locale of locales) {
    for (const id of productIds) {
      items.push({
        url: buildSitemapUrl('products-detail', locale, { id }),
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    }
  }

  // 产品分类（与实际路由实现保持一致）
  const categories = ['general', 'fire-resistant', 'flame-retardant', 'low-smoke-halogen-free'];
  for (const locale of locales) {
    for (const name of categories) {
      items.push({
        url: buildSitemapUrl('products-category', locale, { name }),
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
        url: buildSitemapUrl('projects-detail', locale, { id }),
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

  // 枢纽页（Hub）详情：从 Strapi 获取
  async function fetchHubSlugs(locale: string): Promise<string[]> {
    try {
      const url = `${strapiBase}/api/hubs?fields[0]=slug&locale=${locale}`;
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
      console.error('Sitemap: failed to fetch hub slugs', locale, e);
      return [];
    }
  }

  for (const locale of locales) {
    const slugs = await fetchArticleSlugs(locale);
    for (const slug of slugs) {
      items.push({
        url: buildSitemapUrl('articles-detail', locale, { slug }),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
    // 加入枢纽页详情
    const hubSlugs = await fetchHubSlugs(locale);
    for (const slug of hubSlugs) {
      items.push({
        url: buildSitemapUrl('articles-hub-detail', locale, { slug }),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.65,
      });
    }
  }

  return items;
}
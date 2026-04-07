import type { Article, Hub } from './types';
import { contentRepository, type ContentLocale } from './content-repository';

export type ContentApiLocale = ContentLocale;

function normalizeLocale(locale?: string): ContentLocale {
  return locale === 'es' ? 'es' : 'en';
}

export async function getAllArticles(locale?: ContentApiLocale): Promise<{ data: Article[] }> {
  const data = await contentRepository.getAllArticles(normalizeLocale(locale));
  return { data };
}

export async function getArticleBySlug(slug: string, locale?: ContentApiLocale): Promise<Article | null> {
  return contentRepository.getArticleBySlug(slug, normalizeLocale(locale));
}

export async function getArticleBySlugWithMetrics(
  slug: string,
  locale?: ContentApiLocale
): Promise<{ article: Article | null; metrics: { bytes: number } }> {
  const article = await getArticleBySlug(slug, locale);
  const bytes = article ? Buffer.byteLength(JSON.stringify(article), 'utf8') : 0;

  return {
    article,
    metrics: { bytes },
  };
}

export async function getAllArticlesWithDrafts(locale?: ContentApiLocale): Promise<{ data: Article[] }> {
  return getAllArticles(locale);
}

export async function getArticleBySlugWithDrafts(
  slug: string,
  locale?: ContentApiLocale
): Promise<Article | null> {
  return getArticleBySlug(slug, locale);
}

export async function getArticlesWithCache(): Promise<{ data: Article[]; timestamp: number }> {
  const result = await getAllArticles('en');
  return {
    ...result,
    timestamp: Date.now(),
  };
}

export async function checkContentHealth(): Promise<boolean> {
  const articles = await contentRepository.getAllArticles('en');
  return Array.isArray(articles);
}

export async function getHubBySlug(slug: string, locale?: ContentApiLocale): Promise<Hub | null> {
  return contentRepository.getHubBySlug(slug, normalizeLocale(locale));
}

export async function getAllHubs(locale?: ContentApiLocale): Promise<{ data: Hub[] }> {
  const data = await contentRepository.getAllHubs(normalizeLocale(locale));
  return { data };
}

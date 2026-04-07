
import { unstable_cache } from 'next/cache';
import { 
  getAllArticles, 
  getArticleBySlug, 
  getAllHubs, 
  getHubBySlug 
} from './content-api';
import { Article, Hub } from './types';
import type { ContentApiLocale } from './content-api';

// Cache configuration
export const CACHE_TAGS = {
  articles: 'articles',
  hubs: 'hubs',
};

export const REVALIDATE_TIME = 3600; // 1 hour

/**
 * Cached version of getAllArticles
 */
export const getCachedAllArticles = unstable_cache(
  async (locale?: ContentApiLocale) => {
    return getAllArticles(locale);
  },
  ['articles-list'],
  {
    tags: [CACHE_TAGS.articles],
    revalidate: REVALIDATE_TIME,
  }
);

/**
 * Cached version of getArticleBySlug
 */
export const getCachedArticleBySlug = unstable_cache(
  async (slug: string, locale?: ContentApiLocale) => {
    return getArticleBySlug(slug, locale);
  },
  ['article-detail'],
  {
    tags: [CACHE_TAGS.articles], // We can invalidate all articles if needed, or refine this
    revalidate: REVALIDATE_TIME,
  }
);

/**
 * Cached version of getAllHubs
 */
export const getCachedAllHubs = unstable_cache(
  async (locale?: ContentApiLocale) => {
    return getAllHubs(locale);
  },
  ['hubs-list'],
  {
    tags: [CACHE_TAGS.hubs],
    revalidate: REVALIDATE_TIME,
  }
);

/**
 * Cached version of getHubBySlug
 */
export const getCachedHubBySlug = unstable_cache(
  async (slug: string, locale?: ContentApiLocale) => {
    return getHubBySlug(slug, locale);
  },
  ['hub-detail'],
  {
    tags: [CACHE_TAGS.hubs],
    revalidate: REVALIDATE_TIME,
  }
);

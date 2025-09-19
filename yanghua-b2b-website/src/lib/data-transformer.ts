import { Article, Block } from './types';
import { logError } from './errorLogger';

// Data transformation utilities for Strapi Cloud responses

/**
 * Transforms and validates article data from Strapi Cloud
 */
export function transformArticle(rawArticle: any): Article | null {
  try {
    // Validate required fields
    if (!rawArticle || !rawArticle.id || !rawArticle.title) {
      logError('Invalid article data: missing required fields', new Error('Article validation failed'), {
        rawData: rawArticle
      });
      return null;
    }

    // Transform the article with proper defaults
    const transformedArticle: Article = {
      id: rawArticle.id,
      documentId: rawArticle.documentId || rawArticle.id.toString(),
      title: rawArticle.title || '',
      description: rawArticle.description || '',
      slug: rawArticle.slug || '',
      createdAt: rawArticle.createdAt || new Date().toISOString(),
      updatedAt: rawArticle.updatedAt || new Date().toISOString(),
      publishedAt: rawArticle.publishedAt || new Date().toISOString(),
      locale: rawArticle.locale || 'en',
      cover: transformCover(rawArticle.cover),
      category: transformCategory(rawArticle.category),
      author: transformAuthor(rawArticle.author),
      blocks: transformBlocks(rawArticle.blocks || [])
    };

    return transformedArticle;
  } catch (error) {
    logError('Article transformation failed', error instanceof Error ? error : new Error(String(error)), {
      rawData: rawArticle
    });
    return null;
  }
}

/**
 * Transforms cover image data
 */
function transformCover(rawCover: any) {
  if (!rawCover) {
    return {
      id: 0,
      documentId: '',
      name: '',
      alternativeText: '',
      url: ''
    };
  }

  return {
    id: rawCover.id || 0,
    documentId: rawCover.documentId || rawCover.id?.toString() || '',
    name: rawCover.name || '',
    alternativeText: rawCover.alternativeText || rawCover.alt || '',
    url: rawCover.url || rawCover.src || ''
  };
}

/**
 * Transforms category data
 */
function transformCategory(rawCategory: any) {
  if (!rawCategory) {
    return {
      id: 0,
      documentId: '',
      name: 'Uncategorized',
      slug: 'uncategorized'
    };
  }

  return {
    id: rawCategory.id || 0,
    documentId: rawCategory.documentId || rawCategory.id?.toString() || '',
    name: rawCategory.name || 'Uncategorized',
    slug: rawCategory.slug || 'uncategorized'
  };
}

/**
 * Transforms author data
 */
function transformAuthor(rawAuthor: any) {
  if (!rawAuthor) {
    return {
      id: 0,
      documentId: '',
      name: 'Anonymous',
      email: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      avatar: {
        id: 0,
        documentId: '',
        url: '',
        alternativeText: '',
        width: 0,
        height: 0
      }
    };
  }

  return {
    id: rawAuthor.id || 0,
    documentId: rawAuthor.documentId || rawAuthor.id?.toString() || '',
    name: rawAuthor.name || 'Anonymous',
    email: rawAuthor.email || '',
    createdAt: rawAuthor.createdAt || new Date().toISOString(),
    updatedAt: rawAuthor.updatedAt || new Date().toISOString(),
    publishedAt: rawAuthor.publishedAt || new Date().toISOString(),
    avatar: {
      id: rawAuthor.avatar?.id || 0,
      documentId: rawAuthor.avatar?.documentId || rawAuthor.avatar?.id?.toString() || '',
      url: rawAuthor.avatar?.url || '',
      alternativeText: rawAuthor.avatar?.alternativeText || rawAuthor.avatar?.alt || '',
      width: rawAuthor.avatar?.width || 0,
      height: rawAuthor.avatar?.height || 0
    }
  };
}

/**
 * Transforms blocks data
 */
function transformBlocks(rawBlocks: any[]): Block[] {
  if (!Array.isArray(rawBlocks)) {
    return [];
  }

  return rawBlocks
    .map(transformBlock)
    .filter((block): block is Block => block !== null);
}

/**
 * Transforms individual block data
 */
function transformBlock(rawBlock: any): Block | null {
  if (!rawBlock || !rawBlock.__component) {
    return null;
  }

  try {
    switch (rawBlock.__component) {
      case 'shared.rich-text':
        return {
          __component: 'shared.rich-text',
          id: rawBlock.id || 0,
          body: rawBlock.body || ''
        };

      case 'shared.quote':
        return {
          __component: 'shared.quote',
          id: rawBlock.id || 0,
          title: rawBlock.title || '',
          body: rawBlock.body || ''
        };

      case 'shared.media':
        return {
          __component: 'shared.media',
          id: rawBlock.id || 0,
          file: {
            id: rawBlock.file?.id || 0,
            documentId: rawBlock.file?.documentId || rawBlock.file?.id?.toString() || '',
            url: rawBlock.file?.url || '',
            alternativeText: rawBlock.file?.alternativeText || rawBlock.file?.alt || '',
            width: rawBlock.file?.width,
            height: rawBlock.file?.height
          }
        };

      case 'shared.slider':
        return {
          __component: 'shared.slider',
          id: rawBlock.id || 0,
          files: Array.isArray(rawBlock.files) ? rawBlock.files.map((file: any) => ({
            id: file.id || 0,
            documentId: file.documentId || file.id?.toString() || '',
            name: file.name || '',
            url: file.url || '',
            alternativeText: file.alternativeText || file.alt || ''
          })) : []
        };

      default:
        logError('Unknown block component type', new Error('Block transformation failed'), {
          component: rawBlock.__component,
          blockData: rawBlock
        });
        return null;
    }
  } catch (error) {
    logError('Block transformation failed', error instanceof Error ? error : new Error(String(error)), {
      blockData: rawBlock
    });
    return null;
  }
}

/**
 * Transforms array of articles
 */
export function transformArticles(rawArticles: any[]): Article[] {
  if (!Array.isArray(rawArticles)) {
    logError('Invalid articles data: expected array', new Error('Articles validation failed'), {
      rawData: rawArticles
    });
    return [];
  }

  return rawArticles
    .map(transformArticle)
    .filter((article): article is Article => article !== null);
}

/**
 * Validates and normalizes Strapi Cloud API response
 */
export function normalizeApiResponse<T>(response: any, transformer: (data: any) => T): {
  data: T | null;
  meta?: any;
  error?: string;
} {
  try {
    // Handle different response formats from Strapi Cloud
    if (response?.data) {
      return {
        data: transformer(response.data),
        meta: response.meta
      };
    }

    // Direct data format
    if (response && typeof response === 'object') {
      return {
        data: transformer(response)
      };
    }

    return {
      data: null,
      error: 'Invalid response format'
    };
  } catch (error) {
    logError('API response normalization failed', error instanceof Error ? error : new Error(String(error)), {
      response
    });
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * URL transformation utilities for Strapi Cloud
 */
export function transformImageUrl(url: string, baseUrl?: string): string {
  if (!url) return '';
  
  // If URL is already absolute, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If URL starts with /, prepend base URL
  if (url.startsWith('/')) {
    const base = baseUrl || process.env.STRAPI_BASE_URL || 'https://fruitful-presence-02d7be759c.strapiapp.com';
    return `${base}${url}`;
  }
  
  // Otherwise, assume it's a relative path
  const base = baseUrl || process.env.STRAPI_BASE_URL || 'https://fruitful-presence-02d7be759c.strapiapp.com';
  return `${base}/${url}`;
}

/**
 * Cache key generation for articles
 */
export function generateCacheKey(type: 'articles' | 'article', identifier?: string): string {
  const timestamp = Math.floor(Date.now() / (1000 * 60 * 5)); // 5-minute cache buckets
  return identifier 
    ? `${type}-${identifier}-${timestamp}`
    : `${type}-${timestamp}`;
}
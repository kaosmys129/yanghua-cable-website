import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Article, Hub } from './types';

export type ContentLocale = 'en' | 'es';

type CmsImage = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
};

type ArticleFrontmatter = {
  sourceId: number;
  translationKey: string;
  locale: ContentLocale;
  slug: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  sourceUrl?: string;
  cover?: CmsImage;
  category?: { name: string; slug: string };
  author?: {
    name: string;
    email?: string;
    avatar?: CmsImage;
  };
  relatedSlugs?: string[];
  fallbackLocale?: ContentLocale;
  bodySource?: 'content' | 'summary' | 'summary+english-fallback' | 'placeholder';
};

type HubFrontmatter = {
  sourceId: number;
  translationKey: string;
  locale: ContentLocale;
  slug: string;
  title: string;
  intro?: string;
  cover?: CmsImage;
  featuredArticleSlugs?: string[];
};

type ContentDocument<T> = {
  frontmatter: T;
  body: string;
};

function getContentRoot() {
  return path.join(process.cwd(), 'content');
}

function parseDocument<T>(raw: string): ContentDocument<T> {
  const parsed = matter(raw);

  if (!parsed.data || Object.keys(parsed.data).length === 0) {
    throw new Error('Invalid content document format.');
  }

  return {
    frontmatter: parsed.data as T,
    body: parsed.content.trim(),
  };
}

function readDocument<T>(filePath: string): ContentDocument<T> {
  return parseDocument<T>(fs.readFileSync(filePath, 'utf8'));
}

function readDirectory(directoryPath: string): string[] {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  return fs
    .readdirSync(directoryPath)
    .filter((entry) => entry.endsWith('.mdx') || entry.endsWith('.json'))
    .map((entry) => path.join(directoryPath, entry));
}

function mapArticleDocument(
  document: ContentDocument<ArticleFrontmatter>,
  localizations: { id: number; slug: string; locale: string; documentId?: string }[]
): Article {
  const { frontmatter, body } = document;

  return {
    id: frontmatter.sourceId,
    documentId: `${frontmatter.translationKey}-${frontmatter.locale}`,
    translationKey: frontmatter.translationKey,
    title: frontmatter.title,
    description: frontmatter.description,
    slug: frontmatter.slug,
    createdAt: frontmatter.createdAt,
    updatedAt: frontmatter.updatedAt,
    publishedAt: frontmatter.publishedAt,
    locale: frontmatter.locale,
    sourceUrl: frontmatter.sourceUrl,
    fallbackLocale: frontmatter.fallbackLocale,
    bodySource: frontmatter.bodySource,
    cover: {
      id: frontmatter.sourceId,
      documentId: `${frontmatter.translationKey}-${frontmatter.locale}-cover`,
      name: frontmatter.title,
      alternativeText: frontmatter.cover?.alt || frontmatter.title,
      url: frontmatter.cover?.src || '/placeholder.svg?height=400&width=600&query=article',
    },
    category: {
      id: frontmatter.sourceId,
      documentId: `${frontmatter.translationKey}-${frontmatter.locale}-category`,
      name: frontmatter.category?.name || 'Uncategorized',
      slug: frontmatter.category?.slug || 'uncategorized',
    },
    localizations,
    relatedSlugs: frontmatter.relatedSlugs || [],
    author: {
      id: frontmatter.sourceId,
      documentId: `${frontmatter.translationKey}-${frontmatter.locale}-author`,
      name: frontmatter.author?.name || 'Yanghua Editorial Team',
      email: frontmatter.author?.email || 'info@yhflexiblebusbar.com',
      createdAt: frontmatter.createdAt,
      updatedAt: frontmatter.updatedAt,
      publishedAt: frontmatter.publishedAt,
      avatar: {
        id: frontmatter.sourceId,
        documentId: `${frontmatter.translationKey}-${frontmatter.locale}-author-avatar`,
        url: frontmatter.author?.avatar?.src || '/placeholder.svg?height=50&width=50&query=avatar',
        alternativeText: frontmatter.author?.avatar?.alt || frontmatter.author?.name || 'Author avatar',
        width: frontmatter.author?.avatar?.width || 50,
        height: frontmatter.author?.avatar?.height || 50,
      },
    },
    blocks: body
      ? [
          {
            __component: 'shared.rich-text' as const,
            id: frontmatter.sourceId,
            body,
          },
        ]
      : [],
  };
}

function mapHubDocument(document: ContentDocument<HubFrontmatter>, allArticles: Article[]): Hub {
  const { frontmatter, body } = document;

  return {
    id: frontmatter.sourceId,
    documentId: `${frontmatter.translationKey}-${frontmatter.locale}`,
    translationKey: frontmatter.translationKey,
    title: frontmatter.title,
    slug: frontmatter.slug,
    intro: body || frontmatter.intro,
    locale: frontmatter.locale,
    cover: frontmatter.cover
      ? {
          id: frontmatter.sourceId,
          documentId: `${frontmatter.translationKey}-${frontmatter.locale}-cover`,
          url: frontmatter.cover.src,
          alternativeText: frontmatter.cover.alt,
        }
      : undefined,
    featured_articles: (frontmatter.featuredArticleSlugs || [])
      .map((slug) => allArticles.find((article) => article.locale === frontmatter.locale && article.slug === slug))
      .filter(Boolean)
      .map((article) => ({
        id: article!.id,
        documentId: article!.documentId,
        title: article!.title,
        slug: article!.slug,
        locale: article!.locale,
        cover: {
          id: article!.cover.id,
          documentId: article!.cover.documentId,
          url: article!.cover.url,
          alternativeText: article!.cover.alternativeText,
        },
        category: article!.category,
      })),
  };
}

export class ContentRepository {
  async getAllArticles(locale: ContentLocale = 'en'): Promise<Article[]> {
    const directory = path.join(getContentRoot(), 'articles', locale);
    const documents = readDirectory(directory).map((filePath) => readDocument<ArticleFrontmatter>(filePath));
    const allDocuments = this.getAllArticleDocuments();

    return documents
      .map((document) => {
        const localizations = allDocuments
          .filter(
            (candidate) =>
              candidate.frontmatter.translationKey === document.frontmatter.translationKey &&
              candidate.frontmatter.locale !== document.frontmatter.locale
          )
          .map((candidate) => ({
            id: candidate.frontmatter.sourceId,
            locale: candidate.frontmatter.locale,
            slug: candidate.frontmatter.slug,
            documentId: `${candidate.frontmatter.translationKey}-${candidate.frontmatter.locale}`,
          }));

        return mapArticleDocument(document, localizations);
      })
      .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime());
  }

  async getArticleBySlug(slug: string, locale: ContentLocale = 'en'): Promise<Article | null> {
    const article = (await this.getAllArticles(locale)).find((entry) => entry.slug === slug);
    return article || null;
  }

  async getAllHubs(locale: ContentLocale = 'en'): Promise<Hub[]> {
    const directory = path.join(getContentRoot(), 'hubs', locale);
    const documents = readDirectory(directory).map((filePath) => readDocument<HubFrontmatter>(filePath));
    const allArticles = await this.getAllArticles(locale);

    return documents.map((document) => mapHubDocument(document, allArticles));
  }

  async getHubBySlug(slug: string, locale: ContentLocale = 'en'): Promise<Hub | null> {
    const hub = (await this.getAllHubs(locale)).find((entry) => entry.slug === slug);
    return hub || null;
  }

  getPageContent<T = Record<string, unknown>>(pageKey: string, locale: ContentLocale = 'en'): T | null {
    const filePath = path.join(getContentRoot(), 'pages', locale, `${pageKey}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  }

  getSiteSettings<T = Record<string, unknown>>(): T | null {
    const filePath = path.join(getContentRoot(), 'settings', 'site.json');
    if (!fs.existsSync(filePath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  }

  private getAllArticleDocuments(): Array<ContentDocument<ArticleFrontmatter>> {
    const locales: ContentLocale[] = ['en', 'es'];
    return locales.flatMap((locale) => {
      const directory = path.join(getContentRoot(), 'articles', locale);
      return readDirectory(directory).map((filePath) => readDocument<ArticleFrontmatter>(filePath));
    });
  }
}

export const contentRepository = new ContentRepository();

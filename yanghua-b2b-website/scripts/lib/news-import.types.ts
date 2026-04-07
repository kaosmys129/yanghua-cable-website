export type Locale = 'en' | 'es';

export type RawNewsItem = {
  title: string;
  date: string;
  url?: string;
  image?: string;
  summary?: string;
  author?: string;
  content?: string;
};

export type RawNewsCollection = {
  total_count?: number;
  extraction_date?: string;
  source?: string;
  company?: string;
  website?: string;
  description?: string;
  news?: RawNewsItem[];
};

export type ArticleFrontmatter = {
  sourceId: number;
  translationKey: string;
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  sourceUrl?: string;
  cover?: {
    src: string;
    alt: string;
  };
  category: {
    name: string;
    slug: string;
  };
  author: {
    name: string;
    email: string;
    avatar: {
      src: string;
      alt: string;
      width: number;
      height: number;
    };
  };
  relatedSlugs: string[];
  fallbackLocale?: Locale;
  bodySource: 'content' | 'summary' | 'summary+english-fallback' | 'placeholder';
};

export type GeneratedArticleDocument = {
  fileName: string;
  frontmatter: ArticleFrontmatter;
  body: string;
};

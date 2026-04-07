import fs from 'fs';
import path from 'path';
import type {
  GeneratedArticleDocument,
  Locale,
  RawNewsCollection,
  RawNewsItem,
} from './news-import.types.ts';

type NewsRecord = {
  newsId: string;
  translationKey: string;
  locale: Locale;
  title: string;
  description: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  sourceUrl?: string;
  coverSrc?: string;
  summary?: string;
  content?: string;
  slug: string;
};

const DEFAULT_AUTHOR = {
  name: 'Yanghua Editorial Team',
  email: 'info@yhflexiblebusbar.com',
  avatar: {
    src: '/placeholder.svg?height=100&width=100&query=editorial team',
    alt: 'Yanghua editorial team',
    width: 100,
    height: 100,
  },
};

const PLACEHOLDER_BODY: Record<Locale, string> = {
  en: 'Yanghua news update. Full article content was not available in the source export, so this page currently shows the available summary and source metadata.',
  es: 'Actualizacion de noticias de Yanghua. El contenido completo del articulo no estaba disponible en la exportacion original, por lo que esta pagina muestra el resumen y los metadatos disponibles.',
};

function loadNewsFile(filePath: string): RawNewsItem[] {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as RawNewsCollection;
  return raw.news ?? [];
}

function extractNewsId(url?: string): string {
  const match = url?.match(/(\d+)(?:\/)?$/);
  return match?.[1] ?? 'unknown';
}

function sanitizeSlugPart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function buildSlug(title: string, newsId: string): string {
  const base = sanitizeSlugPart(title) || 'news';
  return `${base}-${newsId}`;
}

function toIsoDate(date: string): string {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00.000Z` : date;
  return new Date(normalized).toISOString();
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function deriveDescription(item: RawNewsItem): string {
  const summary = item.summary?.trim();
  if (summary) {
    return summary;
  }

  const bodyText = stripMarkdown(item.content ?? '');
  if (bodyText) {
    return `${bodyText.slice(0, 157)}${bodyText.length > 157 ? '...' : ''}`;
  }

  return item.title.trim();
}

function buildSummaryBody(summary: string, locale: Locale): string {
  const heading = locale === 'es' ? '## Resumen' : '## Summary';
  return `${heading}\n\n${summary.trim()}`;
}

function normalizeRecord(item: RawNewsItem, locale: Locale): NewsRecord {
  const newsId = extractNewsId(item.url);
  const publishedAt = toIsoDate(item.date);

  return {
    newsId,
    translationKey: `news-${newsId}`,
    locale,
    title: item.title.trim(),
    description: deriveDescription(item),
    publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
    sourceUrl: item.url,
    coverSrc: item.image?.trim(),
    summary: item.summary?.trim() || undefined,
    content: item.content?.trim() || undefined,
    slug: buildSlug(item.title, newsId),
  };
}

function buildBody(
  record: NewsRecord,
  englishSource?: NewsRecord
): { body: string; bodySource: GeneratedArticleDocument['frontmatter']['bodySource']; fallbackLocale?: Locale } {
  if (record.content) {
    return { body: record.content, bodySource: 'content' };
  }

  if (record.locale === 'en') {
    if (record.summary) {
      return { body: buildSummaryBody(record.summary, 'en'), bodySource: 'summary' };
    }

    return { body: PLACEHOLDER_BODY.en, bodySource: 'placeholder' };
  }

  const sections: string[] = [];

  if (record.summary) {
    sections.push(buildSummaryBody(record.summary, 'es'));
  }

  if (englishSource?.content) {
    sections.push(`---\n\n## English Reference\n\n${englishSource.content}`);
    return {
      body: sections.join('\n\n'),
      bodySource: 'summary+english-fallback',
      fallbackLocale: 'en',
    };
  }

  if (sections.length > 0) {
    return { body: sections.join('\n\n'), bodySource: 'summary' };
  }

  if (englishSource?.summary) {
    sections.push(buildSummaryBody(englishSource.summary, 'en'));
    return {
      body: sections.join('\n\n'),
      bodySource: 'summary+english-fallback',
      fallbackLocale: 'en',
    };
  }

  return { body: PLACEHOLDER_BODY.es, bodySource: 'placeholder' };
}

function buildDocuments(records: NewsRecord[], englishMap: Map<string, NewsRecord>): GeneratedArticleDocument[] {
  const sorted = [...records].sort((left, right) => {
    return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
  });

  return sorted.map((record, index) => {
    const englishSource = englishMap.get(record.translationKey);
    const { body, bodySource, fallbackLocale } = buildBody(record, englishSource);
    const relatedSlugs = sorted
      .filter((candidate) => candidate.slug !== record.slug)
      .slice(0, 3)
      .map((candidate) => candidate.slug);

    return {
      fileName: `${record.slug}.mdx`,
      frontmatter: {
        sourceId: index + 1,
        translationKey: record.translationKey,
        locale: record.locale,
        slug: record.slug,
        title: record.title,
        description: record.description,
        publishedAt: record.publishedAt,
        updatedAt: record.updatedAt,
        createdAt: record.createdAt,
        sourceUrl: record.sourceUrl,
        cover: record.coverSrc
          ? {
              src: record.coverSrc,
              alt: record.title,
            }
          : undefined,
        category: {
          name: 'News',
          slug: 'news',
        },
        author: DEFAULT_AUTHOR,
        relatedSlugs,
        fallbackLocale,
        bodySource,
      },
      body,
    };
  });
}

export function loadArticleDocuments(projectRoot: string): Record<Locale, GeneratedArticleDocument[]> {
  const englishPath = path.join(projectRoot, 'public', 'data', 'merged_news_with_content.json');
  const spanishPath = path.join(projectRoot, 'public', 'data', 'cleaned_news_data_spanish.json');

  const englishRecords = loadNewsFile(englishPath).map((item) => normalizeRecord(item, 'en'));
  const spanishRecords = loadNewsFile(spanishPath).map((item) => normalizeRecord(item, 'es'));
  const englishMap = new Map(englishRecords.map((record) => [record.translationKey, record]));

  return {
    en: buildDocuments(englishRecords, englishMap),
    es: buildDocuments(spanishRecords, englishMap),
  };
}

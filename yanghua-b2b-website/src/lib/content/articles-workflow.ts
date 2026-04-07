export type ArticleLocale = 'en' | 'es';

export const ARTICLE_LOCALE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
] as const;

export type ArticleEditorValues = {
  sourceId?: number | null;
  translationKey?: string | null;
  locale?: string | null;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  publishedAt?: string | Date | null;
  sourceUrl?: string | null;
  cover?: {
    src?: string | null;
    alt?: string | null;
  } | null;
  category?: {
    name?: string | null;
    slug?: string | null;
  } | null;
  author?: {
    name?: string | null;
    email?: string | null;
    avatar?: {
      src?: string | null;
      alt?: string | null;
      width?: number | null;
      height?: number | null;
    } | null;
  } | null;
  relatedSlugs?: Array<string | null> | null;
  fallbackLocale?: string | null;
  bodySource?: string | null;
  body?: string | null;
};

function trimString(value?: string | null) {
  return value?.trim() || '';
}

export function sanitizeArticleSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function toArticleLocale(value?: string | null): ArticleLocale {
  return value === 'es' ? 'es' : 'en';
}

export function toIsoString(value?: string | Date | null) {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

export function suggestArticleTranslationKey(values: Pick<ArticleEditorValues, 'translationKey' | 'sourceId' | 'locale' | 'slug' | 'title'>) {
  const existing = trimString(values.translationKey);
  if (existing) {
    return existing;
  }

  const sourceId = typeof values.sourceId === 'number' && Number.isFinite(values.sourceId) ? Math.trunc(values.sourceId) : null;
  if (sourceId && sourceId > 0) {
    return `news-${sourceId}`;
  }

  const base = sanitizeArticleSlug(trimString(values.slug) || trimString(values.title)) || `${toArticleLocale(values.locale)}-article`;
  return `draft-${base}`;
}

export function buildArticleRelativePath(locale: string | null | undefined, slug: string | null | undefined) {
  const safeLocale = toArticleLocale(locale);
  const safeSlug = sanitizeArticleSlug(trimString(slug)) || 'untitled-article';
  return `${safeLocale}/${safeSlug}.mdx`;
}

export function normalizeArticleEditorValues<T extends ArticleEditorValues>(values: T): T {
  const locale = toArticleLocale(values.locale);
  const title = trimString(values.title);
  const slug = sanitizeArticleSlug(trimString(values.slug) || title) || 'untitled-article';
  const translationKey = suggestArticleTranslationKey({ ...values, locale, slug, title });
  const now = new Date().toISOString();
  const createdAt = toIsoString(values.createdAt) || now;
  const publishedAt = toIsoString(values.publishedAt) || createdAt;
  const updatedAt = now;

  return {
    ...values,
    locale,
    title,
    slug,
    translationKey,
    description: trimString(values.description),
    createdAt,
    publishedAt,
    updatedAt,
    sourceUrl: trimString(values.sourceUrl) || undefined,
    fallbackLocale: trimString(values.fallbackLocale) || undefined,
    bodySource: trimString(values.bodySource) || undefined,
    body: values.body ?? '',
    relatedSlugs: (values.relatedSlugs || [])
      .map((entry) => sanitizeArticleSlug(trimString(entry)))
      .filter(Boolean),
    cover: values.cover
      ? {
          src: trimString(values.cover.src) || undefined,
          alt: trimString(values.cover.alt) || undefined,
        }
      : undefined,
    category: values.category
      ? {
          name: trimString(values.category.name) || undefined,
          slug: sanitizeArticleSlug(trimString(values.category.slug) || trimString(values.category.name)) || undefined,
        }
      : undefined,
    author: values.author
      ? {
          name: trimString(values.author.name) || undefined,
          email: trimString(values.author.email) || undefined,
          avatar: values.author.avatar
            ? {
                src: trimString(values.author.avatar.src) || undefined,
                alt: trimString(values.author.avatar.alt) || undefined,
                width: values.author.avatar.width ?? undefined,
                height: values.author.avatar.height ?? undefined,
              }
            : undefined,
        }
      : undefined,
  };
}

export function getRequiredArticleFieldErrors(values: ArticleEditorValues) {
  const normalized = normalizeArticleEditorValues(values);
  const errors: string[] = [];

  if (!normalized.translationKey) errors.push('translationKey 为必填项');
  if (!normalized.locale) errors.push('locale 为必填项');
  if (!normalized.slug) errors.push('slug 为必填项');
  if (!normalized.title) errors.push('title 为必填项');
  if (!normalized.description) errors.push('description 为必填项');
  if (!normalized.publishedAt) errors.push('publishedAt 为必填项');

  return errors;
}

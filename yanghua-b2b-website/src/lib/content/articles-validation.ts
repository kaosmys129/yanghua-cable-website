import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import type { ArticleEditorValues, ArticleLocale } from './articles-workflow';
import {
  buildArticleRelativePath,
  getRequiredArticleFieldErrors,
  normalizeArticleEditorValues,
  sanitizeArticleSlug,
  toArticleLocale,
} from './articles-workflow';

export type ArticleDocumentMeta = {
  filePath: string;
  relativePath: string;
  locale: ArticleLocale;
  slug: string;
  title: string;
  translationKey: string;
  description: string;
  publishedAt: string;
  bodyLength: number;
};

export type ArticlePairStatus = {
  translationKey: string;
  english?: ArticleDocumentMeta;
  spanish?: ArticleDocumentMeta;
};

export type ArticleValidationResult = {
  normalizedValues: ArticleEditorValues;
  expectedRelativePath: string;
  pairStatus: ArticlePairStatus;
  errors: string[];
  warnings: string[];
};

type ArticleIndex = {
  documents: ArticleDocumentMeta[];
  byTranslationKey: Map<string, ArticlePairStatus>;
};

function getArticlesRoot(contentRoot = path.join(process.cwd(), 'content')) {
  return path.join(contentRoot, 'articles');
}

function readArticleFiles(locale: ArticleLocale, contentRoot?: string) {
  const localeRoot = path.join(getArticlesRoot(contentRoot), locale);
  if (!fs.existsSync(localeRoot)) {
    return [];
  }

  return fs
    .readdirSync(localeRoot)
    .filter((entry) => entry.endsWith('.mdx'))
    .map((entry) => path.join(localeRoot, entry));
}

function toRelativeArticlePath(filePath: string, contentRoot?: string) {
  return path.relative(getArticlesRoot(contentRoot), filePath).replace(/\\/g, '/');
}

function parseArticleMeta(filePath: string, contentRoot?: string): ArticleDocumentMeta {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const locale = toArticleLocale(String(parsed.data.locale || 'en'));
  const relativePath = toRelativeArticlePath(filePath, contentRoot);
  const slug = sanitizeArticleSlug(String(parsed.data.slug || path.basename(filePath, '.mdx')));

  return {
    filePath,
    relativePath,
    locale,
    slug,
    title: String(parsed.data.title || ''),
    translationKey: String(parsed.data.translationKey || ''),
    description: String(parsed.data.description || ''),
    publishedAt: String(parsed.data.publishedAt || ''),
    bodyLength: parsed.content.trim().length,
  };
}

export function loadArticleIndex(contentRoot?: string): ArticleIndex {
  const documents = (['en', 'es'] as ArticleLocale[]).flatMap((locale) =>
    readArticleFiles(locale, contentRoot).map((filePath) => parseArticleMeta(filePath, contentRoot))
  );

  const byTranslationKey = new Map<string, ArticlePairStatus>();

  for (const document of documents) {
    const key = document.translationKey;
    const existing = byTranslationKey.get(key) || { translationKey: key };
    if (document.locale === 'en') {
      existing.english = document;
    } else {
      existing.spanish = document;
    }
    byTranslationKey.set(key, existing);
  }

  return { documents, byTranslationKey };
}

function sameDocument(candidate: ArticleDocumentMeta, relativePath?: string) {
  return relativePath ? candidate.relativePath === relativePath.replace(/\\/g, '/') : false;
}

export function getPairStatus(index: ArticleIndex, translationKey: string): ArticlePairStatus {
  return index.byTranslationKey.get(translationKey) || { translationKey };
}

export function validateArticleDraft(
  values: ArticleEditorValues,
  options: { relativePath?: string; contentRoot?: string } = {}
): ArticleValidationResult {
  const index = loadArticleIndex(options.contentRoot);
  const normalizedValues = normalizeArticleEditorValues(values);
  const expectedRelativePath = buildArticleRelativePath(normalizedValues.locale, normalizedValues.slug);
  const errors = [...getRequiredArticleFieldErrors(normalizedValues)];
  const warnings: string[] = [];
  const currentRelativePath = options.relativePath?.replace(/\\/g, '/');

  const slugConflicts = index.documents.filter(
    (entry) => entry.locale === normalizedValues.locale && entry.slug === normalizedValues.slug && !sameDocument(entry, currentRelativePath)
  );
  if (slugConflicts.length > 0) {
    errors.push(`当前 locale 下 slug 已存在：${normalizedValues.slug}`);
  }

  const translationLocaleConflicts = index.documents.filter(
    (entry) =>
      entry.translationKey === normalizedValues.translationKey &&
      entry.locale === normalizedValues.locale &&
      !sameDocument(entry, currentRelativePath)
  );
  if (translationLocaleConflicts.length > 0) {
    errors.push(`translationKey + locale 已存在：${normalizedValues.translationKey} / ${normalizedValues.locale}`);
  }

  const pairStatus = getPairStatus(index, normalizedValues.translationKey || '');
  const currentDocumentMatchesPair =
    (pairStatus.english && sameDocument(pairStatus.english, currentRelativePath)) ||
    (pairStatus.spanish && sameDocument(pairStatus.spanish, currentRelativePath));

  if (normalizedValues.locale === 'es' && !pairStatus.english && !currentDocumentMatchesPair) {
    errors.push(`西语文章必须关联已有英文文章：${normalizedValues.translationKey}`);
  }

  if (normalizedValues.locale === 'en' && !pairStatus.spanish) {
    warnings.push('当前英文文章尚无西语版本。');
  }

  if (normalizedValues.locale === 'es' && pairStatus.english) {
    warnings.push(`已关联英文文章：${pairStatus.english.slug}`);
  }

  if (normalizedValues.locale === 'en' && pairStatus.spanish) {
    warnings.push(`已关联西语文章：${pairStatus.spanish.slug}`);
  }

  const bodyLength = String(normalizedValues.body || '').trim().length;
  if (bodyLength < 40) {
    warnings.push('正文过短，建议补充更多内容。');
  }

  return {
    normalizedValues,
    expectedRelativePath,
    pairStatus,
    errors,
    warnings,
  };
}

export function collectArticleOperationalIssues(contentRoot?: string) {
  const index = loadArticleIndex(contentRoot);
  const duplicateSlugs: string[] = [];
  const duplicateTranslationLocales: string[] = [];
  const missingTranslations: string[] = [];
  const missingRequired: string[] = [];
  const shortBodies: string[] = [];

  const slugSeen = new Set<string>();
  const translationLocaleSeen = new Set<string>();

  for (const document of index.documents) {
    const slugKey = `${document.locale}:${document.slug}`;
    if (slugSeen.has(slugKey)) {
      duplicateSlugs.push(slugKey);
    } else {
      slugSeen.add(slugKey);
    }

    const translationLocaleKey = `${document.translationKey}:${document.locale}`;
    if (translationLocaleSeen.has(translationLocaleKey)) {
      duplicateTranslationLocales.push(translationLocaleKey);
    } else {
      translationLocaleSeen.add(translationLocaleKey);
    }

    if (!document.translationKey || !document.slug || !document.title || !document.description || !document.publishedAt) {
      missingRequired.push(document.relativePath);
    }

    if (document.bodyLength < 40) {
      shortBodies.push(document.relativePath);
    }
  }

  for (const pairStatus of index.byTranslationKey.values()) {
    if (!pairStatus.english || !pairStatus.spanish) {
      missingTranslations.push(pairStatus.translationKey);
    }
  }

  return {
    index,
    duplicateSlugs,
    duplicateTranslationLocales,
    missingTranslations,
    missingRequired,
    shortBodies,
  };
}

import fs from 'fs';
import path from 'path';
import { contentRepository } from '../src/lib/content-repository.ts';

type Locale = 'en' | 'es';

const EXPECTED_COUNTS: Record<Locale, number> = {
  en: 67,
  es: 47,
};

function getArticleDir(locale: Locale) {
  return path.join(process.cwd(), 'content', 'articles', locale);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function listArticleFiles(locale: Locale) {
  return fs.readdirSync(getArticleDir(locale)).filter((entry) => entry.endsWith('.mdx'));
}

async function validateLocale(locale: Locale, slugSet: Set<string>) {
  const files = listArticleFiles(locale);
  assert(files.length === EXPECTED_COUNTS[locale], `${locale} article file count mismatch: expected ${EXPECTED_COUNTS[locale]}, got ${files.length}`);

  const articles = await contentRepository.getAllArticles(locale);
  assert(articles.length === EXPECTED_COUNTS[locale], `${locale} repository count mismatch: expected ${EXPECTED_COUNTS[locale]}, got ${articles.length}`);

  for (const article of articles) {
    assert(article.translationKey, `${locale}/${article.slug} missing translationKey`);
    assert(article.slug, `${locale} article missing slug`);
    assert(article.publishedAt, `${locale}/${article.slug} missing publishedAt`);
    assert(article.blocks?.length, `${locale}/${article.slug} missing body blocks`);
    assert(article.description, `${locale}/${article.slug} missing description`);
    assert(!slugSet.has(article.slug), `duplicate slug found: ${article.slug}`);
    slugSet.add(article.slug);
  }

  if (locale === 'es') {
    for (const article of articles) {
      if (article.localizations?.length) {
        const english = article.localizations.find((entry) => entry.locale === 'en');
        assert(english?.slug, `es/${article.slug} missing english localization slug`);
      }
    }
  }
}

async function main() {
  const slugSet = new Set<string>();
  await validateLocale('en', slugSet);
  await validateLocale('es', slugSet);
  console.log('Article content validation passed.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

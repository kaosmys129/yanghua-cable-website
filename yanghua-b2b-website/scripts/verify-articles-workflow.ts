import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { contentRepository } from '../src/lib/content-repository.ts';
import { buildArticleRelativePath } from '../src/lib/content/articles-workflow.ts';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || '';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function getContentRoot() {
  return path.join(process.cwd(), 'content', 'articles');
}

function getFilePath(locale: 'en' | 'es', slug: string) {
  return path.join(getContentRoot(), locale, `${slug}.mdx`);
}

function writeArticleFile(filePath: string, frontmatter: Record<string, unknown>, body: string) {
  const nextRaw = matter.stringify(body.trimStart(), frontmatter);
  fs.writeFileSync(filePath, nextRaw);
}

async function fetchHtml(pathname: string) {
  if (!BASE_URL) {
    return null;
  }

  const url = `${BASE_URL}${pathname}${pathname.includes('?') ? '&' : '?'}t=${Date.now()}`;
  const response = await fetch(url);
  assert(response.ok, `请求失败：${url} -> ${response.status}`);
  return response.text();
}

async function verifyExistingPairRoundtrip() {
  const englishArticle = await contentRepository.getArticleBySlug(
    '2024-setting-sail-partnering-with-new-energy-for-low-carbon-progress-813260',
    'en'
  );
  const spanishArticle = await contentRepository.getArticleBySlug(
    'alcalde-del-condado-de-changshun-de-la-provincia-de-guizhou-visita-yanghuasti-para-inspeccion-613506',
    'es'
  );

  assert(englishArticle, '找不到英文验收文章');
  assert(spanishArticle, '找不到西语验收文章');

  const englishFile = getFilePath('en', englishArticle.slug);
  const spanishFile = getFilePath('es', spanishArticle.slug);
  const englishOriginal = fs.readFileSync(englishFile, 'utf8');
  const spanishOriginal = fs.readFileSync(spanishFile, 'utf8');
  const marker = `ops-${Date.now()}`;

  try {
    const englishParsed = matter(englishOriginal);
    const spanishParsed = matter(spanishOriginal);

    writeArticleFile(
      englishFile,
      {
        ...englishParsed.data,
        title: `${englishParsed.data.title} ${marker}`,
        updatedAt: new Date().toISOString(),
      },
      englishParsed.content
    );

    writeArticleFile(
      spanishFile,
      {
        ...spanishParsed.data,
        title: `${spanishParsed.data.title} ${marker}`,
        updatedAt: new Date().toISOString(),
      },
      spanishParsed.content
    );

    const updatedEnglish = await contentRepository.getArticleBySlug(englishArticle.slug, 'en');
    const updatedSpanish = await contentRepository.getArticleBySlug(spanishArticle.slug, 'es');

    assert(updatedEnglish?.title.includes(marker), '英文文章写盘后仓库未读到新标题');
    assert(updatedSpanish?.title.includes(marker), '西语文章写盘后仓库未读到新标题');

    const englishListHtml = await fetchHtml('/en/articles');
    const spanishListHtml = await fetchHtml('/es/articulos');
    const englishDetailHtml = await fetchHtml(`/en/articles/${englishArticle.slug}`);
    const spanishDetailHtml = await fetchHtml(`/es/articulos/${spanishArticle.slug}`);

    if (englishListHtml) {
      assert(englishListHtml.includes(marker), '英文列表页未同步更新');
      assert(englishDetailHtml?.includes(marker), '英文详情页未同步更新');
      assert(spanishListHtml?.includes(marker), '西语列表页未同步更新');
      assert(spanishDetailHtml?.includes(marker), '西语详情页未同步更新');
    }
  } finally {
    fs.writeFileSync(englishFile, englishOriginal);
    fs.writeFileSync(spanishFile, spanishOriginal);
  }
}

async function verifyCreateBilingualPair() {
  const marker = `ops-${Date.now()}`;
  const translationKey = `ops-${marker}`;
  const englishSlug = `ops-english-${marker}`;
  const spanishSlug = `ops-spanish-${marker}`;
  const englishRelativePath = buildArticleRelativePath('en', englishSlug);
  const spanishRelativePath = buildArticleRelativePath('es', spanishSlug);
  const englishFile = path.join(getContentRoot(), englishRelativePath);
  const spanishFile = path.join(getContentRoot(), spanishRelativePath);
  const publishedAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const englishFrontmatter = {
    sourceId: 990001,
    translationKey,
    locale: 'en',
    slug: englishSlug,
    title: `Operational English ${marker}`,
    description: `Operational English description ${marker}`,
    createdAt: publishedAt,
    updatedAt: publishedAt,
    publishedAt,
    category: { name: 'News', slug: 'news' },
    author: { name: 'Yanghua Editorial Team', email: 'info@yhflexiblebusbar.com' },
    bodySource: 'content',
  };

  const spanishFrontmatter = {
    sourceId: 990002,
    translationKey,
    locale: 'es',
    slug: spanishSlug,
    title: `Operativo Español ${marker}`,
    description: `Descripción operativa ${marker}`,
    createdAt: publishedAt,
    updatedAt: publishedAt,
    publishedAt,
    category: { name: 'News', slug: 'news' },
    author: { name: 'Yanghua Editorial Team', email: 'info@yhflexiblebusbar.com' },
    fallbackLocale: 'en',
    bodySource: 'content',
  };

  try {
    writeArticleFile(englishFile, englishFrontmatter, `English body for ${marker}. This body is intentionally long enough for validation.`);
    writeArticleFile(spanishFile, spanishFrontmatter, `Contenido en español para ${marker}. Este texto también cumple con la longitud mínima.`);

    const englishArticle = await contentRepository.getArticleBySlug(englishSlug, 'en');
    const spanishArticle = await contentRepository.getArticleBySlug(spanishSlug, 'es');

    assert(englishArticle, '新建英文文章后无法在仓库读取');
    assert(spanishArticle, '新建西语文章后无法在仓库读取');
    assert(englishArticle.localizations?.some((item) => item.locale === 'es' && item.slug === spanishSlug), '英文文章缺少西语配对');
    assert(spanishArticle.localizations?.some((item) => item.locale === 'en' && item.slug === englishSlug), '西语文章缺少英文配对');

    const englishListHtml = await fetchHtml('/en/articles');
    const spanishListHtml = await fetchHtml('/es/articulos');
    const englishDetailHtml = await fetchHtml(`/en/articles/${englishSlug}`);
    const spanishDetailHtml = await fetchHtml(`/es/articulos/${spanishSlug}`);

    if (englishListHtml) {
      assert(englishListHtml.includes(englishFrontmatter.title), '新建英文文章未出现在英文列表页');
      assert(spanishListHtml?.includes(spanishFrontmatter.title), '新建西语文章未出现在西语列表页');
      assert(englishDetailHtml?.includes(englishFrontmatter.title), '新建英文文章详情页不可访问');
      assert(spanishDetailHtml?.includes(spanishFrontmatter.title), '新建西语文章详情页不可访问');
    }
  } finally {
    if (fs.existsSync(englishFile)) fs.unlinkSync(englishFile);
    if (fs.existsSync(spanishFile)) fs.unlinkSync(spanishFile);
  }
}

async function main() {
  await verifyExistingPairRoundtrip();
  await verifyCreateBilingualPair();
  console.log('Articles 运营工作流验收通过。');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

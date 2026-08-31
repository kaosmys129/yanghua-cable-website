import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { test } from 'node:test';
import matter from 'gray-matter';
import { assertSpanishArticleBody } from '../src/lib/yanghua/spanish-article-policy.mjs';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const articleDir = join(projectRoot, 'src/data/legacy-content/content/articles/es');
const publicDir = join(projectRoot, 'public');
const listPage = readFileSync(join(projectRoot, 'src/pages/es/articulos/index.astro'), 'utf8');
const detailPage = readFileSync(join(projectRoot, 'src/pages/es/articulos/[slug].astro'), 'utf8');
const geoflowArticle = readFileSync(join(projectRoot, 'src/lib/geoflow/article.ts'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));

function articleFiles() {
  return readdirSync(articleDir)
    .filter((file) => file.endsWith('.mdx'))
    .sort()
    .map((file) => join(articleDir, file));
}

test('all Spanish article covers use committed local assets', () => {
  const files = articleFiles();
  assert.equal(files.length, 47);

  for (const file of files) {
    const { data } = matter(readFileSync(file, 'utf8'));
    assert.match(data.cover?.src || '', /^\/storage\/uploads\/images\/articles\/es\//, file);
    const assetPath = join(publicDir, data.cover.src.replace(/^\//, ''));
    assert.ok(statSync(assetPath).isFile(), `${file} references missing ${assetPath}`);
  }
});

test('Spanish article bodies never contain the English fallback block', () => {
  for (const file of articleFiles()) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /fallbackLocale\s*[:"]\s*["']en["']/i, file);
    assert.doesNotMatch(source, /bodySource\s*[:"]\s*["']summary\+english-fallback["']/i, file);
    assert.doesNotMatch(source, /^##\s+English Reference\s*$/im, file);
    assert.doesNotMatch(source, /!\[[^\]]*\]\(https?:\/\//i, file);
  }
});

test('Spanish list and detail pages keep a visible image fallback', () => {
  assert.match(listPage, /no-image-available\.webp/);
  assert.match(detailPage, /no-image-available\.webp/);
  assert.match(listPage, /fallbackApplied/);
  assert.match(detailPage, /fallbackApplied/);
});

test('Spanish detail page keeps SEO image URLs absolute', () => {
  assert.match(detailPage, /coverImageUrl/);
  assert.match(detailPage, /new URL\(coverImage, YANGHUA_SITE_URL\)/);
  assert.match(detailPage, /image=\{coverImageUrl\}/);
  assert.match(detailPage, /image: coverImageUrl/);
});

test('GeoFlow Spanish ingestion rejects the legacy English fallback', () => {
  assert.match(geoflowArticle, /assertSpanishArticleBody/);
});

test('Spanish article policy rejects the English fallback at generation time', () => {
  assert.throws(
    () => assertSpanishArticleBody('es', '## English Reference\n\nEnglish body'),
    /forbidden fallback content/
  );
  assert.doesNotThrow(() => assertSpanishArticleBody('es', '## Resumen\n\nContenido en español'));
  assert.doesNotThrow(() => assertSpanishArticleBody('en', '## English Reference\n\nEnglish body'));
});

test('the production build runs the Spanish content guard first', () => {
  assert.equal(packageJson.scripts['content:check'], 'node scripts/verify-spanish-articles.mjs');
  assert.match(packageJson.scripts.build, /content:check/);
});

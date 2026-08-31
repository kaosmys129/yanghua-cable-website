import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { test } from 'node:test';
import matter from 'gray-matter';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const articleDir = join(projectRoot, 'src/data/legacy-content/content/articles/en');
const publicDir = join(projectRoot, 'public');
const listPage = readFileSync(join(projectRoot, 'src/pages/en/articles/index.astro'), 'utf8');
const detailPage = readFileSync(join(projectRoot, 'src/pages/en/articles/[slug].astro'), 'utf8');

function articleFiles() {
  return readdirSync(articleDir)
    .filter((file) => file.endsWith('.mdx'))
    .sort()
    .map((file) => join(articleDir, file));
}

function publicAssetPath(src) {
  return join(publicDir, String(src).replace(/^\//, ''));
}

function markdownImageSources(body) {
  return [...body.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)].map((match) => match[1]);
}

function assertLocalNonEmptyAsset(src, context) {
  assert.match(src, /^\//, `${context} must use a root-relative asset path`);
  assert.doesNotMatch(src, /^\/\/|^https?:\/\//i, `${context} must not use a remote asset: ${src}`);
  const assetPath = publicAssetPath(src);
  assert.ok(statSync(assetPath).isFile(), `${context} references missing ${assetPath}`);
  assert.ok(statSync(assetPath).size > 0, `${context} references an empty ${assetPath}`);
}

test('all English article covers and body images use committed local assets', () => {
  const files = articleFiles();
  assert.equal(files.length, 113);

  for (const file of files) {
    const { data, content } = matter(readFileSync(file, 'utf8'));
    assertLocalNonEmptyAsset(data.cover?.src || '', `${file} cover`);
    for (const src of markdownImageSources(content)) {
      assertLocalNonEmptyAsset(src, `${file} body image`);
    }
  }
});

test('English article list and detail pages keep a visible image fallback', () => {
  assert.match(listPage, /no-image-available\.webp/);
  assert.match(detailPage, /no-image-available\.webp/);
  assert.match(listPage, /fallbackApplied/);
  assert.match(detailPage, /fallbackApplied/);
  assert.match(detailPage, /geo-article/);
});

test('English detail page keeps SEO image URLs absolute', () => {
  assert.match(detailPage, /coverImageUrl/);
  assert.match(detailPage, /new URL\(coverImage, YANGHUA_SITE_URL\)/);
  assert.match(detailPage, /image=\{coverImageUrl\}/);
  assert.match(detailPage, /image: coverImageUrl/);
});

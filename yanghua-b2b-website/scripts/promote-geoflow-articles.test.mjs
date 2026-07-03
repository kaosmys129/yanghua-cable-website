import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import matter from 'gray-matter';

import { promoteGeoflowArticles } from './promote-geoflow-articles.mjs';

function makeTempContentRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'geoflow-promote-'));
  const contentRoot = path.join(root, 'content');
  fs.mkdirSync(path.join(contentRoot, 'articles', '_incoming', 'en'), { recursive: true });
  return contentRoot;
}

function writeIncoming(contentRoot, name, frontmatter, body = 'Body') {
  const filePath = path.join(contentRoot, 'articles', '_incoming', 'en', name);
  fs.writeFileSync(filePath, matter.stringify(body, frontmatter));
  return filePath;
}

const validFrontmatter = {
  locale: 'en',
  slug: 'approved-geoflow-article',
  title: 'Approved GEOFlow Article',
  description: 'A checked GEOFlow article.',
  publishedAt: '2026-07-02T00:00:00.000Z',
  seo: {
    title: 'Approved GEOFlow Article',
    description: 'A checked GEOFlow article.',
    keywords: ['flexible busbar'],
  },
  geo: {
    answerSummary: 'Flexible busbar helps high-current routing.',
    targetQueries: ['flexible busbar'],
    buyerIntent: 'comparison',
    citations: [{ label: 'Yanghua product page', url: 'https://www.yhflexiblebusbar.com/en/products' }],
  },
  geoflow: {
    status: 'approved',
    sourceBatchId: 'batch-1',
  },
};

test('dry-run reports an approved article without moving it', async () => {
  const contentRoot = makeTempContentRoot();
  const sourcePath = writeIncoming(contentRoot, 'geoflow-approved-geoflow-article.mdx', validFrontmatter);

  const result = await promoteGeoflowArticles({ contentRoot, dryRun: true, reviewedBy: 'ops' });

  assert.equal(result.promoted.length, 1);
  assert.equal(result.blockingErrors.length, 0);
  assert.equal(fs.existsSync(sourcePath), true);
  assert.equal(fs.existsSync(path.join(contentRoot, 'articles', 'en', 'approved-geoflow-article.mdx')), false);
});

test('promotion moves an approved article and writes published review state', async () => {
  const contentRoot = makeTempContentRoot();
  writeIncoming(contentRoot, 'geoflow-approved-geoflow-article.mdx', validFrontmatter);

  const result = await promoteGeoflowArticles({
    contentRoot,
    dryRun: false,
    reviewedBy: 'ops',
    now: () => '2026-07-02T12:00:00.000Z',
  });

  const targetPath = path.join(contentRoot, 'articles', 'en', 'approved-geoflow-article.mdx');
  const parsed = matter(fs.readFileSync(targetPath, 'utf8'));

  assert.equal(result.promoted.length, 1);
  assert.equal(result.blockingErrors.length, 0);
  assert.equal(fs.existsSync(targetPath), true);
  assert.equal(parsed.data.geoflow.status, 'published');
  assert.equal(parsed.data.geoflow.reviewedAt, '2026-07-02T12:00:00.000Z');
  assert.equal(parsed.data.geoflow.reviewedBy, 'ops');
  assert.equal(parsed.data.geoflow.sourceBatchId, 'batch-1');
});

test('promotion blocks missing GEO metadata before moving', async () => {
  const contentRoot = makeTempContentRoot();
  const sourcePath = writeIncoming(contentRoot, 'geoflow-bad.mdx', {
    ...validFrontmatter,
    slug: 'bad',
    geo: { answerSummary: '', targetQueries: [] },
  });

  const result = await promoteGeoflowArticles({ contentRoot, dryRun: false });

  assert.equal(result.promoted.length, 0);
  assert.equal(result.blockingErrors.length >= 1, true);
  assert.match(result.blockingErrors.map((error) => error.message).join('\n'), /geo.targetQueries/);
  assert.equal(fs.existsSync(sourcePath), true);
});

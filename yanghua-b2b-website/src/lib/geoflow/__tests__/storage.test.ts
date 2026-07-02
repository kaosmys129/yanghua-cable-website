import { describe, expect, it } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { receiveGeoflowArticle } from '../storage';

describe('GEOFlow article storage', () => {
  const payload = {
    geoflowArticleId: 'geo-storage-1',
    locale: 'en' as const,
    slug: 'storage-test-guide',
    title: 'Storage Test Guide',
    description: 'A GEOFlow storage test article.',
    bodyMarkdown: '## Direct answer\n\nFlexible busbar content.',
    publishedAt: '2026-06-30T08:00:00.000Z',
    updatedAt: '2026-06-30T09:00:00.000Z',
    category: { name: 'Technical Guides', slug: 'technical-guides' },
    author: { name: 'Yanghua Engineering Team', email: 'engineering@yhflexiblebusbar.com' },
    targetQueries: ['storage test'],
    answerSummary: 'Storage test answer.',
    faqs: [],
    citations: [],
    sourceMaterials: [],
    buyerIntent: 'awareness' as const,
    relatedProductIds: [],
    relatedSolutionIds: [],
  };

  it('writes incoming MDX and returns the public article URL', async () => {
    const contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'geoflow-content-'));
    const result = await receiveGeoflowArticle({
      payload,
      idempotencyKey: 'idem-1',
      contentRoot,
      now: new Date('2026-06-30T10:00:00.000Z'),
    });

    expect(result).toMatchObject({
      ok: true,
      status: 'imported',
      remoteId: expect.stringContaining('geoflow-storage-test-guide'),
      remoteUrl: '/en/articles/storage-test-guide',
    });
    expect(fs.existsSync(path.join(contentRoot, 'articles/_incoming/en/geoflow-storage-test-guide.mdx'))).toBe(true);
  });

  it('returns the previous result for duplicate idempotency keys', async () => {
    const contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'geoflow-content-'));
    const first = await receiveGeoflowArticle({
      payload,
      idempotencyKey: 'idem-duplicate',
      contentRoot,
      now: new Date('2026-06-30T10:00:00.000Z'),
    });
    const second = await receiveGeoflowArticle({
      payload: { ...payload, slug: 'changed-slug' },
      idempotencyKey: 'idem-duplicate',
      contentRoot,
      now: new Date('2026-06-30T10:01:00.000Z'),
    });

    expect(second).toEqual({ ...first, status: 'duplicate' });
    expect(fs.existsSync(path.join(contentRoot, 'articles/_incoming/en/geoflow-changed-slug.mdx'))).toBe(false);
  });

  it('stores native GEOFlow payloads with a review status in the import log', async () => {
    const contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'geoflow-content-'));
    const result = await receiveGeoflowArticle({
      payload: {
        version: '1.0',
        source: 'geoflow',
        event: 'article.publish',
        article: {
          id: 99,
          title: 'Native Payload Guide',
          slug: 'native-payload-guide',
          excerpt: 'Native GEOFlow payload import.',
          content: '## Direct answer\n\nNative content without Yanghua metadata.',
          content_format: 'markdown',
          keywords: 'native payload, flexible busbar',
          meta_description: 'Native GEOFlow payload import.',
          status: 'published',
          published_at: '2026-06-30T08:00:00.000Z',
          updated_at: '2026-06-30T09:00:00.000Z',
          category: { id: 1, name: 'Technical Guides', slug: 'technical-guides' },
          author: { id: 2, name: 'Yanghua Engineering Team' },
        },
        assets: { images: [] },
      },
      idempotencyKey: 'native-idem-1',
      contentRoot,
      now: new Date('2026-06-30T10:00:00.000Z'),
    });

    const mdxPath = path.join(contentRoot, 'articles/_incoming/en/geoflow-native-payload-guide.mdx');
    const logPath = path.join(contentRoot, 'articles/_incoming/geoflow-import-log.json');
    const log = JSON.parse(fs.readFileSync(logPath, 'utf8'));

    expect(result.remoteUrl).toBe('/en/articles/native-payload-guide');
    expect(fs.readFileSync(mdxPath, 'utf8')).toContain('reviewStatus: needs_geo_metadata');
    expect(log[0].reviewStatus).toBe('needs_geo_metadata');
  });
});

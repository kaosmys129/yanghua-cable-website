import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildArticlesMapPayload,
  buildLlmsTxt,
  buildSitemapXml,
  normalizeArticleModule,
  normalizeHubModule,
} from '../src/lib/yanghua/articles-core.mjs';
import * as articlesCore from '../src/lib/yanghua/articles-core.mjs';

const baseArticleFrontmatter = {
  locale: 'en',
  slug: 'flexible-busbar-vs-cable',
  title: 'Flexible Busbar vs Cable',
  description: 'A procurement comparison for high-current projects.',
  updatedAt: '2026-06-01T00:00:00.000Z',
  publishedAt: '2026-05-01T00:00:00.000Z',
  translationKey: 'geo-flexible-busbar-vs-cable',
  geo: {
    answerSummary: 'Flexible busbar reduces parallel runs when high current routing is compact.',
    buyerIntent: 'comparison',
    targetQueries: ['flexible busbar vs cable'],
    relatedProductIds: ['flexible-busbar'],
    relatedSolutionIds: ['energy-storage'],
    citations: [{ label: 'Yanghua source', url: 'https://www.yhflexiblebusbar.com/en/products/flexible-busbar' }],
  },
};

test('normalizes bilingual article URLs and GEO status for public rendering', () => {
  const english = normalizeArticleModule({
    path: '/content/articles/en/flexible-busbar-vs-cable.mdx',
    frontmatter: {
      ...baseArticleFrontmatter,
      geoflow: { status: 'published', reviewedAt: '2026-06-02T00:00:00.000Z', reviewedBy: 'ops' },
    },
  });

  const spanish = normalizeArticleModule({
    path: '/content/articles/es/busbar-flexible-vs-cable.mdx',
    frontmatter: {
      ...baseArticleFrontmatter,
      locale: 'es',
      slug: 'busbar-flexible-vs-cable',
      title: 'Busbar flexible vs cable',
      geoflow: { reviewStatus: 'approved' },
    },
  });

  assert.equal(english.url, '/en/articles/flexible-busbar-vs-cable');
  assert.equal(spanish.url, '/es/articulos/busbar-flexible-vs-cable');
  assert.equal(english.geoflow.status, 'published');
  assert.equal(spanish.geoflow.status, 'approved');
  assert.equal(english.isPublic, true);
  assert.equal(spanish.isPublic, true);
});

test('normalizes Portuguese article URLs under the Portuguese route', () => {
  const portuguese = normalizeArticleModule({
    path: '/content/articles/pt/barramento-flexivel-vs-cabo.mdx',
    frontmatter: {
      ...baseArticleFrontmatter,
      locale: 'pt',
      slug: 'barramento-flexivel-vs-cabo',
      title: 'Barramento flexível vs cabo',
      geoflow: { status: 'published' },
    },
  });

  assert.equal(portuguese.locale, 'pt');
  assert.equal(portuguese.url, '/pt/artigos/barramento-flexivel-vs-cabo');
});

test('uses the article directory locale when stale frontmatter disagrees', () => {
  const portuguese = normalizeArticleModule({
    path: '/content/articles/pt/artigo-importado.mdx',
    frontmatter: {
      ...baseArticleFrontmatter,
      locale: 'es',
      slug: 'artigo-importado',
      geoflow: { status: 'published' },
    },
  });

  assert.equal(portuguese.locale, 'pt');
  assert.equal(portuguese.url, '/pt/artigos/artigo-importado');
});

test('builds article hreflang URLs from each translation actual URL', () => {
  assert.equal(typeof articlesCore.buildArticleHreflangAlternates, 'function');

  const articles = [
    ['en', 'flexible-busbar-vs-cable'],
    ['es', 'busbar-flexible-vs-cable'],
    ['pt', 'barramento-flexivel-vs-cabo'],
  ].map(([locale, slug]) => normalizeArticleModule({
    path: `/content/articles/${locale}/${slug}.mdx`,
    frontmatter: {
      ...baseArticleFrontmatter,
      locale,
      slug,
      geoflow: { status: 'published' },
    },
  }));

  const alternates = articlesCore.buildArticleHreflangAlternates(articles[0], articles, 'https://www.yhflexiblebusbar.com/');
  assert.deepEqual(alternates, [
    { hreflang: 'en', href: 'https://www.yhflexiblebusbar.com/en/articles/flexible-busbar-vs-cable' },
    { hreflang: 'es', href: 'https://www.yhflexiblebusbar.com/es/articulos/busbar-flexible-vs-cable' },
    { hreflang: 'pt', href: 'https://www.yhflexiblebusbar.com/pt/artigos/barramento-flexivel-vs-cabo' },
    { hreflang: 'x-default', href: 'https://www.yhflexiblebusbar.com/en/articles/flexible-busbar-vs-cable' },
  ]);
});

test('does not invent hreflang relationships when a translation key is ambiguous', () => {
  const articles = ['preferred-slug', 'duplicate-slug'].map((slug) => normalizeArticleModule({
    path: `/content/articles/en/${slug}.mdx`,
    frontmatter: {
      ...baseArticleFrontmatter,
      slug,
      geoflow: { status: 'published' },
    },
  }));

  assert.deepEqual(
    articlesCore.buildArticleHreflangAlternates(articles[0], articles, 'https://www.yhflexiblebusbar.com'),
    [
      { hreflang: 'en', href: 'https://www.yhflexiblebusbar.com/en/articles/preferred-slug' },
      { hreflang: 'x-default', href: 'https://www.yhflexiblebusbar.com/en/articles/preferred-slug' },
    ]
  );
});

test('keeps legacy articles public but blocks unapproved GEOFlow drafts', () => {
  const legacy = normalizeArticleModule({
    path: '/content/articles/en/legacy-news.mdx',
    frontmatter: {
      locale: 'en',
      slug: 'legacy-news',
      title: 'Legacy News',
    },
  });

  const draft = normalizeArticleModule({
    path: '/content/articles/en/geoflow-draft.mdx',
    frontmatter: {
      ...baseArticleFrontmatter,
      slug: 'geoflow-draft',
      geoflow: { status: 'needs_review' },
    },
  });

  assert.equal(legacy.isPublic, true);
  assert.equal(legacy.geoflow.status, 'legacy');
  assert.equal(draft.isPublic, false);
});

test('builds public machine-readable articles map and llms text', () => {
  const article = normalizeArticleModule({
    path: '/content/articles/en/flexible-busbar-vs-cable.mdx',
    frontmatter: {
      ...baseArticleFrontmatter,
      geoflow: { status: 'published', sourceBatchId: 'batch-a' },
    },
  });
  const blocked = normalizeArticleModule({
    path: '/content/articles/en/geoflow-draft.mdx',
    frontmatter: {
      ...baseArticleFrontmatter,
      slug: 'geoflow-draft',
      geoflow: { status: 'needs_geo_metadata' },
    },
  });
  const hub = normalizeHubModule({
    path: '/content/hubs/en/flexible-busbar-vs-cable.mdx',
    frontmatter: {
      locale: 'en',
      slug: 'flexible-busbar-vs-cable',
      title: 'Flexible Busbar vs Cable',
      intro: 'Comparison hub.',
      featuredArticleSlugs: ['flexible-busbar-vs-cable'],
    },
  });

  const map = buildArticlesMapPayload({
    siteUrl: 'https://www.yhflexiblebusbar.com/',
    articles: [article, blocked],
    hubs: [hub],
    generatedAt: '2026-07-02T00:00:00.000Z',
  });

  assert.equal(map.articles.length, 1);
  assert.equal(map.articles[0].url, 'https://www.yhflexiblebusbar.com/en/articles/flexible-busbar-vs-cable');
  assert.deepEqual(map.articles[0].targetQueries, ['flexible busbar vs cable']);
  assert.equal(map.hubs[0].url, 'https://www.yhflexiblebusbar.com/en/articles/hub/flexible-busbar-vs-cable');

  const llms = buildLlmsTxt({
    siteUrl: 'https://www.yhflexiblebusbar.com/',
    articles: [article, blocked],
    hubs: [hub],
  });

  assert.match(llms, /## GEO Topic Hubs/);
  assert.match(llms, /Flexible Busbar vs Cable: https:\/\/www\.yhflexiblebusbar\.com\/en\/articles\/hub\/flexible-busbar-vs-cable/);
  assert.match(llms, /Target queries: flexible busbar vs cable/);
  assert.doesNotMatch(llms, /geoflow-draft/);
});

test('builds sitemap xml for public articles and hubs', () => {
  const article = normalizeArticleModule({
    path: '/content/articles/en/flexible-busbar-vs-cable.mdx',
    frontmatter: {
      ...baseArticleFrontmatter,
      geoflow: { status: 'published' },
    },
  });
  const blocked = normalizeArticleModule({
    path: '/content/articles/en/geoflow-draft.mdx',
    frontmatter: {
      ...baseArticleFrontmatter,
      slug: 'geoflow-draft',
      geoflow: { status: 'needs_review' },
    },
  });
  const hub = normalizeHubModule({
    path: '/content/hubs/en/flexible-busbar-vs-cable.mdx',
    frontmatter: {
      locale: 'en',
      slug: 'flexible-busbar-vs-cable',
      title: 'Flexible Busbar vs Cable',
    },
  });

  const xml = buildSitemapXml({
    siteUrl: 'https://www.yhflexiblebusbar.com/',
    articles: [article, blocked],
    hubs: [hub],
  });

  assert.match(xml, /<loc>https:\/\/www\.yhflexiblebusbar\.com\/en\/articles\/flexible-busbar-vs-cable<\/loc>/);
  assert.match(xml, /<loc>https:\/\/www\.yhflexiblebusbar\.com\/en\/articles\/hub\/flexible-busbar-vs-cable<\/loc>/);
  assert.doesNotMatch(xml, /geoflow-draft/);
});

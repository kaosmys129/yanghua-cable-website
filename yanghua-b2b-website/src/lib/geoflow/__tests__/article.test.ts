import { describe, expect, it } from '@jest/globals';
import matter from 'gray-matter';
import {
  buildIncomingArticleMdx,
  normalizeGeoflowArticlePayload,
} from '../article';
import {
  generateGeoArticleFAQSchema,
  generateGeoArticleHowToSchema,
} from '../structured-data';

describe('GEOFlow article payloads', () => {
  const payload = {
    geoflowArticleId: 'geo-article-1',
    locale: 'en' as const,
    slug: 'flexible-busbar-vs-cable-selection-guide',
    title: 'Flexible Busbar vs Cable Selection Guide',
    description: 'How engineers choose flexible busbar systems for high-current projects.',
    bodyMarkdown: '## How to choose\n\n1. Confirm current rating.\n2. Check routing space.',
    publishedAt: '2026-06-30T08:00:00.000Z',
    updatedAt: '2026-06-30T09:00:00.000Z',
    category: { name: 'Technical Guides', slug: 'technical-guides' },
    author: { name: 'Yanghua Engineering Team', email: 'engineering@yhflexiblebusbar.com' },
    targetQueries: ['flexible busbar vs cable', 'how to choose flexible busbar'],
    answerSummary:
      'Flexible busbar is usually selected when high current, compact routing, and stable heat distribution matter more than conventional cable pulling.',
    faqs: [
      {
        question: 'When should engineers choose flexible busbar instead of cable?',
        answer: 'Use flexible busbar for high-current routes that need compact layout and fewer parallel cable runs.',
      },
    ],
    citations: [{ label: 'Yanghua engineering knowledge base', note: 'Internal product guidance' }],
    sourceMaterials: ['Yanghua product catalog'],
    buyerIntent: 'selection' as const,
    relatedProductIds: ['flexible-busbar-2000a'],
    relatedSolutionIds: ['energy-storage'],
    seoTitle: 'Flexible Busbar vs Cable Selection Guide',
    seoDescription: 'Selection criteria for replacing high-current cables with flexible busbar systems.',
    keywords: ['flexible busbar', 'high current cable replacement'],
    canonicalHint: '/en/articles/flexible-busbar-vs-cable-selection-guide',
  };

  it('normalizes GEOFlow payloads into article frontmatter with geo fields', () => {
    const article = normalizeGeoflowArticlePayload(payload);

    expect(article.locale).toBe('en');
    expect(article.slug).toBe('flexible-busbar-vs-cable-selection-guide');
    expect(article.geo.targetQueries).toEqual(['flexible busbar vs cable', 'how to choose flexible busbar']);
    expect(article.geo.buyerIntent).toBe('selection');
    expect(article.seo?.title).toBe('Flexible Busbar vs Cable Selection Guide');
  });

  it('normalizes native GEOFlow distribution payloads and strips Yanghua GEO metadata comments', () => {
    const nativePayload = {
      version: '1.0',
      source: 'geoflow',
      event: 'article.publish',
      article: {
        id: 42,
        title: 'Energy Storage Busbar Selection Guide',
        slug: 'energy-storage-busbar-selection-guide',
        excerpt: 'How procurement and engineering teams evaluate flexible busbars for BESS projects.',
        content: `## Direct answer

Flexible busbars help BESS teams route high current in compact spaces while reducing parallel cable complexity.

<!-- yanghua-geo-json
{
  "geo": {
    "targetQueries": ["energy storage busbar", "BESS flexible busbar"],
    "answerSummary": "For BESS projects, flexible busbars are useful when high current, compact cabinet routing, and repeatable installation matter.",
    "faqs": [{ "question": "Where are flexible busbars used in BESS?", "answer": "They are commonly used between battery racks, combiner sections, and power conversion interfaces when the current and routing justify a busbar." }],
    "citations": [{ "label": "Yanghua engineering knowledge base", "note": "Internal BESS application notes" }],
    "sourceMaterials": ["Yanghua BESS application notes"],
    "buyerIntent": "selection",
    "relatedProductIds": ["flexible-busbar"],
    "relatedSolutionIds": ["energy-storage"]
  },
  "seo": {
    "title": "Energy Storage Busbar Selection Guide",
    "description": "Selection guidance for flexible busbars in BESS projects.",
    "keywords": ["energy storage busbar", "BESS flexible busbar"]
  }
}
-->
`,
        content_format: 'markdown',
        keywords: 'energy storage busbar, BESS flexible busbar',
        meta_description: 'Selection guidance for flexible busbars in BESS projects.',
        status: 'published',
        published_at: '2026-06-30T08:00:00.000Z',
        updated_at: '2026-06-30T09:00:00.000Z',
        category: { id: 1, name: 'Technical Guides', slug: 'technical-guides' },
        author: { id: 2, name: 'Yanghua Engineering Team' },
        task: { id: 3, name: 'BESS article task' },
      },
      assets: { images: [] },
    };

    const article = normalizeGeoflowArticlePayload(nativePayload);

    expect(article.geoflow.articleId).toBe('42');
    expect(article.geo.targetQueries).toEqual(['energy storage busbar', 'BESS flexible busbar']);
    expect(article.geo.buyerIntent).toBe('selection');
    expect(article.seo?.description).toBe('Selection guidance for flexible busbars in BESS projects.');
    expect(article.bodyMarkdown).not.toContain('yanghua-geo-json');
  });

  it('marks native GEOFlow payloads without Yanghua GEO metadata as needing metadata review', () => {
    const article = normalizeGeoflowArticlePayload({
      version: '1.0',
      source: 'geoflow',
      event: 'article.publish',
      article: {
        id: 43,
        title: 'Missing Metadata Article',
        slug: 'missing-metadata-article',
        excerpt: 'This native payload does not include the Yanghua GEO JSON block.',
        content: '## Direct answer\n\nA draft without GEO metadata.',
        content_format: 'markdown',
        keywords: 'flexible busbar',
        meta_description: 'A draft without GEO metadata.',
        status: 'published',
        published_at: '2026-06-30T08:00:00.000Z',
        updated_at: '2026-06-30T09:00:00.000Z',
        category: { id: 1, name: 'Technical Guides', slug: 'technical-guides' },
        author: { id: 2, name: 'Yanghua Engineering Team' },
      },
      assets: { images: [] },
    });

    expect(article.geoflow.reviewStatus).toBe('needs_geo_metadata');
    expect(article.geo.targetQueries).toEqual(['flexible busbar']);
    expect(article.bodyMarkdown).toContain('A draft without GEO metadata');
  });

  it('lets hidden Yanghua GEO metadata override native slug and locale', () => {
    const article = normalizeGeoflowArticlePayload({
      version: '1.0',
      source: 'geoflow',
      event: 'article.publish',
      article: {
        id: 44,
        title: 'Generated Title That Changed The Slug',
        slug: 'generated-title-that-changed-the-slug',
        excerpt: 'A rewrite that should preserve the original Yanghua URL.',
        content: `## Direct answer

The public Yanghua slug should come from the hidden metadata block.

<!-- yanghua-geo-json
{
  "locale": "en",
  "slug": "original-yanghua-article-slug",
  "geo": {
    "targetQueries": ["flexible busbar vs cable"],
    "answerSummary": "Hidden metadata can preserve the original Yanghua article slug even when GEOFlow generates an internal slug.",
    "faqs": [{ "question": "Can the original slug be preserved?", "answer": "Yes, the hidden metadata slug takes precedence during Yanghua import." }],
    "citations": [{ "label": "Yanghua GEOFlow import policy" }],
    "sourceMaterials": ["Original Yanghua article"],
    "buyerIntent": "comparison",
    "relatedProductIds": ["flexible-busbar"],
    "relatedSolutionIds": ["high-current-power-distribution"]
  },
  "seo": {
    "title": "Original Yanghua Article Slug",
    "description": "Slug preservation test.",
    "keywords": ["flexible busbar vs cable"]
  }
}
-->
`,
        content_format: 'markdown',
        keywords: 'flexible busbar vs cable',
        meta_description: 'Slug preservation test.',
        status: 'published',
        published_at: '2026-06-30T08:00:00.000Z',
        updated_at: '2026-06-30T09:00:00.000Z',
        category: { id: 1, name: 'Technical Guides', slug: 'technical-guides' },
        author: { id: 2, name: 'Yanghua Engineering Team' },
      },
      assets: { images: [] },
    });

    expect(article.slug).toBe('original-yanghua-article-slug');
    expect(article.locale).toBe('en');
    expect(article.geoflow.reviewStatus).toBe('needs_review');
  });

  it('renders incoming MDX that keeps GEO data in frontmatter', () => {
    const article = normalizeGeoflowArticlePayload(payload);
    const mdx = buildIncomingArticleMdx(article);
    const parsed = matter(mdx);

    expect(parsed.data.geo.answerSummary).toContain('Flexible busbar is usually selected');
    expect(parsed.data.geo.faqs[0].question).toMatch(/choose flexible busbar/i);
    expect(parsed.content).toContain('## How to choose');
  });

  it('generates FAQPage JSON-LD from GEO FAQs', () => {
    const article = normalizeGeoflowArticlePayload(payload);
    const schema = generateGeoArticleFAQSchema(article, 'https://www.yhflexiblebusbar.com/en/articles/flexible-busbar-vs-cable-selection-guide');

    expect(schema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
    });
    expect(schema?.mainEntity).toHaveLength(1);
    expect(schema?.mainEntity[0].acceptedAnswer.text).toContain('high-current routes');
  });

  it('generates HowTo JSON-LD for selection guides with numbered steps', () => {
    const article = normalizeGeoflowArticlePayload(payload);
    const schema = generateGeoArticleHowToSchema(article, 'https://www.yhflexiblebusbar.com/en/articles/flexible-busbar-vs-cable-selection-guide');

    expect(schema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'Flexible Busbar vs Cable Selection Guide',
    });
    expect(schema?.step).toEqual([
      { '@type': 'HowToStep', position: 1, text: 'Confirm current rating.' },
      { '@type': 'HowToStep', position: 2, text: 'Check routing space.' },
    ]);
  });
});

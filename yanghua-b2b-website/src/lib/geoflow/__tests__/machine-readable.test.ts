import { describe, expect, it } from '@jest/globals';
import { buildArticlesMapPayload, buildLlmsTxt } from '../machine-readable';

describe('GEOFlow machine-readable outputs', () => {
  const articles: any[] = [
    {
      title: 'Flexible Busbar vs Cable Selection Guide',
      description: 'Selection criteria for high-current projects.',
      slug: 'flexible-busbar-vs-cable-selection-guide',
      locale: 'en',
      updatedAt: '2026-06-30T09:00:00.000Z',
      geo: {
        targetQueries: ['flexible busbar vs cable'],
        answerSummary: 'Use flexible busbar when high current and compact routing matter.',
        buyerIntent: 'selection',
        faqs: [],
        citations: [],
        sourceMaterials: [],
        relatedProductIds: ['flexible-busbar-2000a'],
        relatedSolutionIds: ['energy-storage'],
      },
    },
  ];

  it('builds an articles-map payload for AI agents', () => {
    const payload = buildArticlesMapPayload(articles, 'https://www.yhflexiblebusbar.com');

    expect(payload.articles[0]).toMatchObject({
      title: 'Flexible Busbar vs Cable Selection Guide',
      url: 'https://www.yhflexiblebusbar.com/en/articles/flexible-busbar-vs-cable-selection-guide',
      targetQueries: ['flexible busbar vs cable'],
      buyerIntent: 'selection',
    });
  });

  it('builds llms.txt with GEO topic and article references', () => {
    const text = buildLlmsTxt({
      siteUrl: 'https://www.yhflexiblebusbar.com',
      articles,
      hubs: [{ title: 'Flexible Busbar vs Cable', slug: 'flexible-busbar-vs-cable', locale: 'en' } as any],
    });

    expect(text).toContain('# Yanghua Cable');
    expect(text).toContain('/en/articles/flexible-busbar-vs-cable-selection-guide');
    expect(text).toContain('/en/articles/hub/flexible-busbar-vs-cable');
  });
});

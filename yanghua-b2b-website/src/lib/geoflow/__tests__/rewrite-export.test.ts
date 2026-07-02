import { describe, expect, it } from '@jest/globals';
import {
  buildGeoRewriteBundle,
  buildGeoRewriteTask,
  classifyArticleForGeoRewrite,
} from '../rewrite-export';

describe('GEOFlow existing article rewrite export', () => {
  const technicalArticle = {
    locale: 'en' as const,
    slug: 'yanghua-insights-high-current-multi-core-cables-1600a-flexible-busbar-vs-cable',
    title: 'Yanghua Insights: 1600A Flexible Busbar VS 240mm² Cable 4-Parallel',
    description: 'Selection comparison for replacing parallel high-current cables with flexible busbar.',
    body: 'High-current multi-core cables often require 4 or 8 parallel connections. Flexible busbar can simplify routing and current sharing.',
    publishedAt: '2025-07-08T00:00:00.000Z',
    updatedAt: '2025-07-08T00:00:00.000Z',
    translationKey: 'news-591755',
    sourceUrl: 'http://www.yanghuasti.com/news-media/591755',
    category: { name: 'News', slug: 'news' },
  };

  it('classifies high-intent technical comparison articles as A priority', () => {
    const classification = classifyArticleForGeoRewrite(technicalArticle);

    expect(classification.priorityClass).toBe('A');
    expect(classification.buyerIntent).toBe('comparison');
    expect(classification.rewriteMode).toBe('technical_geo_rewrite');
    expect(classification.topicSlugs).toEqual(
      expect.arrayContaining(['flexible-busbar-vs-cable', 'high-current-power-distribution'])
    );
  });

  it('builds a GEOFlow rewrite task that preserves the original URL and requires Yanghua GEO metadata', () => {
    const task = buildGeoRewriteTask(technicalArticle, 'https://www.yhflexiblebusbar.com');

    expect(task.slug).toBe(technicalArticle.slug);
    expect(task.publicUrl).toBe(
      'https://www.yhflexiblebusbar.com/en/articles/yanghua-insights-high-current-multi-core-cables-1600a-flexible-busbar-vs-cable'
    );
    expect(task.targetQueries).toEqual(expect.arrayContaining(['flexible busbar vs cable']));
    expect(task.prompt).toContain('preserve the exact slug');
    expect(task.prompt).toContain('yanghua-geo-json');
  });

  it('keeps company/event articles in a light-enhancement C queue', () => {
    const classification = classifyArticleForGeoRewrite({
      locale: 'en',
      slug: 'dragon-boat-festival-greetings-757667',
      title: 'Dragon Boat Festival Greetings',
      description: 'YanghuaSTI sends holiday greetings.',
      body: 'YanghuaSTI wishes partners a peaceful Dragon Boat Festival.',
      publishedAt: '2025-05-31T00:00:00.000Z',
      updatedAt: '2025-05-31T00:00:00.000Z',
      translationKey: 'news-757667',
      category: { name: 'News', slug: 'news' },
    });

    expect(classification.priorityClass).toBe('C');
    expect(classification.rewriteMode).toBe('light_authority_refresh');
    expect(classification.buyerIntent).toBe('awareness');
  });

  it('keeps product exhibition invitations out of the A priority technical queue', () => {
    const classification = classifyArticleForGeoRewrite({
      locale: 'en',
      slug: 'invitation-energy-storage-exhibition-high-current-flexible-busbar',
      title: 'Invitation | Energy Storage Summit & Exhibition High Current Flexible Busbar Booth',
      description: 'Invitation to visit Yanghua at an energy storage exhibition.',
      body: 'Yanghua will show high-current flexible busbar products at the exhibition booth.',
      publishedAt: '2025-04-08T00:00:00.000Z',
      updatedAt: '2025-04-08T00:00:00.000Z',
      translationKey: 'news-invitation',
      category: { name: 'News', slug: 'news' },
    });

    expect(classification.priorityClass).toBe('C');
    expect(classification.rewriteMode).toBe('light_authority_refresh');
  });

  it('keeps event recap articles with generic solution wording out of the A queue', () => {
    const classification = classifyArticleForGeoRewrite({
      locale: 'en',
      slug: 'digital-energy-exhibition-high-current-flexible-busbar-highlights',
      title: 'Digital Energy Exhibition Highlights for High Current Flexible Busbar',
      description: 'A recap of Yanghua booth activity at an industry exhibition.',
      body: 'The booth showed flexible busbar solutions and received visitors from the power industry.',
      publishedAt: '2024-09-11T00:00:00.000Z',
      updatedAt: '2024-09-11T00:00:00.000Z',
      translationKey: 'news-exhibition',
      category: { name: 'News', slug: 'news' },
    });

    expect(classification.priorityClass).toBe('C');
  });

  it('keeps media reports and product debuts in the C authority queue', () => {
    const classification = classifyArticleForGeoRewrite({
      locale: 'en',
      slug: 'media-reports-high-current-flexible-busbar-debuts-at-expo',
      title: 'Media Reports on Yanghua High Current Flexible Busbar Debuts at Expo',
      description: 'A media recap about a product debut at an expo.',
      body: 'The article reports on Yanghua high-current flexible busbar appearing at an industry expo.',
      publishedAt: '2024-06-20T00:00:00.000Z',
      updatedAt: '2024-06-20T00:00:00.000Z',
      translationKey: 'news-media-report',
      category: { name: 'News', slug: 'news' },
    });

    expect(classification.priorityClass).toBe('C');
  });

  it('does not treat generic application wording in conferences as a case study', () => {
    const classification = classifyArticleForGeoRewrite({
      locale: 'en',
      slug: 'building-electrical-conference-flexible-busbar-applications',
      title: 'Yanghua Participates in Building Electrical Academic Conference',
      description: 'Conference recap mentioning flexible busbar applications.',
      body: 'The event discussed high-current flexible busbar applications and industry development.',
      publishedAt: '2024-11-01T00:00:00.000Z',
      updatedAt: '2024-11-01T00:00:00.000Z',
      translationKey: 'news-conference',
      category: { name: 'News', slug: 'news' },
    });

    expect(classification.priorityClass).toBe('C');
  });

  it('keeps industry solution articles in the A queue even when they contain no event language', () => {
    const classification = classifyArticleForGeoRewrite({
      locale: 'en',
      slug: 'flexible-busbar-industry-solutions-energy-storage',
      title: 'Flexible Busbar Industry Solutions [Energy Storage]',
      description: 'Selection guide for flexible busbars in energy storage systems.',
      body: 'Energy storage systems use flexible busbar routing between battery racks and power conversion equipment.',
      publishedAt: '2024-04-24T00:00:00.000Z',
      updatedAt: '2024-04-24T00:00:00.000Z',
      translationKey: 'news-energy-storage',
      category: { name: 'News', slug: 'news' },
    });

    expect(classification.priorityClass).toBe('A');
  });

  it('sorts rewrite bundle tasks by priority before locale/date', () => {
    const bundle = buildGeoRewriteBundle(
      [
        {
          locale: 'en',
          slug: 'dragon-boat-festival-greetings-757667',
          title: 'Dragon Boat Festival Greetings',
          description: 'YanghuaSTI sends holiday greetings.',
          body: 'YanghuaSTI wishes partners a peaceful Dragon Boat Festival.',
          publishedAt: '2025-05-31T00:00:00.000Z',
          updatedAt: '2025-05-31T00:00:00.000Z',
          translationKey: 'news-757667',
          category: { name: 'News', slug: 'news' },
        },
        technicalArticle,
      ],
      'https://www.yhflexiblebusbar.com'
    );

    expect(bundle.summary).toMatchObject({ total: 2, byPriority: { A: 1, B: 0, C: 1 } });
    expect(bundle.tasks[0].priorityClass).toBe('A');
    expect(bundle.tasks[1].priorityClass).toBe('C');
  });
});

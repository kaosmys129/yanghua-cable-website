export type GeoRewriteLocale = 'en' | 'es';
export type GeoRewritePriorityClass = 'A' | 'B' | 'C';
export type GeoRewriteMode = 'technical_geo_rewrite' | 'case_geo_rewrite' | 'light_authority_refresh';
export type GeoRewriteBuyerIntent = 'awareness' | 'comparison' | 'selection' | 'procurement';

export type GeoRewriteArticleInput = {
  locale: GeoRewriteLocale;
  slug: string;
  title: string;
  description: string;
  body: string;
  publishedAt: string;
  updatedAt: string;
  translationKey: string;
  sourceUrl?: string;
  category?: {
    name: string;
    slug: string;
  };
  relatedSlugs?: string[];
};

export type GeoRewriteClassification = {
  priorityClass: GeoRewritePriorityClass;
  rewriteMode: GeoRewriteMode;
  buyerIntent: GeoRewriteBuyerIntent;
  topicSlugs: string[];
  reasons: string[];
};

export type GeoRewriteTask = GeoRewriteClassification & {
  locale: GeoRewriteLocale;
  slug: string;
  title: string;
  description: string;
  translationKey: string;
  sourceUrl?: string;
  publicUrl: string;
  publishedAt: string;
  updatedAt: string;
  targetQueries: string[];
  relatedProductIds: string[];
  relatedSolutionIds: string[];
  sourceMarkdown: string;
  prompt: string;
};

export type GeoRewriteBundle = {
  generatedAt: string;
  siteUrl: string;
  summary: {
    total: number;
    byPriority: Record<GeoRewritePriorityClass, number>;
    byLocale: Record<GeoRewriteLocale, number>;
  };
  tasks: GeoRewriteTask[];
};

const topicMatchers: Array<{
  slug: string;
  productIds: string[];
  solutionIds: string[];
  queries: string[];
  patterns: RegExp[];
}> = [
  {
    slug: 'flexible-busbar-vs-cable',
    productIds: ['flexible-busbar'],
    solutionIds: ['high-current-power-distribution'],
    queries: ['flexible busbar vs cable', 'busbar replacement for parallel cables'],
    patterns: [/busbar\s+vs\s+cable/i, /cable.*parallel/i, /parallel.*cable/i, /cable replacement/i, /multi-?core cable/i],
  },
  {
    slug: 'high-current-power-distribution',
    productIds: ['flexible-busbar'],
    solutionIds: ['high-current-power-distribution'],
    queries: ['high current power distribution', 'high current flexible busbar'],
    patterns: [/high[-\s]?current/i, /1600a/i, /2000a/i, /power distribution/i, /current sharing/i],
  },
  {
    slug: 'energy-storage-busbar',
    productIds: ['flexible-busbar'],
    solutionIds: ['energy-storage'],
    queries: ['energy storage busbar', 'BESS flexible busbar'],
    patterns: [/energy storage/i, /\bBESS\b/i, /battery/i],
  },
  {
    slug: 'solar-pv-busbar',
    productIds: ['flexible-busbar'],
    solutionIds: ['solar-pv'],
    queries: ['solar PV busbar', 'factory rooftop solar busbar'],
    patterns: [/solar/i, /photovoltaic/i, /\bPV\b/i, /rooftop/i],
  },
  {
    slug: 'ev-charging-busbar',
    productIds: ['flexible-busbar'],
    solutionIds: ['ev-charging'],
    queries: ['EV charging busbar', 'charging pile flexible busbar'],
    patterns: [/EV charging/i, /charging pile/i, /charging station/i, /battery swapping/i],
  },
  {
    slug: 'custom-busbar-systems',
    productIds: ['custom-busbar-systems'],
    solutionIds: ['custom-busbar-systems'],
    queries: ['custom flexible busbar manufacturer', 'custom busbar system parameters'],
    patterns: [/custom/i, /manufacturer/i, /R&D/i, /experimental center/i],
  },
];

const eventPatterns = [
  /festival/i,
  /greetings/i,
  /happy new year/i,
  /qingming/i,
  /women'?s day/i,
  /may day/i,
  /dragon boat/i,
  /invitation/i,
  /conference/i,
  /exhibition/i,
  /expo/i,
  /forum/i,
  /salon/i,
  /annual review/i,
  /visits?/i,
  /inspection/i,
  /chamber/i,
  /resumes work/i,
  /reports? on/i,
  /debut/i,
  /promotion/i,
  /unveiled/i,
];

const casePatterns = [
  /project/i,
  /case/i,
  /implementation/i,
  /construction/i,
  /acceptance/i,
  /energized/i,
  /repair/i,
  /empowers/i,
  /assists/i,
  /application case/i,
];

const technicalRewritePatterns = [
  /\bvs\b/i,
  /compare|comparison/i,
  /selection|choose|how to/i,
  /solution|solutions/i,
  /manual download/i,
  /manufacturer|supplier|custom/i,
  /multi-?core/i,
  /parallel/i,
  /heating|overheat/i,
  /replacement|instead of/i,
  /chemical plant/i,
  /factory rooftop/i,
  /emergency repair/i,
  /charging pile construction/i,
  /solar project/i,
  /energy storage project/i,
];

const eventOverridePatterns = [
  /\bvs\b/i,
  /compare|comparison/i,
  /industry solutions?/i,
  /manufacturer|supplier|custom/i,
  /multi-?core/i,
  /parallel/i,
  /heating|overheat/i,
  /replacement|instead of/i,
  /chemical plant/i,
  /factory rooftop/i,
  /emergency repair/i,
  /charging pile construction/i,
  /solar project/i,
  /energy storage project/i,
];

export function classifyArticleForGeoRewrite(article: GeoRewriteArticleInput): GeoRewriteClassification {
  const text = searchableText(article);
  const titleText = [article.title, article.slug].join('\n');
  const topicSlugs = inferTopicSlugs(text);
  const reasons: string[] = [];
  const isEvent = eventPatterns.some((pattern) => pattern.test(text));
  const titleIsEvent = eventPatterns.some((pattern) => pattern.test(titleText));
  const isCase = casePatterns.some((pattern) => pattern.test(text));
  const hasTechnicalRewriteSignal = technicalRewritePatterns.some((pattern) => pattern.test(text));
  const hasEventOverrideSignal = eventOverridePatterns.some((pattern) => pattern.test(text));
  const titleHasEventOverrideSignal = eventOverridePatterns.some((pattern) => pattern.test(titleText));
  const hasCommercialTopic = topicSlugs.length > 0;

  if (hasCommercialTopic) {
    reasons.push(`matched GEO topics: ${topicSlugs.join(', ')}`);
  }
  if (isCase) {
    reasons.push('project/case language detected');
  }
  if (isEvent) {
    reasons.push('event/company-news language detected');
  }

  if (titleIsEvent && !titleHasEventOverrideSignal) {
    return {
      priorityClass: 'C',
      rewriteMode: 'light_authority_refresh',
      buyerIntent: 'awareness',
      topicSlugs,
      reasons,
    };
  }

  if (isEvent && !isCase && !hasEventOverrideSignal) {
    return {
      priorityClass: 'C',
      rewriteMode: 'light_authority_refresh',
      buyerIntent: 'awareness',
      topicSlugs,
      reasons,
    };
  }

  if (hasCommercialTopic && !isCase) {
    return {
      priorityClass: 'A',
      rewriteMode: 'technical_geo_rewrite',
      buyerIntent: inferBuyerIntent(text, topicSlugs),
      topicSlugs,
      reasons,
    };
  }

  if (hasCommercialTopic && isCase) {
    return {
      priorityClass: 'B',
      rewriteMode: 'case_geo_rewrite',
      buyerIntent: inferBuyerIntent(text, topicSlugs),
      topicSlugs,
      reasons,
    };
  }

  return {
    priorityClass: 'C',
    rewriteMode: 'light_authority_refresh',
    buyerIntent: 'awareness',
    topicSlugs,
    reasons: reasons.length ? reasons : ['no high-intent GEO topic detected'],
  };
}

export function buildGeoRewriteTask(article: GeoRewriteArticleInput, siteUrl: string): GeoRewriteTask {
  const classification = classifyArticleForGeoRewrite(article);
  const targetQueries = buildTargetQueries(article, classification);
  const relatedProductIds = unique(topicDetails(classification.topicSlugs).flatMap((topic) => topic.productIds));
  const relatedSolutionIds = unique(topicDetails(classification.topicSlugs).flatMap((topic) => topic.solutionIds));

  return {
    ...classification,
    locale: article.locale,
    slug: article.slug,
    title: article.title,
    description: article.description,
    translationKey: article.translationKey,
    sourceUrl: article.sourceUrl,
    publicUrl: buildPublicUrl(siteUrl, article.locale, article.slug),
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    targetQueries,
    relatedProductIds,
    relatedSolutionIds,
    sourceMarkdown: buildSourceMarkdown(article),
    prompt: buildRewritePrompt(article, classification, targetQueries, relatedProductIds, relatedSolutionIds),
  };
}

export function buildGeoRewriteBundle(
  articles: GeoRewriteArticleInput[],
  siteUrl: string,
  now = new Date()
): GeoRewriteBundle {
  const tasks = articles
    .map((article) => buildGeoRewriteTask(article, siteUrl))
    .sort((left, right) => sortTask(left, right));

  return {
    generatedAt: now.toISOString(),
    siteUrl: normalizeSiteUrl(siteUrl),
    summary: {
      total: tasks.length,
      byPriority: {
        A: tasks.filter((task) => task.priorityClass === 'A').length,
        B: tasks.filter((task) => task.priorityClass === 'B').length,
        C: tasks.filter((task) => task.priorityClass === 'C').length,
      },
      byLocale: {
        en: tasks.filter((task) => task.locale === 'en').length,
        es: tasks.filter((task) => task.locale === 'es').length,
      },
    },
    tasks,
  };
}

function buildRewritePrompt(
  article: GeoRewriteArticleInput,
  classification: GeoRewriteClassification,
  targetQueries: string[],
  relatedProductIds: string[],
  relatedSolutionIds: string[]
) {
  return [
    `Rewrite this Yanghua Cable article for GEO marketing as a ${classification.rewriteMode}.`,
    `preserve the exact slug: ${article.slug}.`,
    `preserve the locale: ${article.locale}.`,
    `Buyer intent: ${classification.buyerIntent}.`,
    `Target queries: ${targetQueries.join('; ') || 'derive from source material'}.`,
    'Use only the provided Yanghua source material and verifiable facts. Do not invent certifications, test reports, prices, or performance claims.',
    'Start with a 40-80 word direct answer that can stand alone in AI search results.',
    'Include a parameter or comparison table when the source material supports it.',
    'Include suitable/not suitable scenarios, engineering notes, FAQs, citations/source material, and internal link suggestions.',
    `Use relatedProductIds: ${relatedProductIds.join(', ') || 'none'}.`,
    `Use relatedSolutionIds: ${relatedSolutionIds.join(', ') || 'none'}.`,
    'End the Markdown with a hidden <!-- yanghua-geo-json ... --> block containing geo and seo metadata.',
    `The hidden block must include top-level "locale": "${article.locale}" and "slug": "${article.slug}" so Yanghua can preserve the public URL.`,
    'The hidden block must include geo.targetQueries, geo.answerSummary, geo.faqs, geo.citations, geo.sourceMaterials, geo.buyerIntent, geo.relatedProductIds, geo.relatedSolutionIds, seo.title, seo.description, and seo.keywords.',
  ].join('\n');
}

function buildTargetQueries(article: GeoRewriteArticleInput, classification: GeoRewriteClassification) {
  const topicQueries = topicDetails(classification.topicSlugs).flatMap((topic) => topic.queries);
  const titleQueries = titleToQueries(article.title);

  return unique([...topicQueries, ...titleQueries]).slice(0, 8);
}

function titleToQueries(title: string) {
  const normalized = title
    .replace(/yanghua insights:?/i, '')
    .replace(/\bvs\b/gi, 'vs')
    .replace(/[?()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return [];
  }

  const queries = [normalized.toLowerCase()];
  if (/busbar/i.test(normalized) && /cable/i.test(normalized)) {
    queries.push('flexible busbar vs cable');
  }

  return queries;
}

function inferBuyerIntent(text: string, topicSlugs: string[]): GeoRewriteBuyerIntent {
  if (/vs|compare|comparison|instead of|replacement/i.test(text) || topicSlugs.includes('flexible-busbar-vs-cable')) {
    return 'comparison';
  }
  if (/quote|procurement|manufacturer|supplier|lead time|custom/i.test(text)) {
    return 'procurement';
  }

  return 'selection';
}

function inferTopicSlugs(text: string) {
  return topicMatchers
    .filter((topic) => topic.patterns.some((pattern) => pattern.test(text)))
    .map((topic) => topic.slug);
}

function topicDetails(slugs: string[]) {
  return topicMatchers.filter((topic) => slugs.includes(topic.slug));
}

function buildSourceMarkdown(article: GeoRewriteArticleInput) {
  return [
    `# ${article.title}`,
    '',
    `- Locale: ${article.locale}`,
    `- Original slug: ${article.slug}`,
    `- Translation key: ${article.translationKey}`,
    `- Source URL: ${article.sourceUrl || 'not provided'}`,
    `- Published: ${article.publishedAt}`,
    `- Updated: ${article.updatedAt}`,
    `- Category: ${article.category?.name || 'Uncategorized'}`,
    '',
    '## Existing Description',
    article.description,
    '',
    '## Existing Body',
    article.body,
  ].join('\n');
}

function buildPublicUrl(siteUrl: string, locale: GeoRewriteLocale, slug: string) {
  const base = normalizeSiteUrl(siteUrl);
  const path = locale === 'es' ? `/es/articulos/${slug}` : `/en/articles/${slug}`;

  return `${base}${path}`;
}

function searchableText(article: GeoRewriteArticleInput) {
  return [article.title, article.description, article.slug, article.body, article.category?.name, article.category?.slug]
    .filter(Boolean)
    .join('\n');
}

function sortTask(left: GeoRewriteTask, right: GeoRewriteTask) {
  const priorityOrder: Record<GeoRewritePriorityClass, number> = { A: 0, B: 1, C: 2 };
  const priorityDelta = priorityOrder[left.priorityClass] - priorityOrder[right.priorityClass];
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const localeDelta = left.locale.localeCompare(right.locale);
  if (localeDelta !== 0) {
    return localeDelta;
  }

  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/+$/, '');
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

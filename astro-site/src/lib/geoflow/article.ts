import matter from 'gray-matter';
import { z } from 'zod';
import { assertSpanishArticleBody } from '../yanghua/spanish-article-policy.mjs';

const localeSchema = z.enum(['en', 'es']);
const buyerIntentSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const cleaned = val.trim().toLowerCase();
    const validIntents = ['awareness', 'comparison', 'selection', 'procurement'] as const;
    for (const intent of validIntents) {
      if (cleaned.includes(intent)) {
        return intent;
      }
    }
  }
  return val;
}, z.enum(['awareness', 'comparison', 'selection', 'procurement']));
const reviewStatusSchema = z.enum(['approved', 'needs_review', 'needs_geo_metadata']);

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const citationSchema = z.object({
  label: z.string().min(1),
  url: z.string().url().optional(),
  note: z.string().optional(),
});

const payloadSchema = z.object({
  geoflowArticleId: z.string().min(1),
  locale: localeSchema,
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  bodyMarkdown: z.string().min(1),
  publishedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  category: z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
  }),
  author: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
  }),
  targetQueries: z.array(z.string()).default([]),
  answerSummary: z.string().default(''),
  faqs: z.array(faqSchema).default([]),
  citations: z.array(citationSchema).default([]),
  sourceMaterials: z.array(z.string()).default([]),
  buyerIntent: buyerIntentSchema.default('awareness'),
  relatedProductIds: z.array(z.string()).default([]),
  relatedSolutionIds: z.array(z.string()).default([]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  cover: z
    .object({
      src: z.string().min(1),
      alt: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
  canonicalHint: z.string().optional(),
  reviewStatus: reviewStatusSchema.default('approved'),
  authorBio: z.string().optional(),
  certifications: z.array(z.string()).default([]),
  relatedCaseStudies: z.array(z.string()).default([]),
  imagePrompts: z
    .object({
      cover: z
        .object({
          prompt: z.string().min(1),
          alt: z.string().optional(),
        })
        .optional(),
      body: z
        .array(
          z.object({
            prompt: z.string().min(1),
            alt: z.string().optional(),
            section: z.string().min(1),
            position: z.enum(['before', 'after']).default('before'),
          })
        )
        .optional(),
    })
    .optional(),
});

const emptyGeoMetadata = {
  targetQueries: [],
  answerSummary: '',
  faqs: [],
  citations: [],
  sourceMaterials: [],
  buyerIntent: 'awareness' as const,
  relatedProductIds: [],
  relatedSolutionIds: [],
};

const geoMetadataSchema = z.object({
  locale: localeSchema.optional(),
  slug: z.string().optional(),
  geo: z
    .object({
      targetQueries: z.array(z.string()).default([]),
      answerSummary: z.string().default(''),
      faqs: z.array(faqSchema).default([]),
      citations: z.array(citationSchema).default([]),
      sourceMaterials: z.array(z.string()).default([]),
      buyerIntent: buyerIntentSchema.default('awareness'),
      relatedProductIds: z.array(z.string()).default([]),
      relatedSolutionIds: z.array(z.string()).default([]),
    })
    .default(emptyGeoMetadata),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.array(z.string()).default([]),
      canonicalHint: z.string().optional(),
    })
    .default({ keywords: [] }),
  imagePrompts: z
    .object({
      cover: z
        .object({
          prompt: z.string(),
          alt: z.string().optional(),
        })
        .optional(),
      body: z
        .array(
          z.object({
            prompt: z.string(),
            alt: z.string().optional(),
            section: z.string(),
            position: z.enum(['before', 'after']).default('before'),
          })
        )
        .optional(),
    })
    .optional(),
});

const nativeArticleSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().nullish(),
  content: z.string().min(1),
  hero_image_url: z.string().nullish(),
  keywords: z.union([z.string(), z.array(z.string())]).nullish(),
  meta_description: z.string().nullish(),
  published_at: z.string().nullish(),
  updated_at: z.string().nullish(),
  category: z
    .object({
      name: z.string().nullish(),
      slug: z.string().nullish(),
    })
    .nullish(),
  author: z
    .object({
      name: z.string().nullish(),
      email: z.string().email().optional(),
    })
    .nullish(),
});

const nativePayloadSchema = z.object({
  article: nativeArticleSchema,
  locale: localeSchema.optional(),
});

export type GeoflowArticlePayload = z.input<typeof payloadSchema> | unknown;
export type NormalizedGeoflowArticle = ReturnType<typeof normalizeGeoflowArticlePayload>;
export type GeoBuyerIntent = z.infer<typeof buyerIntentSchema>;

export interface AIIImagePrompt {
  prompt: string;
  alt?: string;
  section: string;
  position: 'before' | 'after';
}

export interface AIImagePrompts {
  cover?: { prompt: string; alt?: string };
  body?: AIIImagePrompt[];
}

export function normalizeGeoflowArticlePayload(payload: GeoflowArticlePayload) {
  const parsed = payloadSchema.parse(toFlatPayload(payload));
  assertSpanishArticleBody(parsed.locale, parsed.bodyMarkdown);
  const slug = sanitizeSlug(parsed.slug);
  const sourceId = stableSourceId(parsed.geoflowArticleId);

  // ── Post-processing: safety nets for AI-generated content gaps ──
  const cover = inferCoverImage(parsed.relatedSolutionIds, parsed.cover);
  let bodyMarkdown = injectBodyImages(
    appendAuthorEEATBlock(sanitizeMdxTables(parsed.bodyMarkdown.trim()), parsed.author),
    parsed.relatedSolutionIds
  );
  // 转义非 HTML 标签的独立小于号，以防止 MDX 编译语法错误 (MDXError)
  bodyMarkdown = bodyMarkdown.replace(/<(?![a-zA-Z!/])/g, '&lt;');
  const authorBio = parsed.authorBio || DEFAULT_AUTHOR_BIO;

  // ── AI Image Prompts (from GEOFlow AI) ──
  const aiImagePrompts = parsed.imagePrompts as AIImagePrompts | undefined;
  const hasAiImagePrompts = !!(aiImagePrompts?.cover || aiImagePrompts?.body?.length);
  const aiImagesTrack = {
    coverGenerated: false,
    bodyGenerated: false,
  };

  return {
    sourceId,
    translationKey: `geoflow-${parsed.geoflowArticleId}`,
    locale: parsed.locale,
    slug,
    title: parsed.title.trim(),
    description: parsed.description.trim(),
    createdAt: parsed.publishedAt,
    updatedAt: parsed.updatedAt,
    publishedAt: parsed.publishedAt,
    sourceUrl: parsed.canonicalHint,
    bodySource: 'content' as const,
    cover,
    category: {
      name: parsed.category.name.trim(),
      slug: sanitizeSlug(parsed.category.slug),
    },
    author: {
      name: parsed.author.name.trim(),
      email: parsed.author.email || 'info@yhflexiblebusbar.com',
    },
    geoflow: {
      articleId: parsed.geoflowArticleId,
      importedAt: new Date().toISOString(),
      reviewStatus: parsed.reviewStatus,
    },
    geo: {
      targetQueries: parsed.targetQueries.map((query) => query.trim()).filter(Boolean),
      answerSummary: parsed.answerSummary.trim(),
      faqs: parsed.faqs,
      citations: parsed.citations,
      sourceMaterials: parsed.sourceMaterials.map((source) => source.trim()).filter(Boolean),
      buyerIntent: parsed.buyerIntent,
      relatedProductIds: parsed.relatedProductIds,
      relatedSolutionIds: parsed.relatedSolutionIds,
    },
    seo: {
      title: parsed.seoTitle,
      description: parsed.seoDescription,
      keywords: parsed.keywords,
      canonicalHint: parsed.canonicalHint,
    },
    authorBio,
    certifications: parsed.certifications,
    relatedCaseStudies: parsed.relatedCaseStudies,
    aiImagePrompts,
    aiImages: aiImagesTrack,
    bodyMarkdown,
  };
}

export function buildIncomingArticleMdx(article: NormalizedGeoflowArticle) {
  const frontmatter = {
    sourceId: article.sourceId,
    translationKey: article.translationKey,
    locale: article.locale,
    slug: article.slug,
    title: article.title,
    description: article.description,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    publishedAt: article.publishedAt,
    sourceUrl: article.sourceUrl,
    bodySource: article.bodySource,
    cover: article.cover,
    category: article.category,
    author: article.author,
    geoflow: article.geoflow,
    geo: article.geo,
    seo: article.seo,
    authorBio: article.authorBio,
    certifications: article.certifications,
    relatedCaseStudies: article.relatedCaseStudies,
    aiImagePrompts: article.aiImagePrompts,
    aiImages: article.aiImages,
  };

  return matter.stringify(`${article.bodyMarkdown}\n`, stripUndefined(frontmatter));
}

export function getArticleRelativeUrl(locale: 'en' | 'es', slug: string) {
  return locale === 'es' ? `/es/articulos/${slug}` : `/en/articles/${slug}`;
}

function sanitizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function toFlatPayload(payload: unknown): z.input<typeof payloadSchema> {
  if (isRecord(payload) && isRecord(payload.article)) {
    return nativePayloadToFlatPayload(payload);
  }

  if (!isRecord(payload)) {
    return payload as z.input<typeof payloadSchema>;
  }

  const bodyMarkdown = typeof payload.bodyMarkdown === 'string' ? payload.bodyMarkdown : '';
  const extracted = extractYanghuaGeoMetadata(bodyMarkdown);
  const metadata = extracted.metadata;

  return {
    ...payload,
    locale: payload.locale ?? metadata?.locale,
    slug: payload.slug ?? metadata?.slug,
    bodyMarkdown: extracted.bodyMarkdown || bodyMarkdown,
    targetQueries: payload.targetQueries ?? metadata?.geo.targetQueries,
    answerSummary: payload.answerSummary ?? metadata?.geo.answerSummary,
    faqs: payload.faqs ?? metadata?.geo.faqs,
    citations: payload.citations ?? metadata?.geo.citations,
    sourceMaterials: payload.sourceMaterials ?? metadata?.geo.sourceMaterials,
    buyerIntent: payload.buyerIntent ?? metadata?.geo.buyerIntent,
    relatedProductIds: payload.relatedProductIds ?? metadata?.geo.relatedProductIds,
    relatedSolutionIds: payload.relatedSolutionIds ?? metadata?.geo.relatedSolutionIds,
    seoTitle: payload.seoTitle ?? metadata?.seo.title,
    seoDescription: payload.seoDescription ?? metadata?.seo.description,
    keywords: payload.keywords ?? metadata?.seo.keywords,
    canonicalHint: payload.canonicalHint ?? metadata?.seo.canonicalHint,
    imagePrompts: payload.imagePrompts ?? metadata?.imagePrompts,
    reviewStatus: payload.reviewStatus ?? 'needs_review',
  } as z.input<typeof payloadSchema>;
}

function nativePayloadToFlatPayload(payload: Record<string, unknown>): z.input<typeof payloadSchema> {
  const native = nativePayloadSchema.parse(payload);
  const article = native.article;
  const extracted = extractYanghuaGeoMetadata(article.content);
  const metadata = extracted.metadata;
  const keywordList = splitKeywords(article.keywords);
  const now = new Date().toISOString();
  const description =
    metadata?.seo.description ||
    cleanText(article.meta_description) ||
    cleanText(article.excerpt) ||
    article.title;
  const categoryName = cleanText(article.category?.name) || 'Technical Guides';
  const categorySlug = cleanText(article.category?.slug) || categoryName;
  const authorName = cleanText(article.author?.name) || 'Yanghua Engineering Team';
  const hasMetadata = Boolean(metadata);

  return {
    geoflowArticleId: String(article.id),
    locale: metadata?.locale || native.locale || 'en',
    slug: metadata?.slug || article.slug,
    title: article.title,
    description,
    bodyMarkdown: extracted.bodyMarkdown,
    publishedAt: article.published_at || article.updated_at || now,
    updatedAt: article.updated_at || article.published_at || now,
    category: {
      name: categoryName,
      slug: categorySlug,
    },
    author: {
      name: authorName,
      email: article.author?.email,
    },
    targetQueries: metadata?.geo.targetQueries ?? keywordList,
    answerSummary: metadata?.geo.answerSummary ?? description,
    faqs: metadata?.geo.faqs ?? [],
    citations: metadata?.geo.citations ?? [],
    sourceMaterials: metadata?.geo.sourceMaterials ?? [],
    buyerIntent: metadata?.geo.buyerIntent ?? 'awareness',
    relatedProductIds: metadata?.geo.relatedProductIds ?? [],
    relatedSolutionIds: metadata?.geo.relatedSolutionIds ?? [],
    seoTitle: metadata?.seo.title || article.title,
    seoDescription: metadata?.seo.description || description,
    keywords: metadata?.seo.keywords?.length ? metadata.seo.keywords : keywordList,
    cover: cleanText(article.hero_image_url)
      ? {
          src: cleanText(article.hero_image_url),
          alt: article.title,
        }
      : undefined,
    canonicalHint: metadata?.seo.canonicalHint,
    reviewStatus: 'approved', // GEOFlow 已审核通过才触发分发 → 直接 approved
  };
}

function extractYanghuaGeoMetadata(markdown: string) {
  // Match both literal <!-- yanghua-geo-json ... --> and escaped &lt;!-- ... --&gt;
  const marker = /(?:<!--|&lt;!--)\s*yanghua-geo-json\s*([\s\S]*?)(?:-->|--&gt;)/i;
  const match = markdown.match(marker);
  if (!match) {
    return {
      bodyMarkdown: markdown.trim(),
      metadata: null,
    };
  }

  const bodyMarkdown = markdown.replace(match[0], '').trim();
  const parsed = JSON.parse(match[1]);
  return {
    bodyMarkdown,
    metadata: geoMetadataSchema.parse(parsed),
  };
}

function splitKeywords(value: string | string[] | null | undefined) {
  const values = Array.isArray(value) ? value : String(value || '').split(/[,;|\n]/);

  return values.map((entry) => entry.trim()).filter(Boolean);
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

// ────────────────────────────────────────────────────────────────────────────
// Post-processing: safety nets for AI-generated content gaps
// ────────────────────────────────────────────────────────────────────────────

const PRODUCT_IMAGES: Record<string, { src: string; alt: string; width: number; height: number }> = {
  default: {
    src: '/images/products/flexible-busbar-1.jpg',
    alt: 'Yanghua flexible busbar product',
    width: 1200,
    height: 630,
  },
  'energy-storage': {
    src: '/images/products/flexible-busbar-2.jpg',
    alt: 'Flexible busbar for energy storage system installation',
    width: 1200,
    height: 630,
  },
  'solar-pv': {
    src: '/images/products/flexible-busbar-3.jpg',
    alt: 'Flexible busbar for solar photovoltaic application',
    width: 1200,
    height: 630,
  },
  'ev-charging': {
    src: '/images/products/flexible-busbar-3.jpg',
    alt: 'Flexible busbar for EV charging station',
    width: 1200,
    height: 630,
  },
  'high-current-power-distribution': {
    src: '/images/products/flexible-busbar-2.jpg',
    alt: 'Flexible busbar for high-current power distribution',
    width: 1200,
    height: 630,
  },
} as const;

const DEFAULT_AUTHOR_BIO =
  'Yanghua Engineering Team — 15+ years of flexible busbar design, manufacturing, and project delivery for energy storage, solar PV, EV charging, and industrial electrification.';

function inferCoverImage(
  relatedSolutionIds: string[],
  existingCover?: { src: string; alt?: string; width?: number; height?: number }
) {
  if (existingCover) return existingCover;
  for (const solutionId of relatedSolutionIds) {
    if (solutionId in PRODUCT_IMAGES) {
      return PRODUCT_IMAGES[solutionId];
    }
  }
  return PRODUCT_IMAGES.default;
}

function injectBodyImages(markdown: string, relatedSolutionIds: string[]): string {
  // Skip static image injection if the article already has any Markdown images
  if (/!\[/.test(markdown)) return markdown;

  const image = PRODUCT_IMAGES.default;
  for (const solutionId of relatedSolutionIds) {
    if (solutionId in PRODUCT_IMAGES && solutionId !== 'default') {
      break; // use the fallback image walk below
    }
  }

  const lines = markdown.split('\n');
  const insertionPoints: number[] = [];

  // Find first H2 heading — insert image after it (not inside tables)
  for (let i = 0; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      // Only insert if the NEXT non-empty line is NOT a table row
      let nextLine = i + 1;
      while (nextLine < lines.length && lines[nextLine].trim() === '') {
        nextLine++;
      }
      if (nextLine < lines.length && !/^\|/.test(lines[nextLine])) {
        insertionPoints.push(i + 1); // insert after the heading
      }
      break;
    }
  }

  const imageMd = `\n![${image.alt}](${image.src})\n`;
  // Insert in reverse order to preserve indices
  for (const point of insertionPoints.reverse()) {
    lines.splice(point, 0, imageMd);
  }

  return lines.join('\n');
}

function sanitizeMdxTables(markdown: string): string {
  const lines = markdown.split('\n');
  const sanitized = lines.map((line) => {
    // Only process lines that are table rows (start and end with |)
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return line;

    let cell = trimmed;
    // Replace raw < that is NOT already an HTML entity and NOT part of HTML tags
    cell = cell.replace(/(?<![&a-zA-Z])<(?!(?:\/?)(?:a|abbr|b|br|code|dd|div|dl|dt|em|h[1-6]|hr|i|img|li|ol|p|pre|s|span|strong|sub|sup|table|tbody|td|th|thead|tr|u|ul)\b)/g, '&lt;');
    // Replace raw > not part of entity
    cell = cell.replace(/(?<![&a-zA-Z-])>(?!\w+;)/g, '&gt;');
    // Escape raw { and } that aren't part of expressions
    cell = cell.replace(/(?<!\\)\{(?!\s*[#/@])/g, '\\{');
    cell = cell.replace(/(?<!\\)\}(?!\s*[#/@])/g, '\\}');

    return cell;
  });

  return sanitized.join('\n');
}

function appendAuthorEEATBlock(
  markdown: string,
  author: { name: string; email?: string }
): string {
  // Only inject for the default GEO Editor author
  if (author.name !== 'Yanghua GEO Editor') return markdown;

  const eeatBlock = [
    '',
    '---',
    '',
    '> **About the Author**',
    `> ${DEFAULT_AUTHOR_BIO}`,
    '>',
    '> The team holds a VDE flexible industrial cable training certificate (2024) and operates an in-house R&D Experimental Center. Yanghua flexible busbar products have passed type testing with official test reports.',
    '>',
    '> *Contact: info@yhflexiblebusbar.com | Hotline: 400-883-1383*',
    '',
  ].join('\n');

  return markdown + eeatBlock;
}

function stableSourceId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return 900000 + (hash % 99999);
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, stripUndefined(entryValue)])
    ) as T;
  }

  return value;
}

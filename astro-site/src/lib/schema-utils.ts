/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SCHEMA.ORG UTILITY — Centralized JSON-LD generation for Astro
 * ─────────────────────────────────────────────────────────────────────────────
 * Adapted from the Next.js structured-data module for Astro's build system.
 *
 * All functions return plain objects suitable for JSON.stringify() and
 * injection into <script type="application/ld+json"> tags.
 *
 * GEO Phase 1 enhancement: comprehensive Organization, CollectionPage,
 * BreadcrumbList, and TechArticle schemas for AI discoverability.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { brand } from '../config/brand';
import { getPublicCompanyProfile } from './yanghua/company-facts.mjs';

function normalizeBaseUrl(siteUrl?: string): string {
  return String(siteUrl || brand.url).replace(/\/+$/, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface CollectionPageArticle {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedAt?: string;
  modifiedAt?: string;
  geoQueries?: string[];
  itemType?: string;
}

export interface ArticlePost {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  category?: string;
  tags?: string[];
  wordCount?: number;
  readingTime?: number;
  authorName?: string;
  authorKind?: 'person' | 'organization';
  authorBio?: string;
  authorApproved?: boolean;
  schemaType?: 'Article' | 'TechArticle';
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Organization Schema
// ─────────────────────────────────────────────────────────────────────────────

export function generateFullOrganizationSchema(siteUrl?: string): Record<string, unknown> {
  const baseUrl = normalizeBaseUrl(siteUrl);
  const company = getPublicCompanyProfile(baseUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: company.name,
    ...(company.alternateNames.length > 0 && { alternateName: company.alternateNames }),
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: company.logoUrl,
      width: 128,
      height: 128,
    },
    description: company.description,
    ...(company.foundingDate && { foundingDate: company.foundingDate }),
    ...(company.numberOfEmployees && { numberOfEmployees: company.numberOfEmployees }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.address.streetAddress,
      addressLocality: company.address.addressLocality,
      addressRegion: company.address.addressRegion,
      addressCountry: company.address.addressCountry,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: company.phone,
        contactType: 'customer service',
        email: company.email,
        availableLanguage: ['English', 'Spanish', 'Chinese'],
        areaServed: 'Worldwide',
      },
      {
        '@type': 'ContactPoint',
        telephone: company.phone,
        contactType: 'technical support',
        email: company.email,
        availableLanguage: ['English', 'Chinese'],
        areaServed: 'Worldwide',
      },
    ],
    ...(company.sameAs.length > 0 && { sameAs: company.sameAs }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CollectionPage Schema (Article listing pages)
// ─────────────────────────────────────────────────────────────────────────────

export function generateCollectionPageSchema(
  articles: CollectionPageArticle[],
  siteUrl?: string,
  locale: string = 'en',
  options: {
    path?: string;
    id?: string;
    name?: string;
    description?: string;
  } = {},
): Record<string, unknown> {
  const baseUrl = normalizeBaseUrl(siteUrl);
  const listPath = options.path ?? (locale === 'es' ? '/es/articulos' : locale === 'pt' ? '/pt/artigos' : '/en/articles');

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': options.id ?? `${baseUrl}${listPath}#collection`,
    name: options.name ?? (locale === 'es' ? 'Articulos tecnicos' : locale === 'pt' ? 'Artigos tecnicos' : 'Technical Articles'),
    description: options.description ?? (
      locale === 'es'
        ? 'Articulos tecnicos, guias GEO, preguntas frecuentes y perspectivas de aplicacion para proyectos de barras flexibles, almacenamiento de energia, energia solar fotovoltaica, carga de VE y distribucion de energia de alta corriente.'
        : locale === 'pt'
          ? 'Artigos tecnicos, guias GEO, perguntas frequentes e perspectivas de aplicacao para barramento flexivel, armazenamento de energia, energia solar fotovoltaica, carregamento de VE e distribuicao de alta corrente.'
          : 'Technical articles, GEO-ready guides, FAQs, and application insights for flexible busbar, energy storage, solar PV, EV charging, and high-current power distribution projects.'
    ),
    url: `${baseUrl}${listPath}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: articles.length,
      itemListElement: articles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': article.itemType ?? 'TechArticle',
          '@id': `${baseUrl}${article.url}#article`,
          name: article.title,
          headline: article.title,
          description: article.description,
          ...(article.image && {
            image: article.image.startsWith('http')
              ? article.image
              : `${baseUrl}${article.image}`,
          }),
          url: `${baseUrl}${article.url}`,
          ...(article.publishedAt && { datePublished: article.publishedAt }),
          ...(article.modifiedAt && { dateModified: article.modifiedAt }),
          ...(article.geoQueries &&
            article.geoQueries.length > 0 && {
              about: article.geoQueries.map((q) => ({
                '@type': 'Thing',
                name: q,
              })),
            }),
          inLanguage: locale === 'es' ? 'es' : locale === 'pt' ? 'pt' : 'en',
          publisher: {
            '@type': 'Organization',
            '@id': `${baseUrl}/#organization`,
            name: getPublicCompanyProfile(baseUrl).name,
          },
          author: {
            '@type': 'Organization',
            '@id': `${baseUrl}/#organization`,
            name: getPublicCompanyProfile(baseUrl).name,
          },
        },
      })),
    },
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BreadcrumbList Schema
// ─────────────────────────────────────────────────────────────────────────────

export function generateBreadcrumbSchema(
  items: BreadcrumbItem[],
  siteUrl?: string,
): Record<string, unknown> {
  const baseUrl = normalizeBaseUrl(siteUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

function buildAuthorSchema(post: ArticlePost, baseUrl: string): Record<string, unknown> {
  if (post.authorApproved && post.authorKind === 'person' && post.authorName) {
    return {
      '@type': 'Person',
      name: post.authorName,
      ...(post.authorBio && { description: post.authorBio }),
    };
  }

  return {
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: getPublicCompanyProfile(baseUrl).name,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TechArticle / BlogPosting Schema (individual article pages)
// ─────────────────────────────────────────────────────────────────────────────

export function generateArticleSchema(
  post: ArticlePost,
  siteUrl?: string,
): Record<string, unknown> {
  const baseUrl = normalizeBaseUrl(siteUrl);
  const company = getPublicCompanyProfile(baseUrl);

  return {
    '@context': 'https://schema.org',
    '@type': post.schemaType ?? 'TechArticle',
    '@id': `${baseUrl}${post.url}#article`,
    headline: post.title,
    description: post.description,
    ...(post.image && {
      image: post.image.startsWith('http')
        ? post.image
        : `${baseUrl}${post.image}`,
    }),
    datePublished: post.publishedAt || new Date().toISOString(),
    dateModified: post.modifiedAt || post.publishedAt || new Date().toISOString(),
    author: buildAuthorSchema(post, baseUrl),
    publisher: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: company.name,
      logo: {
        '@type': 'ImageObject',
        url: company.logoUrl,
      },
    },
    ...(post.category && { articleSection: post.category }),
    ...(post.tags && post.tags.length > 0 && { keywords: post.tags.join(', ') }),
    ...(post.wordCount && { wordCount: post.wordCount }),
    ...(post.readingTime && { timeRequired: `PT${post.readingTime}M` }),
    url: `${baseUrl}${post.url}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}${post.url}`,
    },
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Website Schema (with SearchAction)
// ─────────────────────────────────────────────────────────────────────────────

export function generateWebsiteSchema(siteUrl?: string): Record<string, unknown> {
  const baseUrl = normalizeBaseUrl(siteUrl);
  const company = getPublicCompanyProfile(baseUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: company.name,
    ...(company.alternateNames[0] && { alternateName: company.alternateNames[0] }),
    url: baseUrl,
    description: company.description,
    publisher: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/en/articles?query={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. FAQPage Schema
// ─────────────────────────────────────────────────────────────────────────────

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6b. Product Schema (individual product detail pages)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductSchemaInput {
  id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  image?: string[];
  technicalSpecs?: Record<string, string>;
  url?: string;
  locale?: string;
}

export function generateProductSchema(
  product: ProductSchemaInput,
  siteUrl?: string,
): Record<string, unknown> {
  const baseUrl = normalizeBaseUrl(siteUrl);
  const company = getPublicCompanyProfile(baseUrl);

  const images = (product.image ?? []).map((img) =>
    img.startsWith('http') ? img : `${baseUrl}${img}`,
  );

  const additionalProperty = product.technicalSpecs
    ? Object.entries(product.technicalSpecs).map(([name, value]) => ({
        '@type': 'PropertyValue',
        name,
        value,
      }))
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${product.url ?? baseUrl}#product`,
    name: product.name,
    description: product.detailedDescription || product.description,
    ...(images.length > 0 && { image: images }),
    brand: {
      '@type': 'Brand',
      name: company.name,
    },
    ...(additionalProperty && { additionalProperty }),
    ...(product.url && { url: product.url }),
    ...(product.locale && { inLanguage: product.locale }),
  };
}

export interface EntityPageSchemaInput {
  id: string;
  name: string;
  description: string;
  url: string;
  locale: string;
  image?: string;
  location?: string;
  serviceType?: string;
}

export function generateWebPageSchema(
  page: EntityPageSchemaInput,
  entityId: string,
  siteUrl?: string,
): Record<string, unknown> {
  const baseUrl = normalizeBaseUrl(siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${page.url}#webpage`,
    url: page.url,
    name: page.name,
    description: page.description,
    inLanguage: page.locale,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
    },
    mainEntity: {
      '@id': entityId,
    },
  };
}

export function generateProjectSchema(
  project: EntityPageSchemaInput,
  siteUrl?: string,
): Record<string, unknown> {
  const baseUrl = normalizeBaseUrl(siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'Project',
    '@id': `${project.url}#project`,
    identifier: project.id,
    name: project.name,
    description: project.description,
    url: project.url,
    inLanguage: project.locale,
    ...(project.image && {
      image: project.image.startsWith('http') ? project.image : `${baseUrl}${project.image}`,
    }),
    ...(project.location && {
      location: {
        '@type': 'Place',
        name: project.location,
      },
    }),
    parentOrganization: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
    },
    mainEntityOfPage: {
      '@id': `${project.url}#webpage`,
    },
  };
}

export function generateServiceSchema(
  service: EntityPageSchemaInput,
  siteUrl?: string,
): Record<string, unknown> {
  const baseUrl = normalizeBaseUrl(siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${service.url}#service`,
    name: service.name,
    description: service.description,
    serviceType: service.serviceType || service.name,
    url: service.url,
    inLanguage: service.locale,
    ...(service.image && {
      image: service.image.startsWith('http') ? service.image : `${baseUrl}${service.image}`,
    }),
    areaServed: 'Worldwide',
    provider: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
    },
    mainEntityOfPage: {
      '@id': `${service.url}#webpage`,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Validation helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lightweight schema validation — returns errors array.
 * Used for dev-time warnings only; does not block builds.
 */
export function validateStructuredData(schema: Record<string, unknown>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!schema['@context']) errors.push('Missing @context property');
  if (!schema['@type']) errors.push('Missing @type property');

  if (schema.url && typeof schema.url === 'string' && !schema.url.startsWith('http')) {
    errors.push('Invalid URL format');
  }

  if (schema.image) {
    if (typeof schema.image === 'string' && !schema.image.startsWith('http')) {
      errors.push('Invalid image URL format');
    } else if (
      typeof schema.image === 'object' &&
      schema.image !== null &&
      'url' in schema.image &&
      typeof (schema.image as Record<string, unknown>).url === 'string' &&
      !String((schema.image as Record<string, unknown>).url).startsWith('http')
    ) {
      errors.push('Invalid image URL format in ImageObject');
    }
  }

  return { isValid: errors.length === 0, errors };
}

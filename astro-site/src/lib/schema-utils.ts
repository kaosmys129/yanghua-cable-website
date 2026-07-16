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
import { client } from '../data/client';

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
  geoQueries?: string[];
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
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Organization Schema
// ─────────────────────────────────────────────────────────────────────────────

export function generateFullOrganizationSchema(siteUrl?: string): Record<string, unknown> {
  const baseUrl = siteUrl || brand.url;

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: client.name,
    alternateName: ['YanghuaSTI', 'Yanghua Flexible Busbar'],
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/images/logo.png`,
      width: 200,
      height: 60,
    },
    description:
      'Leading manufacturer of high-current flexible busbar and electrical solutions for industrial applications worldwide',
    foundingDate: '2010',
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      minValue: 100,
      maxValue: 500,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: client.address.lineOne,
      addressLocality: client.address.city,
      addressRegion: client.address.state,
      addressCountry: client.address.country,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: client.phoneForTel,
        contactType: 'customer service',
        email: client.email,
        availableLanguage: ['English', 'Spanish', 'Chinese'],
        areaServed: 'Worldwide',
      },
      {
        '@type': 'ContactPoint',
        telephone: client.phoneForTel,
        contactType: 'technical support',
        email: client.email,
        availableLanguage: ['English', 'Chinese'],
        areaServed: 'Worldwide',
      },
    ],
    sameAs: [
      'https://www.linkedin.com/company/yanghua-cable',
      'https://twitter.com/yanghuacable',
      'https://www.facebook.com/yanghuacable',
    ],
    makesOffer: {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'Flexible Busbar Manufacturing and Solutions',
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CollectionPage Schema (Article listing pages)
// ─────────────────────────────────────────────────────────────────────────────

export function generateCollectionPageSchema(
  articles: CollectionPageArticle[],
  siteUrl?: string,
  locale: string = 'en',
): Record<string, unknown> {
  const baseUrl = siteUrl || brand.url;
  const listPath = locale === 'es' ? '/es/articulos' : '/en/articles';

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${baseUrl}${listPath}#collection`,
    name: locale === 'es' ? 'Articulos tecnicos' : 'Technical Articles',
    description:
      locale === 'es'
        ? 'Articulos tecnicos, guias GEO, preguntas frecuentes y perspectivas de aplicacion para proyectos de barras flexibles, almacenamiento de energia, energia solar fotovoltaica, carga de VE y distribucion de energia de alta corriente.'
        : 'Technical articles, GEO-ready guides, FAQs, and application insights for flexible busbar, energy storage, solar PV, EV charging, and high-current power distribution projects.',
    url: `${baseUrl}${listPath}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: articles.length,
      itemListElement: articles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'TechArticle',
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
          ...(article.geoQueries &&
            article.geoQueries.length > 0 && {
              about: article.geoQueries.map((q) => ({
                '@type': 'Thing',
                name: q,
              })),
            }),
          inLanguage: locale === 'es' ? 'es' : 'en',
          publisher: {
            '@type': 'Organization',
            '@id': `${baseUrl}/#organization`,
            name: client.name,
          },
          author: {
            '@type': 'Organization',
            '@id': `${baseUrl}/#organization`,
            name: client.name,
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
  const baseUrl = siteUrl || brand.url;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: {
        '@type': 'WebPage',
        '@id': item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
      },
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TechArticle / BlogPosting Schema (individual article pages)
// ─────────────────────────────────────────────────────────────────────────────

export function generateArticleSchema(
  post: ArticlePost,
  siteUrl?: string,
): Record<string, unknown> {
  const baseUrl = siteUrl || brand.url;

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
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
    author: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: client.name,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: client.name,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/images/logo.png`,
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
  const baseUrl = siteUrl || brand.url;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: client.name,
    alternateName: 'YanghuaSTI',
    url: baseUrl,
    description: brand.description,
    publisher: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
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
  const baseUrl = siteUrl || brand.url;

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
      name: client.name,
    },
    ...(additionalProperty && { additionalProperty }),
    ...(product.url && { url: product.url }),
    ...(product.locale && { inLanguage: product.locale }),
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

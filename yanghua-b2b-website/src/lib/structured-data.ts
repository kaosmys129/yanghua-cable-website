/**
 * 结构化数据生成工具
 * 实现完整的 Schema.org 标记，提升 SEO 效果
 * 遵循 Google 结构化数据指南和最佳实践
 */

import { SEO_CONFIG } from './seo';

// 基础组织信息 Schema
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SEO_CONFIG.siteUrl}/#organization`,
    name: 'Yanghua Cable',
    alternateName: ['YanghuaSTI', 'Yanghua Flexible Busbar'],
    url: SEO_CONFIG.siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${SEO_CONFIG.siteUrl}/images/logo.png`,
      width: 200,
      height: 60
    },
    description: 'Leading manufacturer of high-current flexible busbar and electrical solutions for industrial applications worldwide',
    foundingDate: '2010',
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      minValue: 100,
      maxValue: 500
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Industrial Development Zone',
      addressLocality: 'Guangzhou',
      addressRegion: 'Guangdong Province',
      postalCode: '510000',
      addressCountry: 'CN'
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+86-20-1234-5678',
        contactType: 'customer service',
        availableLanguage: ['English', 'Spanish', 'Chinese'],
        areaServed: 'Worldwide'
      },
      {
        '@type': 'ContactPoint',
        telephone: '+86-20-1234-5679',
        contactType: 'technical support',
        availableLanguage: ['English', 'Chinese'],
        areaServed: 'Worldwide'
      }
    ],
    sameAs: [
      'https://www.linkedin.com/company/yanghua-cable',
      'https://twitter.com/yanghuacable',
      'https://www.facebook.com/yanghuacable'
    ],
    makesOffer: {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'Flexible Busbar Manufacturing and Solutions'
      }
    }
  };
}

// 产品结构化数据 Schema
export function generateProductSchema(product: {
  name: string;
  description: string;
  image: string;
  sku: string;
  brand: string;
  category: string;
  specifications: Record<string, string>;
  url: string;
  currentRating?: string;
  voltage?: string;
  material?: string;
  applications?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SEO_CONFIG.siteUrl}${product.url}#product`,
    name: product.name,
    description: product.description,
    image: {
      '@type': 'ImageObject',
      url: `${SEO_CONFIG.siteUrl}${product.image}`,
      width: 800,
      height: 600
    },
    sku: product.sku,
    mpn: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand,
      logo: `${SEO_CONFIG.siteUrl}/images/logo.png`
    },
    category: product.category,
    manufacturer: {
      '@type': 'Organization',
      '@id': `${SEO_CONFIG.siteUrl}/#organization`,
      name: 'Yanghua Cable'
    },
    additionalProperty: [
      ...Object.entries(product.specifications).map(([key, value]) => ({
        '@type': 'PropertyValue',
        name: key,
        value: value
      })),
      ...(product.currentRating ? [{
        '@type': 'PropertyValue',
        name: 'Current Rating',
        value: product.currentRating,
        unitCode: 'AMP'
      }] : []),
      ...(product.voltage ? [{
        '@type': 'PropertyValue',
        name: 'Voltage Rating',
        value: product.voltage,
        unitCode: 'VLT'
      }] : []),
      ...(product.material ? [{
        '@type': 'PropertyValue',
        name: 'Material',
        value: product.material
      }] : [])
    ],
    url: `${SEO_CONFIG.siteUrl}${product.url}`,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'USD',
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      seller: {
        '@type': 'Organization',
        '@id': `${SEO_CONFIG.siteUrl}/#organization`,
        name: 'Yanghua Cable'
      },
      businessFunction: 'https://schema.org/Sell',
      itemCondition: 'https://schema.org/NewCondition'
    },
    ...(product.applications && {
      applicationCategory: product.applications
    })
  };
}

// 项目案例结构化数据 Schema
export function generateCaseStudySchema(project: {
  title: string;
  description: string;
  client: string;
  industry: string;
  completionDate: string;
  image: string;
  url: string;
  results: Array<{ metric: string; value: string }>;
  location?: string;
  duration?: string;
  projectScale?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${SEO_CONFIG.siteUrl}${project.url}#article`,
    headline: project.title,
    description: project.description,
    image: {
      '@type': 'ImageObject',
      url: `${SEO_CONFIG.siteUrl}${project.image}`,
      width: 1200,
      height: 630
    },
    datePublished: project.completionDate,
    dateModified: project.completionDate,
    author: {
      '@type': 'Organization',
      '@id': `${SEO_CONFIG.siteUrl}/#organization`,
      name: 'Yanghua Cable'
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SEO_CONFIG.siteUrl}/#organization`,
      name: 'Yanghua Cable',
      logo: {
        '@type': 'ImageObject',
        url: `${SEO_CONFIG.siteUrl}/images/logo.png`
      }
    },
    about: [
      {
        '@type': 'Thing',
        name: project.industry
      },
      {
        '@type': 'Organization',
        name: project.client
      }
    ],
    mentions: project.results.map(result => ({
      '@type': 'QuantitativeValue',
      name: result.metric,
      value: result.value
    })),
    ...(project.location && {
      contentLocation: {
        '@type': 'Place',
        name: project.location
      }
    }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SEO_CONFIG.siteUrl}${project.url}`
    }
  };
}

// 新闻文章结构化数据 Schema
export function generateArticleSchema(article: {
  title: string;
  description: string;
  content: string;
  author: string;
  publishedDate: string;
  modifiedDate?: string;
  image: string;
  url: string;
  category: string;
  tags: string[];
  readingTime?: number;
}) {
  const wordCount = article.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${SEO_CONFIG.siteUrl}${article.url}#article`,
    headline: article.title,
    description: article.description,
    image: {
      '@type': 'ImageObject',
      url: `${SEO_CONFIG.siteUrl}${article.image}`,
      width: 1200,
      height: 630
    },
    datePublished: article.publishedDate,
    dateModified: article.modifiedDate || article.publishedDate,
    author: {
      '@type': 'Person',
      name: article.author
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SEO_CONFIG.siteUrl}/#organization`,
      name: 'Yanghua Cable',
      logo: {
        '@type': 'ImageObject',
        url: `${SEO_CONFIG.siteUrl}/images/logo.png`
      }
    },
    articleSection: article.category,
    keywords: article.tags.join(', '),
    wordCount: wordCount,
    ...(article.readingTime && {
      timeRequired: `PT${article.readingTime}M`
    }),
    url: `${SEO_CONFIG.siteUrl}${article.url}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SEO_CONFIG.siteUrl}${article.url}`
    },
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${SEO_CONFIG.siteUrl}/#website`
    }
  };
}

// 面包屑导航结构化数据 Schema
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: {
        '@type': 'WebPage',
        '@id': `${SEO_CONFIG.siteUrl}${item.url}`
      }
    }))
  };
}

// FAQ 结构化数据 Schema
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SEO_CONFIG.siteUrl}/faq#faqpage`,
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

// 网站搜索框结构化数据 Schema
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SEO_CONFIG.siteUrl}/#website`,
    name: 'Yanghua Cable',
    alternateName: 'YanghuaSTI',
    url: SEO_CONFIG.siteUrl,
    description: SEO_CONFIG.defaultDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SEO_CONFIG.siteUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SEO_CONFIG.siteUrl}/#organization`
    }
  };
}

// 产品系列/集合结构化数据 Schema
export function generateProductCollectionSchema(collection: {
  name: string;
  description: string;
  url: string;
  products: Array<{ name: string; url: string; image: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SEO_CONFIG.siteUrl}${collection.url}#collection`,
    name: collection.name,
    description: collection.description,
    url: `${SEO_CONFIG.siteUrl}${collection.url}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: collection.products.length,
      itemListElement: collection.products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          url: `${SEO_CONFIG.siteUrl}${product.url}`,
          image: `${SEO_CONFIG.siteUrl}${product.image}`
        }
      }))
    }
  };
}

// 联系页面结构化数据 Schema
export function generateContactPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${SEO_CONFIG.siteUrl}/contact#contactpage`,
    name: 'Contact Yanghua Cable',
    description: 'Get in touch with Yanghua Cable for flexible busbar solutions and technical support',
    url: `${SEO_CONFIG.siteUrl}/contact`,
    mainEntity: {
      '@type': 'Organization',
      '@id': `${SEO_CONFIG.siteUrl}/#organization`
    }
  };
}

// 关于页面结构化数据 Schema
export function generateAboutPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${SEO_CONFIG.siteUrl}/about#aboutpage`,
    name: 'About Yanghua Cable',
    description: 'Learn about Yanghua Cable, a leading manufacturer of flexible busbar solutions',
    url: `${SEO_CONFIG.siteUrl}/about`,
    mainEntity: {
      '@type': 'Organization',
      '@id': `${SEO_CONFIG.siteUrl}/#organization`
    }
  };
}

// 结构化数据验证工具
export function validateStructuredData(schema: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 基础验证
  if (!schema['@context']) {
    errors.push('Missing @context property');
  }
  
  if (!schema['@type']) {
    errors.push('Missing @type property');
  }
  
  // URL 验证
  if (schema.url && !schema.url.startsWith('http')) {
    errors.push('Invalid URL format');
  }
  
  // 图片验证
  if (schema.image) {
    if (typeof schema.image === 'string' && !schema.image.startsWith('http')) {
      errors.push('Invalid image URL format');
    } else if (typeof schema.image === 'object' && schema.image.url && !schema.image.url.startsWith('http')) {
      errors.push('Invalid image URL format in ImageObject');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// 结构化数据 JSON 字符串生成器
export function generateStructuredDataScript(schema: any): string {
  const validation = validateStructuredData(schema);
  
  if (!validation.isValid) {
    console.warn('Structured data validation failed:', validation.errors);
  }
  
  return JSON.stringify(schema, null, 0);
}
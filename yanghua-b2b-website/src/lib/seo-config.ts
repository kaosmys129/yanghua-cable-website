/**
 * SEO优化配置和工具函数
 * 用于统一管理网站的SEO元数据
 */

import { Metadata } from 'next';

// 网站基础信息
export const SITE_CONFIG = {
  name: 'Yanghua Cable',
  title: 'Yanghua Cable - Professional Cable Solutions',
  description: 'Leading manufacturer of high-quality cables and wire solutions for industrial, commercial, and residential applications.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com',
  ogImage: '/images/og-image.jpg',
  keywords: [
    'cable manufacturer',
    'wire solutions',
    'industrial cables',
    'electrical cables',
    'yanghua cable',
    'cable supplier'
  ],
  author: 'Yanghua Cable Co., Ltd.',
  language: 'en',
  locale: 'en_US'
};

// 默认元数据
export const DEFAULT_METADATA: Metadata = {
  title: {
    default: SITE_CONFIG.title,
    template: `%s | ${SITE_CONFIG.name}`
  },
  description: SITE_CONFIG.description,
  keywords: SITE_CONFIG.keywords,
  authors: [{ name: SITE_CONFIG.author }],
  creator: SITE_CONFIG.author,
  publisher: SITE_CONFIG.author,
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  metadataBase: new URL(SITE_CONFIG.url),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    url: SITE_CONFIG.url,
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.title
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: [SITE_CONFIG.ogImage],
    creator: '@yanghuacable'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION
  }
};

// 页面元数据生成器
interface PageMetadataOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
}

export function generatePageMetadata(options: PageMetadataOptions): Metadata {
  const {
    title,
    description = SITE_CONFIG.description,
    keywords = [],
    image = SITE_CONFIG.ogImage,
    url,
    type = 'website',
    publishedTime,
    modifiedTime,
    section,
    tags = [],
    noIndex = false
  } = options;

  const pageTitle = title ? `${title} | ${SITE_CONFIG.name}` : SITE_CONFIG.title;
  const pageUrl = url ? `${SITE_CONFIG.url}${url}` : SITE_CONFIG.url;
  const allKeywords = [...SITE_CONFIG.keywords, ...keywords, ...tags];

  const metadata: Metadata = {
    title: pageTitle,
    description,
    keywords: allKeywords,
    alternates: {
      canonical: url || '/'
    },
    openGraph: {
      type,
      locale: SITE_CONFIG.locale,
      url: pageUrl,
      title: pageTitle,
      description,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title || SITE_CONFIG.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [image]
    }
  };

  // 文章类型的额外元数据
  if (type === 'article' && (publishedTime || modifiedTime || section)) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      publishedTime,
      modifiedTime,
      section,
      tags
    };
  }

  // 产品页面使用website类型
  // OpenGraph 不直接支持 product 类型，使用 website 替代

  // 禁止索引
  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true
    };
  }

  return metadata;
}

// 结构化数据生成器
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/images/logo.png`,
    description: SITE_CONFIG.description,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+86-xxx-xxxx-xxxx',
      contactType: 'customer service',
      availableLanguage: ['English', 'Spanish']
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CN',
      addressRegion: 'Guangdong',
      addressLocality: 'Dongguan'
    },
    sameAs: [
      'https://www.linkedin.com/company/yanghua-cable',
      'https://twitter.com/yanghuacable'
    ]
  };
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  image: string;
  brand?: string;
  model?: string;
  sku?: string;
  category?: string;
  price?: number;
  currency?: string;
  availability?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: product.brand || SITE_CONFIG.name
    },
    model: product.model,
    sku: product.sku,
    category: product.category,
    offers: product.price ? {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'USD',
      availability: `https://schema.org/${product.availability || 'InStock'}`
    } : undefined
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_CONFIG.url}${item.url}`
    }))
  };
}

// SEO检查工具
export function validateSEO(metadata: {
  title?: string;
  description?: string;
  keywords?: string[];
}) {
  const issues: string[] = [];

  // 标题检查
  if (!metadata.title) {
    issues.push('缺少页面标题');
  } else if (metadata.title.length > 60) {
    issues.push('页面标题过长（建议60字符以内）');
  } else if (metadata.title.length < 30) {
    issues.push('页面标题过短（建议30-60字符）');
  }

  // 描述检查
  if (!metadata.description) {
    issues.push('缺少页面描述');
  } else if (metadata.description.length > 160) {
    issues.push('页面描述过长（建议160字符以内）');
  } else if (metadata.description.length < 120) {
    issues.push('页面描述过短（建议120-160字符）');
  }

  // 关键词检查
  if (!metadata.keywords || metadata.keywords.length === 0) {
    issues.push('缺少关键词');
  } else if (metadata.keywords.length > 10) {
    issues.push('关键词过多（建议10个以内）');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

// 生成sitemap数据
export function generateSitemapUrls() {
  const baseUrls = [
    { url: '/', priority: 1.0, changefreq: 'daily' },
    { url: '/about', priority: 0.8, changefreq: 'monthly' },
    { url: '/products', priority: 0.9, changefreq: 'weekly' },
    { url: '/contact', priority: 0.7, changefreq: 'monthly' },
    { url: '/news', priority: 0.6, changefreq: 'weekly' }
  ];

  return baseUrls.map(item => ({
    ...item,
    url: `${SITE_CONFIG.url}${item.url}`,
    lastmod: new Date().toISOString()
  }));
}
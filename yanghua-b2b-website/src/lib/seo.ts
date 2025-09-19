import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

// 基础SEO配置
export const SEO_CONFIG = {
  siteName: 'Yanghua Cable',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://yanghua-cable-website.vercel.app',
  defaultTitle: 'Yanghua Cable - Professional Cable Solutions',
  defaultDescription: 'Leading manufacturer of high-quality cables and electrical solutions for industrial and commercial applications.',
  defaultKeywords: ['cable', 'electrical', 'industrial', 'manufacturing', 'yanghua'],
  twitterHandle: '@yanghuacable',
  defaultImage: '/images/og-default.jpg',
  defaultLocale: 'en',
  supportedLocales: ['en', 'es']
};

// 页面类型定义
export type PageType = 'website' | 'article' | 'product' | 'organization';

// SEO元数据接口
export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: PageType;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  locale?: string;
  alternateLocales?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
}

// 生成基础元数据
export async function generateMetadata(
  seoData: SEOData,
  locale: string = SEO_CONFIG.defaultLocale
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'seo' });
  
  const title = seoData.title || t('defaultTitle') || SEO_CONFIG.defaultTitle;
  const description = seoData.description || t('defaultDescription') || SEO_CONFIG.defaultDescription;
  const url = seoData.url ? `${SEO_CONFIG.siteUrl}${seoData.url}` : SEO_CONFIG.siteUrl;
  const image = seoData.image ? `${SEO_CONFIG.siteUrl}${seoData.image}` : `${SEO_CONFIG.siteUrl}${SEO_CONFIG.defaultImage}`;

  // 构建关键词
  const keywords = [
    ...(seoData.keywords || []),
    ...SEO_CONFIG.defaultKeywords
  ].join(', ');

  // 构建alternate语言链接
  const alternates: Record<string, string> = {};
  SEO_CONFIG.supportedLocales.forEach(loc => {
    if (loc !== locale) {
      alternates[loc] = url.replace(`/${locale}/`, `/${loc}/`);
    }
  });

  const metadata: Metadata = {
    title,
    description,
    keywords,
    authors: seoData.author ? [{ name: seoData.author }] : undefined,
    robots: {
      index: !seoData.noIndex,
      follow: !seoData.noFollow,
      googleBot: {
        index: !seoData.noIndex,
        follow: !seoData.noFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: (seoData.type === 'product' || seoData.type === 'organization') ? 'website' : (seoData.type || 'website'),
      title,
      description,
      url,
      siteName: SEO_CONFIG.siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale,
      alternateLocale: seoData.alternateLocales || SEO_CONFIG.supportedLocales.filter(loc => loc !== locale),
      publishedTime: seoData.publishedTime,
      modifiedTime: seoData.modifiedTime,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: SEO_CONFIG.twitterHandle,
      site: SEO_CONFIG.twitterHandle,
    },
    alternates: {
      canonical: url,
      languages: alternates,
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_SITE_VERIFICATION,
    },
    other: {
      'msapplication-TileColor': '#2563eb',
      'theme-color': '#2563eb',
    },
  };

  return metadata;
}

// 生成结构化数据
export function generateStructuredData(type: string, data: any) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
  };

  switch (type) {
    case 'Organization':
      return {
        ...baseData,
        name: SEO_CONFIG.siteName,
        url: SEO_CONFIG.siteUrl,
        logo: `${SEO_CONFIG.siteUrl}/images/logo.png`,
        description: SEO_CONFIG.defaultDescription,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: data.phone,
          contactType: 'customer service',
          availableLanguage: SEO_CONFIG.supportedLocales,
        },
        sameAs: data.socialLinks || [],
        ...data,
      };

    case 'Product':
      return {
        ...baseData,
        name: data.name,
        description: data.description,
        image: data.image ? `${SEO_CONFIG.siteUrl}${data.image}` : undefined,
        brand: {
          '@type': 'Brand',
          name: SEO_CONFIG.siteName,
        },
        manufacturer: {
          '@type': 'Organization',
          name: SEO_CONFIG.siteName,
        },
        offers: data.offers ? {
          '@type': 'Offer',
          price: data.offers.price,
          priceCurrency: data.offers.currency || 'USD',
          availability: 'https://schema.org/InStock',
        } : undefined,
        ...data,
      };

    case 'Article':
      return {
        ...baseData,
        headline: data.title,
        description: data.description,
        image: data.image ? `${SEO_CONFIG.siteUrl}${data.image}` : undefined,
        author: {
          '@type': 'Person',
          name: data.author || SEO_CONFIG.siteName,
        },
        publisher: {
          '@type': 'Organization',
          name: SEO_CONFIG.siteName,
          logo: {
            '@type': 'ImageObject',
            url: `${SEO_CONFIG.siteUrl}/images/logo.png`,
          },
        },
        datePublished: data.publishedTime,
        dateModified: data.modifiedTime || data.publishedTime,
        ...data,
      };

    case 'WebSite':
      return {
        ...baseData,
        name: SEO_CONFIG.siteName,
        url: SEO_CONFIG.siteUrl,
        description: SEO_CONFIG.defaultDescription,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SEO_CONFIG.siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
        ...data,
      };

    default:
      return { ...baseData, ...data };
  }
}

// 生成面包屑结构化数据
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SEO_CONFIG.siteUrl}${item.url}`,
    })),
  };
}

// 生成FAQ结构化数据
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// 生成本地商业结构化数据
export function generateLocalBusinessStructuredData(businessData: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SEO_CONFIG.siteName,
    description: SEO_CONFIG.defaultDescription,
    url: SEO_CONFIG.siteUrl,
    telephone: businessData.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: businessData.address?.street,
      addressLocality: businessData.address?.city,
      addressRegion: businessData.address?.region,
      postalCode: businessData.address?.postalCode,
      addressCountry: businessData.address?.country,
    },
    geo: businessData.coordinates ? {
      '@type': 'GeoCoordinates',
      latitude: businessData.coordinates.lat,
      longitude: businessData.coordinates.lng,
    } : undefined,
    openingHours: businessData.openingHours,
    priceRange: businessData.priceRange,
    ...businessData,
  };
}

// 工具函数：清理和验证SEO数据
export function sanitizeSEOData(data: SEOData): SEOData {
  return {
    ...data,
    title: data.title?.slice(0, 60), // 限制标题长度
    description: data.description?.slice(0, 160), // 限制描述长度
    keywords: data.keywords?.slice(0, 10), // 限制关键词数量
  };
}

// 工具函数：生成sitemap条目
export function generateSitemapEntry(
  url: string,
  lastModified?: Date,
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
  priority?: number
) {
  return {
    url: `${SEO_CONFIG.siteUrl}${url}`,
    lastModified: lastModified || new Date(),
    changeFrequency: changeFrequency || 'weekly',
    priority: priority || 0.5,
  };
}
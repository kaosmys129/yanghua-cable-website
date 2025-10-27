import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Locale } from './i18n';
import { 
  buildLocalizedUrl, 
  translateUrl, 
  LOCALIZED_PATHS,
  getLocalizedPath,
  getPageKeyFromPath 
} from './url-localization';
import { getSiteUrl } from './site-url';

// 基础SEO配置
export const SEO_CONFIG = {
  siteName: 'Yanghua Cable',
  siteUrl: getSiteUrl(),
  defaultTitle: 'Flexible Busbar Solutions | High Current Power Distribution | Yanghua',
  defaultDescription: 'Leading manufacturer of flexible copper busbar systems and high current power distribution solutions. IP68 waterproof, 6400A capacity for data centers, EV charging, and industrial applications.',
  defaultKeywords: [
    // 英语主要关键词
    'flexible busbar', 'copper busbar', 'high current busbar', 'busbar systems', 'power distribution',
    // 英语长尾关键词
    'flexible copper busbar systems', 'high current power distribution solutions', 'IP68 waterproof busbar',
    'data center power distribution', 'EV charging infrastructure cables', 'industrial power transmission',
    // 品牌和通用关键词
    'yanghua', 'electrical components', 'cable management solutions', 'power transmission efficiency'
  ],
  // 西班牙语关键词配置
  spanishKeywords: [
    // 西班牙语主要关键词
    'barra colectora flexible', 'barra de cobre', 'distribución de energía', 'sistemas de barras colectoras', 'cables de alta corriente',
    // 西班牙语长尾关键词
    'sistemas de barras colectoras flexibles', 'distribución de energía de alta corriente', 'barras colectoras impermeables IP68',
    'distribución de energía para centros de datos', 'infraestructura de carga para vehículos eléctricos', 'transmisión de energía industrial',
    // 品牌和通用关键词
    'yanghua', 'componentes eléctricos', 'soluciones de gestión de cables', 'eficiencia en transmisión de energía'
  ],
  twitterHandle: '@yanghuacable',
  defaultImage: '/images/og-default.jpg',
  defaultLocale: 'en',
  supportedLocales: ['en', 'es']
};

/**
 * 生成hreflang替代链接
 * @param currentPath 当前页面路径（不包含语言前缀）
 * @param currentLocale 当前语言
 * @param baseUrl 网站基础URL
 * @returns hreflang链接数组
 */
export function generateHreflangAlternates(
  currentPath: string,
  currentLocale: Locale,
  baseUrl: string = getSiteUrl()
): Array<{ hreflang: string; href: string }> {
  const alternates: Array<{ hreflang: string; href: string }> = [];
  
  // 规范化 baseUrl，去除尾部斜杠，避免双斜杠
  const cleanBaseUrl = (baseUrl || '').replace(/\/+$/, '');
  
  // 支持的语言映射
  const localeMap: Record<Locale, string> = {
    en: 'en',
    es: 'es'
  };

  // 获取页面键名
  const pageKey = getPageKeyFromPath(currentPath, currentLocale);
  
  // 为每种语言生成hreflang链接
  Object.entries(localeMap).forEach(([locale, hreflang]) => {
    const targetLocale = locale as Locale;
    
    let localizedUrl: string;
    if (pageKey) {
      // 使用 LOCALIZED_PATHS 直接组装，确保英文（默认语言）不带 /en 前缀
      const targetBase = LOCALIZED_PATHS[pageKey]?.[targetLocale] || LOCALIZED_PATHS[pageKey]?.en || currentPath;
      // 新策略：所有语言均带前缀，包括英文 /en
      localizedUrl = `${cleanBaseUrl}/${targetLocale}${targetBase === '/' ? '' : targetBase}`;
    } else {
      // 无明确 pageKey 时的回退逻辑
      // 所有语言均带前缀（未知路径也遵循该规则）
      localizedUrl = `${cleanBaseUrl}/${targetLocale}${currentPath === '/' ? '' : currentPath}`;
    }
    
    alternates.push({
      hreflang,
      href: localizedUrl
    });
  });

  // 添加x-default（默认为英语，但需要确保URL正确）
  let defaultUrl: string;
  if (pageKey) {
    const targetBaseEn = LOCALIZED_PATHS[pageKey]?.en || currentPath;
    defaultUrl = `${cleanBaseUrl}/en${targetBaseEn === '/' ? '' : targetBaseEn}`;
  } else {
    defaultUrl = `${cleanBaseUrl}/en${currentPath === '/' ? '' : currentPath}`;
  }
  
  alternates.push({
    hreflang: 'x-default',
    href: defaultUrl
  });

  return alternates;
}

/**
 * 为Next.js Metadata生成hreflang替代链接
 * @param currentPath 当前页面路径
 * @param currentLocale 当前语言
 * @returns 符合Next.js Metadata格式的语言映射
 */
export function generateHreflangAlternatesForMetadata(
  currentPath: string,
  currentLocale: Locale
): Record<string, string> {
  const alternates: Record<string, string> = {};
  
  // 统一使用集中化的站点 URL 解析逻辑
  const baseUrl: string = getSiteUrl();
  const cleanBaseUrl = (baseUrl || '').replace(/\/+$/, '');
  
  const localeMap: Record<Locale, string> = {
    en: 'en',
    es: 'es'
  };

  // 更稳健的页面键解析：在所有语言映射中查找匹配的基路径
  let pageKey: string | null = null;
  let remainder = '';
  for (const [key, paths] of Object.entries(LOCALIZED_PATHS)) {
    const baseEn = paths.en || '';
    const baseEs = paths.es || '';
    if (currentPath === baseEn || (baseEn && currentPath.startsWith(baseEn + '/'))) {
      pageKey = key;
      remainder = currentPath.slice(baseEn.length);
      break;
    }
    if (currentPath === baseEs || (baseEs && currentPath.startsWith(baseEs + '/'))) {
      pageKey = key;
      remainder = currentPath.slice(baseEs.length);
      break;
    }
  }
  // 若未解析到，回退旧逻辑尝试当前语言/英文/西语解析
  if (!pageKey) {
    pageKey = getPageKeyFromPath(currentPath, currentLocale) 
      || getPageKeyFromPath(currentPath, 'en' as Locale) 
      || getPageKeyFromPath(currentPath, 'es' as Locale) 
      || null;
  }

  Object.entries(localeMap).forEach(([locale, hreflang]) => {
    const targetLocale = locale as Locale;
    let localizedUrl: string;
    if (pageKey) {
      const targetBase = LOCALIZED_PATHS[pageKey]?.[targetLocale] || LOCALIZED_PATHS[pageKey]?.en || currentPath;
      // 新策略：所有语言均带前缀（包括英文）
      localizedUrl = `${cleanBaseUrl}/${targetLocale}${targetBase}${remainder}`;
    } else {
      localizedUrl = `${cleanBaseUrl}/${targetLocale}${currentPath === '/' ? '' : currentPath}`;
    }
    alternates[hreflang] = localizedUrl;
  });

  let defaultUrl: string;
  if (pageKey) {
    const targetBaseEn = LOCALIZED_PATHS[pageKey]?.en || currentPath;
    defaultUrl = `${cleanBaseUrl}/en${targetBaseEn === '/' && !remainder ? '' : `${targetBaseEn}${remainder}`}`;
  } else {
    defaultUrl = `${cleanBaseUrl}/en${currentPath === '/' ? '' : currentPath}`;
  }
  
  alternates['x-default'] = defaultUrl;

  return alternates;
}

/**
 * 生成canonical URL
 * @param currentPath 当前页面路径
 * @param currentLocale 当前语言
 * @param baseUrl 网站基础URL
 * @returns canonical URL - 始终返回英语版本的URL作为canonical
 */
export function generateCanonicalUrl(
  currentPath: string,
  currentLocale: Locale,
  baseUrl?: string
): string {
  // 统一使用集中化的站点 URL 解析逻辑
  if (!baseUrl) {
    baseUrl = getSiteUrl();
  }
  // 统一清理 baseUrl 尾部斜杠，避免 //
  const cleanBaseUrl = (baseUrl || '').replace(/\/+$/, '');
  
  const pageKey = getPageKeyFromPath(currentPath, currentLocale);
  let remainder = '';
  if (pageKey) {
    const basePathForCurrent = LOCALIZED_PATHS[pageKey]?.[currentLocale] || '';
    if (basePathForCurrent && currentPath.startsWith(basePathForCurrent)) {
      remainder = currentPath.slice(basePathForCurrent.length);
    }
  }
  
  // 自引用 canonical：当前语言页面的规范URL（所有语言都带语言前缀，包括英文 /en）
  let final: string;
  if (pageKey) {
    const targetBaseForLocale = LOCALIZED_PATHS[pageKey]?.[currentLocale] || LOCALIZED_PATHS[pageKey]?.en || currentPath;
    final = `${cleanBaseUrl}/${currentLocale}${targetBaseForLocale === '/' && !remainder ? '' : `${targetBaseForLocale}${remainder}`}`;
  } else {
    final = `${cleanBaseUrl}/${currentLocale}${currentPath === '/' ? '' : currentPath}`;
  }
  if (process.env.NODE_ENV === 'development') {
    console.log('[generateCanonicalUrl]', { currentPath, currentLocale, baseUrl: cleanBaseUrl, final });
  }
  return final;
}

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
  const keywords = locale === 'es' 
    ? [...(seoData.keywords || []), ...SEO_CONFIG.spanishKeywords].join(', ')
    : [...(seoData.keywords || []), ...SEO_CONFIG.defaultKeywords].join(', ');

  // 构建alternate语言链接
  const alternates = generateHreflangAlternatesForMetadata(seoData.url || '', locale as Locale);

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
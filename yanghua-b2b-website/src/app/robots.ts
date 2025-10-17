import type { MetadataRoute } from 'next';

/**
 * Environment-aware robots configuration
 * - Production: allow crawling, disallow API
 * - Preview/Development: disallow all to avoid accidental indexing of non-production URLs
 * - Always point sitemap to the production domain
 */
export default function robots(): MetadataRoute.Robots {
  const isPreview = process.env.VERCEL_ENV === 'preview';
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const PRODUCTION_SITE = 'https://www.yhflexiblebusbar.com';

  // In preview or development, block indexing entirely
  if (isPreview || isDevelopment) {
    return {
      rules: [
        { userAgent: '*', disallow: '/' },
      ],
      // Still declare the production sitemap (optional), but preview/dev hosts are blocked
      sitemap: `${PRODUCTION_SITE}/sitemap.xml`,
      host: PRODUCTION_SITE,
    };
  }

  // In production, allow crawling of the site but disallow API endpoints
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 为加速清理重复，在生产环境禁止抓取西语下的英文段旧路径（规范是西语翻译段）
        disallow: [
          '/api/',
          '/es/products',
          '/es/solutions',
          '/es/services',
          '/es/projects',
          '/es/contact',
          '/es/about',
          '/es/articles',
          '/es/products/category'
        ]
      },
    ],
    sitemap: `${PRODUCTION_SITE}/sitemap.xml`,
    host: PRODUCTION_SITE,
  };
}
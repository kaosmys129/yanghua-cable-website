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
        disallow: [
          '/api/'
        ]
      },
    ],
    sitemap: `${PRODUCTION_SITE}/sitemap.xml`,
    host: PRODUCTION_SITE,
  };
}
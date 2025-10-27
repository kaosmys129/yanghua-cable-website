import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

/**
 * Environment-aware robots configuration
 * - Production: allow crawling, disallow API
 * - Preview: disallow all to avoid accidental indexing of non-production URLs
 * - Development: allow crawling for testing purposes (Lighthouse, SEO tools)
 * - Always point sitemap to the production domain
 */
export default function robots(): MetadataRoute.Robots {
  const isPreview = process.env.VERCEL_ENV === 'preview';
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const siteUrl = getSiteUrl();

  // In preview, block indexing entirely to avoid accidental indexing of preview URLs
  if (isPreview) {
    return {
      rules: [
        { userAgent: '*', disallow: '/' },
      ],
      sitemap: `${siteUrl}/sitemap.xml`,
      host: siteUrl,
    };
  }

  // In development, allow crawling for testing purposes (Lighthouse, SEO tools)
  // but still point to production sitemap
  if (isDevelopment) {
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
      sitemap: `${siteUrl}/sitemap.xml`,
      host: siteUrl,
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
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
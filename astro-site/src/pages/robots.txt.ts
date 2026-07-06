import type { APIRoute } from 'astro';

export const prerender = true;

const siteEnv = String(process.env.PUBLIC_SITE_ENV || process.env.VERCEL_ENV || 'production').toLowerCase();
const isIndexableEnvironment = siteEnv === 'production';

const robots = isIndexableEnvironment
  ? [
      'User-agent: *',
      'Allow: /',
      'Allow: /llms.txt',
      'Allow: /geoflow/articles-map.json',
      'Disallow: /api/',
      '',
      'User-agent: GPTBot',
      'Allow: /',
      '',
      'User-agent: Claude-Web',
      'Allow: /',
      '',
      'User-agent: Google-Extended',
      'Allow: /',
      '',
      'User-agent: PerplexityBot',
      'Allow: /',
      '',
      'Sitemap: https://www.yhflexiblebusbar.com/sitemap.xml',
      '',
    ].join('\n')
  : [
      'User-agent: *',
      'Disallow: /',
      '',
      '# Non-production deployment: crawling is intentionally disabled.',
      '',
    ].join('\n');

export const GET: APIRoute = () =>
  new Response(robots, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });

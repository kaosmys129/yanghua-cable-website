import type { APIRoute } from 'astro';
import { getSitemapXml } from '../lib/yanghua/articles.mjs';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(getSitemapXml(), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });

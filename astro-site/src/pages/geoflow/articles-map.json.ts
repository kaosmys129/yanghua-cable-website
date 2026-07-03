import type { APIRoute } from 'astro';
import { getArticlesMapPayload } from '../../lib/yanghua/articles.mjs';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(getArticlesMapPayload(), null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });

import type { APIRoute } from 'astro';
import { getLlmsFullTxt } from '../lib/yanghua/articles.mjs';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(getLlmsFullTxt(), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      ok: true,
      site: 'Yanghua Cable',
      version: '0.1.0',
      supportedLocales: ['en', 'es'],
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    }
  );
};

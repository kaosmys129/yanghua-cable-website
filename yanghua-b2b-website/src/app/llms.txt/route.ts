import { NextResponse } from 'next/server';
import { contentRepository } from '@/lib/content-repository';
import { buildLlmsTxt } from '@/lib/geoflow/machine-readable';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const [enArticles, esArticles, enHubs, esHubs] = await Promise.all([
    contentRepository.getAllArticles('en'),
    contentRepository.getAllArticles('es'),
    contentRepository.getAllHubs('en'),
    contentRepository.getAllHubs('es'),
  ]);

  return new NextResponse(
    buildLlmsTxt({
      siteUrl: getSiteUrl(),
      articles: [...enArticles, ...esArticles],
      hubs: [...enHubs, ...esHubs],
    }),
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}

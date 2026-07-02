import { NextResponse } from 'next/server';
import { contentRepository } from '@/lib/content-repository';
import { buildArticlesMapPayload } from '@/lib/geoflow/machine-readable';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const [enArticles, esArticles] = await Promise.all([
    contentRepository.getAllArticles('en'),
    contentRepository.getAllArticles('es'),
  ]);

  return NextResponse.json(buildArticlesMapPayload([...enArticles, ...esArticles], getSiteUrl()), {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

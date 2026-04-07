import { NextResponse } from 'next/server';
import { contentRepository } from '@/lib/content-repository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') === 'es' ? 'es' : 'en';
    const data = await contentRepository.getAllArticles(locale);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'ContentRepositoryError',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

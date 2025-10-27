import { NextResponse } from 'next/server';
import { getStrapiURL } from '@/lib/utils';
import { normalizeApiResponse, transformArticles } from '@/lib/data-transformer';

// Proxy API route to fetch articles from Strapi Cloud on the server side
// This avoids CORS issues when loading data from client components.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    const baseUrl = getStrapiURL();
    const url = new URL(`${baseUrl}/api/articles`);
    // Populate relations needed by the UI
    url.searchParams.set('populate[cover][populate]', '*');
    url.searchParams.set('populate[author][populate][avatar][populate]', '*');
    url.searchParams.set('populate[blocks][populate]', '*');
    // Locale and sort
    url.searchParams.set('locale', locale);
    url.searchParams.set('sort', 'publishedAt:desc');

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    const token = process.env.STRAPI_API_TOKEN;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      headers,
      // Ensure we always fetch fresh data in dev
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: 'UpstreamError',
          status: response.status,
          statusText: response.statusText,
          message: errorText,
        },
        { status: response.status }
      );
    }

    const json = await response.json();
    const normalized = normalizeApiResponse(json, transformArticles);

    if (normalized.error) {
      return NextResponse.json(
        { error: normalized.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: normalized.data || [], meta: normalized.meta },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'ProxyRouteError',
        message: error?.message || 'Unknown error',
      },
      { status: 502 }
    );
  }
}

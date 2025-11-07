import Link from "next/link";
import type { Metadata } from 'next';
import { getAllHubs } from '@/lib/strapi-client';
import { getLocalizedPath } from '@/lib/url-localization';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';

interface PageProps { params: { locale: string } }

export default async function HubListPage({ params }: PageProps) {
  const { locale } = params;
  let data: Awaited<ReturnType<typeof getAllHubs>>['data'] = [];
  try {
    const res = await getAllHubs(locale as any);
    data = res.data || [];
  } catch (e) {
    // 在开发或后端未部署/未授权时，允许优雅降级为空列表，避免页面报错
    console.error('[HubListPage] Failed to fetch hubs:', e);
    data = [];
  }
  const title = locale === 'es' ? 'Temas' : 'Topics';

  return (
    <main className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      {data.length === 0 ? (
        <div className="text-gray-600">
          <p className="mb-2">
            {locale === 'es'
              ? 'Aún no hay páginas de temas disponibles. Visita la lista de artículos para explorar contenidos.'
              : 'No topic hubs are available yet. Please visit the articles list to explore content.'}
          </p>
          <Link
            href={`/${locale}${getLocalizedPath('articles', locale as any) === '/' ? '' : getLocalizedPath('articles', locale as any)}`}
            className="inline-block mt-2 text-blue-600 hover:underline"
          >
            {locale === 'es' ? 'Ver artículos' : 'View Articles'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {data.map((hub) => {
            const detailPath = getLocalizedPath('articles-hub-detail', locale as any, { slug: hub.slug });
            return (
              <article key={hub.id} className="border rounded-lg overflow-hidden">
                <Link href={`/${locale}${detailPath === '/' ? '' : detailPath}`} className="block p-4">
                  <h3 className="text-lg font-medium line-clamp-2">{hub.title}</h3>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params;
  const localizedPath = getLocalizedPath('articles-hub', locale as any);
  const canonical = generateCanonicalUrl(localizedPath, locale as any);
  const title = locale === 'es' ? 'Temas | Yanghua' : 'Topics | Yanghua';
  const description = locale === 'es'
    ? 'Páginas de temas con artículos destacados.'
    : 'Topic hub pages with featured articles.';
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata(localizedPath, locale as any),
    },
  };
}

export const dynamicParams = false;
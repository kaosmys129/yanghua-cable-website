import ArticlesList from '@/components/ArticlesList';
import { getCachedAllArticles } from '@/lib/cached-api';
import type { ContentApiLocale } from '@/lib/content-api';
import type { Article } from '@/lib/types';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SEO_CONFIG } from '@/lib/seo';

const TITLE = 'Últimos artículos';
const DESCRIPTION = 'Mantente al día con nuestras últimas ideas, noticias del sector y perspectivas expertas de Yanghua.';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `${TITLE} | ${SEO_CONFIG.siteName}`,
    description: DESCRIPTION,
    alternates: {
      canonical: `${SEO_CONFIG.siteUrl}/es/articulos`,
    },
  };
}

export default async function SpanishArticlesPage({ params }: { params: { locale: string } }) {
  if (params.locale !== 'es') {
    notFound();
  }

  let initialArticles: Article[] = [];

  try {
    const result = await getCachedAllArticles('es' as ContentApiLocale);
    initialArticles = result.data || [];
  } catch (error) {
    console.error('Failed to fetch Spanish articles on server:', error);
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: TITLE,
            description: DESCRIPTION,
            url: 'https://www.yhflexiblebusbar.com/es/articulos',
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: initialArticles.map((article, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: `https://www.yhflexiblebusbar.com/es/articulos/${article.slug}`,
                name: article.title
              }))
            }
          })
        }}
      />

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#212529]">{TITLE}</h1>
        <p className="text-lg text-[#6c757d] max-w-2xl mx-auto">{DESCRIPTION}</p>
      </div>

      <ArticlesList initialData={initialArticles} />
    </main>
  );
}

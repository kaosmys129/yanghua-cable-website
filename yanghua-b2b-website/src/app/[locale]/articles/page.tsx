
import { getCachedAllArticles } from '@/lib/cached-api';
import ArticlesList from '@/components/ArticlesList';
import { Metadata } from 'next';
import { SEO_CONFIG } from '@/lib/seo';
import type { ContentApiLocale } from '@/lib/content-api';
import type { Article } from '@/lib/types';

const PAGE_COPY = {
  en: {
    title: 'Latest Articles',
    description: 'Stay updated with our latest insights, industry news, and expert perspectives from Yanghua.',
  },
  es: {
    title: 'Últimos artículos',
    description: 'Mantente al día con nuestras últimas ideas, noticias del sector y perspectivas expertas de Yanghua.',
  },
} as const;

// Add metadata generation
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params.locale === 'es' ? 'es' : 'en';
  const copy = PAGE_COPY[locale];
  
  return {
    title: `${copy.title} | ${SEO_CONFIG.siteName}`,
    description: copy.description,
    alternates: {
      canonical: `${SEO_CONFIG.siteUrl}/${locale}/articles`,
    },
  };
}

export default async function ArticlesPage({ params }: { params: { locale: string } }) {
  const locale = params.locale === 'es' ? 'es' : 'en';
  const copy = PAGE_COPY[locale];
  
  // Fetch data on the server with caching
  let initialArticles: Article[] = [];
  try {
    const result = await getCachedAllArticles(locale as ContentApiLocale);
    initialArticles = result.data || [];
  } catch (error) {
    console.error('Failed to fetch articles on server:', error);
    // We'll let the client component handle the error state or retry
  }

  return (
    <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#fff4d6_0%,#fffaf0_34%,#ffffff_68%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[linear-gradient(120deg,rgba(217,119,6,0.09),rgba(15,23,42,0)_45%)]" />
      <div className="pointer-events-none absolute right-[-120px] top-24 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
      {/* JSON-LD: CollectionPage for Articles */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: copy.title,
            description: copy.description,
            url: `https://www.yhflexiblebusbar.com/${locale}${locale === 'es' ? '/articulos' : '/articles'}`,
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: initialArticles.map((article, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: `https://www.yhflexiblebusbar.com/${locale}/articles/${article.slug}`,
                name: article.title
              }))
            }
          })
        }}
      />
      
      <section className="mx-auto max-w-7xl px-4 pb-6 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <div className="overflow-hidden rounded-[36px] border border-amber-100 bg-white/80 px-6 py-12 shadow-[0_30px_100px_-50px_rgba(217,119,6,0.45)] backdrop-blur sm:px-10">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
              Yanghua Journal
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">{copy.title}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">{copy.description}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                {initialArticles.length} {locale === 'es' ? 'artículos' : 'articles'}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                {locale === 'es' ? 'Noticias, proyectos y perspectivas técnicas' : 'News, projects, and technical perspectives'}
              </span>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {locale === 'es' ? 'Cobertura' : 'Coverage'}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {locale === 'es' ? 'Actualizaciones técnicas, hitos de proyectos y noticias corporativas.' : 'Technical updates, project milestones, and company news.'}
                </p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {locale === 'es' ? 'Formato' : 'Format'}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {locale === 'es' ? 'Lectura editorial con artículos destacados y archivo completo.' : 'Editorial reading with featured stories and a complete archive.'}
                </p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {locale === 'es' ? 'Enfoque' : 'Focus'}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {locale === 'es' ? 'Busbar flexible, energía, electrificación industrial y fiabilidad.' : 'Flexible busbar, energy systems, industrial electrification, and reliability.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ArticlesList initialData={initialArticles} />
    </main>
  );
}

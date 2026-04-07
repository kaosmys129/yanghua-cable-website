
'use client';

import Link from "next/link"
import { useArticles } from '@/lib/queries';
import { CmsImage } from "@/components/custom/CmsImage";
import { Article } from '@/lib/types';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getLocalizedPath } from '@/lib/url-localization';

const COPY = {
  en: {
    emptyTitle: 'No Articles Found',
    emptyDescription: 'There are no articles available at the moment. Please check back later.',
    errorTitle: 'Error Loading Articles',
    errorDescription: 'Unable to fetch data. Please try again later.',
    retry: 'Try Again',
    retrying: 'Retrying...',
    retryHintIdle: 'Will auto-retry in a few seconds',
    retryHintBusy: 'Retrying automatically...',
    unknownAuthor: 'Unknown Author',
    uncategorized: 'News',
    readMore: 'Read More',
  },
  es: {
    emptyTitle: 'No se encontraron artículos',
    emptyDescription: 'No hay artículos disponibles en este momento. Vuelve más tarde.',
    errorTitle: 'Error al cargar artículos',
    errorDescription: 'No fue posible obtener los datos. Inténtalo de nuevo más tarde.',
    retry: 'Reintentar',
    retrying: 'Reintentando...',
    retryHintIdle: 'Se volverá a intentar automáticamente en unos segundos',
    retryHintBusy: 'Reintentando automáticamente...',
    unknownAuthor: 'Equipo editorial de Yanghua',
    uncategorized: 'Noticias',
    readMore: 'Leer más',
  },
} as const;

type ArticlesCopy = (typeof COPY)[keyof typeof COPY];

function formatArticleDate(dateString: string, locale: 'en' | 'es') {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

function EmptyState({ locale }: { locale: 'en' | 'es' }) {
  const copy = COPY[locale];
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#212529] mb-4">{copy.emptyTitle}</h2>
        <p className="text-[#6c757d]">{copy.emptyDescription}</p>
      </div>
    </main>
  );
}

function ArticleCard({ article, locale, copy, featured = false }: { article: Article; locale: 'en' | 'es'; copy: ArticlesCopy; featured?: boolean }) {
  const href = `/${article.locale}${getLocalizedPath('articles-detail', article.locale as 'en' | 'es', { slug: article.slug })}`;

  if (featured) {
    return (
      <Link href={href} className="group block">
        <article className="overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-[0_32px_90px_-45px_rgba(15,23,42,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_38px_110px_-45px_rgba(217,119,6,0.45)]">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative min-h-[240px] overflow-hidden sm:min-h-[280px] lg:min-h-[100%]">
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
              <div className="absolute left-5 top-5 z-20 rounded-full border border-white/30 bg-slate-950/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-white backdrop-blur">
                {locale === 'es' ? 'Portada' : 'Cover story'}
              </div>
              <CmsImage
                src={article.cover?.url || "/placeholder.svg?height=720&width=1080&query=article"}
                alt={article.cover?.alternativeText || article.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col justify-between gap-6 p-7 sm:p-9">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                    {article.category?.name || copy.uncategorized}
                  </span>
                  <span>{formatArticleDate(article.publishedAt, locale)}</span>
                </div>
                <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-amber-600 sm:text-3xl lg:text-4xl">
                  {article.title}
                </h2>
                <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                  {article.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <span className="rounded-full border border-slate-200 px-3 py-1">
                    {locale === 'es' ? 'Edición técnica' : 'Technical edition'}
                  </span>
                  <span className="rounded-full border border-slate-200 px-3 py-1">
                    {locale === 'es' ? 'Informe destacado' : 'Featured report'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-amber-100">
                    <CmsImage
                      src={article.author?.avatar?.url || "/placeholder.svg?height=50&width=50&query=avatar"}
                      alt={article.author?.name || "Author"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">{article.author?.name || copy.unknownAuthor}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {locale === 'es' ? 'Selección destacada' : 'Featured story'}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition-transform duration-200 group-hover:translate-x-1">
                  {copy.readMore}
                  <span className="text-amber-500">→</span>
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={href} className="group block">
      <article className="article-card overflow-hidden rounded-[28px] border border-black/5 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_-35px_rgba(15,23,42,0.45)]">
        <div className="relative h-48 w-full overflow-hidden sm:h-52 lg:h-56">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
          <div className="absolute left-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-700 shadow-sm">
            {article.category?.name || copy.uncategorized}
          </div>
          <CmsImage
            src={article.cover?.url || "/placeholder.svg?height=400&width=600&query=article"}
            alt={article.cover?.alternativeText || article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
          <div className="space-y-5 p-6">
            <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-amber-100">
              <CmsImage
                src={article.author?.avatar?.url || "/placeholder.svg?height=50&width=50&query=avatar"}
                alt={article.author?.name || "Author"}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-700">{article.author?.name || copy.unknownAuthor}</p>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{formatArticleDate(article.publishedAt, locale)}</p>
            </div>
          </div>
          <h2 className="line-clamp-3 text-xl font-semibold leading-tight text-slate-900 transition-colors duration-200 group-hover:text-amber-600 sm:text-2xl">
            {article.title}
          </h2>
          <p className="line-clamp-4 text-sm leading-7 text-slate-600">{article.description}</p>
            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {locale === 'es' ? 'Artículo' : 'Article'}
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition-transform duration-200 group-hover:translate-x-1">
              {copy.readMore}
              <span className="text-amber-500">→</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function ArticlesList({ initialData }: { initialData?: Article[] }) {
  const params = useParams() as Record<string, string | undefined>;
  const locale = (params?.locale === 'es' ? 'es' : 'en') as 'en' | 'es';
  const copy = COPY[locale];
  
  const { data: articles, isLoading, isError, error, refetch, isFetching } = useArticles(locale, initialData);

  if (isLoading && !articles) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] animate-pulse">
              <div className="h-56 bg-gray-200"></div>
              <div className="space-y-4 p-6">
                <div className="h-4 w-40 rounded-full bg-gray-200"></div>
                <div className="h-7 rounded bg-gray-200"></div>
                <div className="h-7 w-5/6 rounded bg-gray-200"></div>
                <div className="h-4 rounded bg-gray-200"></div>
                <div className="h-4 w-2/3 rounded bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError && !articles) {
    console.error('Error loading articles:', error);
    
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto max-w-md rounded-[28px] border border-red-200 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(220,38,38,0.25)]">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">{copy.errorTitle}</h3>
            <p className="text-red-600 mb-4">
              {error?.message || copy.errorDescription}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isFetching ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {copy.retrying}
                  </span>
                ) : (
                  copy.retry
                )}
              </button>
              <p className="text-sm text-red-500">
                {isFetching ? copy.retryHintBusy : copy.retryHintIdle}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return <EmptyState locale={locale} />;
  }

  const [featuredArticle, ...remainingArticles] = articles;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8 lg:pb-24">
      <div className="mb-8 grid gap-5 lg:mb-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start lg:gap-6">
        <div>
          {featuredArticle ? <ArticleCard article={featuredArticle} locale={locale} copy={copy} featured /> : null}
        </div>
        <aside className="rounded-[28px] border border-black/5 bg-[#fff9ed] p-6 shadow-[0_24px_70px_-45px_rgba(217,119,6,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
            {locale === 'es' ? 'Archivo' : 'Archive'}
          </p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">{articles.length}</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {locale === 'es'
              ? 'Artículos técnicos, noticias del sector y avances de proyectos recopilados en una sola línea editorial.'
              : 'Technical articles, industry news, and project milestones collected in one editorial stream.'}
          </p>
          <div className="mt-6 space-y-3 border-t border-amber-100 pt-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                {locale === 'es' ? 'Última actualización' : 'Latest update'}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {featuredArticle ? formatArticleDate(featuredArticle.publishedAt, locale) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                {locale === 'es' ? 'Línea editorial' : 'Editorial line'}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {locale === 'es' ? 'Energía, industria y soluciones busbar' : 'Energy, industry, and busbar solutions'}
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        {remainingArticles.map((article: Article) => (
          <ArticleCard key={article.id} article={article} locale={locale} copy={copy} />
        ))}
      </div>
    </main>
  );
}

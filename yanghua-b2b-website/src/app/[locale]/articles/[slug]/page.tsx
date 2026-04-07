
import Link from "next/link";
import type { Metadata } from 'next';
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { CmsImage, getCmsMedia } from "@/components/custom/CmsImage";
import BlockRenderer from "@/components/BlockRenderer";
import { notFound } from 'next/navigation';
import { Article } from '@/lib/types';
import { draftMode } from 'next/headers';
import { getCachedArticleBySlug } from "@/lib/cached-api";
import { getArticleBySlugWithDrafts } from "@/lib/content-api";
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { getLocalizedPath } from '@/lib/url-localization';
import Breadcrumbs from '@/components/Breadcrumbs';
import RelatedArticles from '@/components/RelatedArticles';
import ReadNext from '@/components/ReadNext';
import type { ContentApiLocale } from "@/lib/content-api";
import { getAllArticles } from "@/lib/content-api";

// Generate static params for all articles
export async function generateStaticParams() {
  try {
    const locales = ['en', 'es'];
    const params = [];
    
    for (const locale of locales) {
      const result = await getAllArticles(locale as ContentApiLocale);
      if (result.data && Array.isArray(result.data)) {
        for (const article of result.data) {
          if (article.slug) {
            params.push({ locale, slug: article.slug });
          }
        }
      }
    }
    
    return params;
  } catch (error) {
    console.error('Error generating static params:', error);
    // Fallback to empty array to allow dynamic rendering
    return [];
  }
}

// 禁用动态参数，只允许静态生成的参数
export const dynamicParams = false;

// Fetch article data using cached API or draft API
async function getArticle(slug: string, locale: string, isDraftMode: boolean): Promise<Article | null> {
  try {
    if (isDraftMode) {
      return await getArticleBySlugWithDrafts(slug, locale as ContentApiLocale);
    }
    return await getCachedArticleBySlug(slug, locale as ContentApiLocale);
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}


interface PageProps {
  params: {
    slug: string;
    locale: string;
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug, locale } = params;
  const draft = await draftMode();
  const isSpanish = locale === 'es';
  
  // Fetch article data
  const article = await getArticle(slug, locale, draft.isEnabled);
  
  if (!article) {
    notFound();
    return; // This line should never be reached, but added for clarity
  }

  const articlePath = getLocalizedPath('articles-detail', locale as any, { slug });
  const articleUrl = generateCanonicalUrl(articlePath, locale as any);
  const homePath = getLocalizedPath('home', locale as any);
  const homeUrl = generateCanonicalUrl(homePath, locale as any);
  const listPath = getLocalizedPath('articles', locale as any);
  const listUrl = generateCanonicalUrl(listPath, locale as any);

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description || undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: article.author?.name ? { '@type': 'Person', name: article.author.name } : undefined,
    image: article.cover?.url ? getCmsMedia(article.cover.url) || undefined : undefined,
    mainEntityOfPage: articleUrl,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: locale === 'es' ? 'Inicio' : 'Home', item: homeUrl },
      { '@type': 'ListItem', position: 2, name: locale === 'es' ? 'Artículos' : 'Articles', item: listUrl },
      { '@type': 'ListItem', position: 3, name: article.title, item: articleUrl },
    ],
  };

  return (
    <main className="bg-[linear-gradient(180deg,#fff9ec_0%,#fffef8_18%,#ffffff_38%)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {draft.isEnabled && (
          <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-700 shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              <p className="font-medium">{isSpanish ? 'Modo de vista previa activo' : 'Preview Mode Active'}</p>
            </div>
            <p className="mt-1 text-sm">
              {isSpanish
                ? 'Estás viendo este artículo en modo de vista previa. Es posible que este contenido aún no esté publicado.'
                : 'You are viewing this article in preview mode. This content may not be published yet.'}
            </p>
          </div>
        )}

        <Breadcrumbs locale={locale} currentTitle={article.title} currentSlug={slug} />
        <Link
          href={`/${locale}${listPath === '/' ? '' : listPath}`}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-amber-200 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {isSpanish ? 'Volver a artículos' : 'Back to articles'}
        </Link>

        <article className="overflow-hidden rounded-[36px] border border-black/5 bg-white shadow-[0_30px_100px_-50px_rgba(15,23,42,0.35)]">
          <header className="border-b border-slate-100 px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              <span className="rounded-full bg-amber-100 px-3 py-1">{article.category?.name || (isSpanish ? 'Noticias' : 'News')}</span>
              <span className="text-slate-400">{new Date(article.publishedAt).toLocaleDateString()}</span>
              {article.bodySource ? (
                <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-500">
                  {article.bodySource === 'content'
                    ? (isSpanish ? 'Contenido completo' : 'Full content')
                    : article.bodySource === 'summary+english-fallback'
                      ? (isSpanish ? 'Resumen + apoyo en EN' : 'Summary + EN fallback')
                      : article.bodySource === 'summary'
                        ? (isSpanish ? 'Resumen editorial' : 'Editorial summary')
                        : (isSpanish ? 'Contenido de apoyo' : 'Fallback content')}
                </span>
              ) : null}
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
              {article.title}
            </h1>

            {article.description ? (
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                {article.description}
              </p>
            ) : null}

            <div className="mt-8 flex items-center text-slate-500">
              <div className="mr-4 h-12 w-12 overflow-hidden rounded-full ring-2 ring-amber-100">
                <CmsImage
                  src={article.author?.avatar?.url || "/placeholder.svg?height=48&width=48&query=avatar"}
                  alt={article.author?.avatar?.alternativeText || (isSpanish ? 'Avatar del autor' : 'Author avatar')}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{article.author?.name || (isSpanish ? 'Equipo editorial de Yanghua' : 'Unknown Author')}</p>
                <p className="text-sm text-slate-500">
                  {new Date(article.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </header>

          <div className="px-6 py-8 sm:px-10 lg:px-14">
            <div className="relative mb-8 h-[240px] w-full overflow-hidden rounded-[28px] bg-slate-100 sm:mb-10 sm:h-[360px] lg:h-[420px]">
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
              <CmsImage
                src={article.cover?.url || "/placeholder.svg?height=400&width=800&query=cover"}
                alt={article.cover?.alternativeText || (isSpanish ? 'Imagen principal del articulo' : 'Article cover image')}
                fill
                className="object-cover"
              />
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
              <div className="min-w-0">
                <div className="article-body rounded-[28px] bg-[#fffdf8] px-6 py-8 ring-1 ring-black/5 sm:px-8">
                  {article.blocks?.map((block: any) => (
                    <BlockRenderer key={block.id} block={block} />
                  ))}
                </div>
              </div>

              <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    {isSpanish ? 'Resumen' : 'Snapshot'}
                  </p>
                  <dl className="mt-5 space-y-4">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {isSpanish ? 'Publicado' : 'Published'}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-800">
                        {new Date(article.publishedAt).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {isSpanish ? 'Autor' : 'Author'}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-800">
                        {article.author?.name || (isSpanish ? 'Equipo editorial de Yanghua' : 'Yanghua Editorial Team')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {isSpanish ? 'Categoría' : 'Category'}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-800">
                        {article.category?.name || (isSpanish ? 'Noticias' : 'News')}
                      </dd>
                    </div>
                  </dl>
                </div>

                {article.description ? (
                  <div className="rounded-[28px] border border-amber-100 bg-amber-50/80 p-6 text-sm leading-7 text-amber-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                      {isSpanish ? 'Idea central' : 'Key takeaway'}
                    </p>
                    <p className="mt-4">{article.description}</p>
                  </div>
                ) : null}

                {article.sourceUrl ? (
                  <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {isSpanish ? 'Fuente original' : 'Original source'}
                    </p>
                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 font-medium text-slate-900 underline decoration-amber-300 underline-offset-4"
                    >
                      {isSpanish ? 'Ver fuente' : 'View source'}
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                ) : null}
              </aside>
            </div>
          </div>
        </article>

        {/* Internal linking components */}
        {/* Related Articles */}
        <div className="mt-12">
          <RelatedArticles locale={locale} currentArticle={article} />
        </div>

        {/* Read Next (previous/next within category) */}
        <div className="mt-8">
          <ReadNext locale={locale} currentArticle={article} />
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: { params: { slug: string; locale: string } }): Promise<Metadata> {
  const { slug, locale } = params;
  const draft = await draftMode();
  const article = await getArticle(slug, locale, draft.isEnabled);
  const title = article?.title ? `${article.title} | Yanghua` : 'Article | Yanghua';
  const description = article?.description || 'Technical insights and resources from Yanghua on flexible busbar systems and applications.';

  // 使用本地化URL生成器，确保西语翻译段作为规范路径
  const localizedPath = getLocalizedPath('articles-detail', locale as any, { slug });
  // 统一 canonical 生成逻辑：不强制生产域名，在开发环境/本地审计时优先使用本地域名或环境变量
  const canonical = generateCanonicalUrl(localizedPath, locale as any);

  // 优先基于内容仓库中的 localizations 构造跨语言 hreflang，确保不同语言的 slug 正确对应
  let languages: Record<string, string> | undefined = undefined;
  if (article?.localizations && Array.isArray(article.localizations)) {
    const locales = ['en', 'es'];
    languages = {};
    for (const l of locales) {
      // Find the localization entry for this locale
      let locSlug = slug;
      if (l === article.locale) {
        locSlug = article.slug;
      } else {
        const found = article.localizations.find(x => x.locale === l);
        if (found?.slug) {
          locSlug = found.slug;
        } else {
          // If not found, skip this locale or handle gracefully
          continue;
        }
      }
      
      const path = getLocalizedPath('articles-detail', l as any, { slug: locSlug });
      languages[l] = generateCanonicalUrl(path, l as any);
    }
    // x-default 指向英文
    const enLoc = article.locale === 'en'
      ? { slug: article.slug, locale: 'en' }
      : article.localizations.find(x => x.locale === 'en');
    
    if (enLoc?.slug) {
      const enPath = getLocalizedPath('articles-detail', 'en' as any, { slug: enLoc.slug });
      languages['x-default'] = generateCanonicalUrl(enPath, 'en' as any);
    }
  }

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: languages || generateHreflangAlternatesForMetadata(localizedPath, locale as any),
    },
  };
}

import Link from "next/link";
import { CmsImage } from "@/components/custom/CmsImage";
import { Article } from "@/lib/types";
import { getAllArticlesWithDrafts } from "@/lib/content-api";
import { getLocalizedPath } from "@/lib/url-localization";

interface RelatedArticlesProps {
  locale: string;
  currentArticle: Article;
  maxItems?: number;
}

// Server component: fetches related articles by same category and locale
export default async function RelatedArticles({ locale, currentArticle, maxItems = 4 }: RelatedArticlesProps) {
  const { data } = await getAllArticlesWithDrafts(locale as any);
  // Filter: same category, same locale, exclude current
  const sameCategory = data.filter(a => a.slug !== currentArticle.slug && a.category?.id === currentArticle.category?.id);
  const candidates = (sameCategory.length ? sameCategory : data.filter(a => a.slug !== currentArticle.slug))
    .slice(0, maxItems);

  if (!candidates.length) return null;

  const title = locale === 'es' ? 'Artículos relacionados' : 'Related Articles';

  return (
    <section className="rounded-[32px] border border-black/5 bg-white px-6 py-8 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.35)] sm:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
            {locale === 'es' ? 'Lectura continua' : 'Continue reading'}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {candidates.map((a) => {
          const detailPath = getLocalizedPath('articles-detail', locale as any, { slug: a.slug });
          return (
            <article
              key={a.id}
              className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/70 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:bg-white hover:shadow-[0_24px_70px_-40px_rgba(217,119,6,0.45)]"
            >
              <Link href={`/${locale}${detailPath === '/' ? '' : detailPath}`} className="block">
                <div className="relative h-44 w-full">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/30 via-black/0 to-transparent" />
                  <CmsImage
                    src={a.cover?.url || "/placeholder.svg?height=160&width=320&query=cover"}
                    alt={a.cover?.alternativeText || a.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-3 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {new Date(a.publishedAt).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US')}
                  </p>
                  <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-slate-900">{a.title}</h3>
                  <p className="line-clamp-3 text-sm leading-7 text-slate-600">
                    {a.description}
                  </p>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

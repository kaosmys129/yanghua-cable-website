import Link from "next/link";
import { Article } from "@/lib/types";
import { getAllArticlesWithDrafts } from "@/lib/content-api";
import { getLocalizedPath } from "@/lib/url-localization";

interface ReadNextProps {
  locale: string;
  currentArticle: Article;
}

// Server component: shows previous/next article within same category & locale
export default async function ReadNext({ locale, currentArticle }: ReadNextProps) {
  const { data } = await getAllArticlesWithDrafts(locale as any);
  const sameCategory = data.filter(a => a.category?.id === currentArticle.category?.id);
  const sorted = sameCategory.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
  const index = sorted.findIndex(a => a.slug === currentArticle.slug);

  const prev = index > 0 ? sorted[index - 1] : null;
  const next = index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null;

  if (!prev && !next) return null;

  const labels = locale === 'es'
    ? { prev: 'Artículo anterior', next: 'Siguiente artículo' }
    : { prev: 'Previous Article', next: 'Next Article' };

  return (
    <nav className="grid gap-4 md:grid-cols-2">
      <div className="flex-1">
        {prev && (
          <ReadNextLink locale={locale} article={prev} label={labels.prev} align="left" />
        )}
      </div>
      <div className="flex-1 text-right">
        {next && (
          <ReadNextLink locale={locale} article={next} label={labels.next} align="right" />
        )}
      </div>
    </nav>
  );
}

function ReadNextLink({ locale, article, label, align }: { locale: string; article: Article; label: string; align: 'left' | 'right' }) {
  const detailPath = getLocalizedPath('articles-detail', locale as any, { slug: article.slug });
  return (
    <Link
      href={`/${locale}${detailPath === '/' ? '' : detailPath}`}
      className={`block rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_24px_70px_-40px_rgba(217,119,6,0.4)] ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-semibold leading-snug text-slate-900">{article.title}</p>
    </Link>
  );
}

import Link from "next/link";
import { Article } from "@/lib/types";
import { getAllArticlesWithDrafts } from "@/lib/strapi-client";
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
    <nav className="mt-12 flex items-center justify-between gap-4 border-t pt-6">
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
    <div className={align === 'right' ? 'inline-block text-right' : 'inline-block text-left'}>
      <p className="text-sm text-gray-500">{label}</p>
      <Link href={`/${locale}${detailPath === '/' ? '' : detailPath}`} className="hover:underline font-medium">
        {article.title}
      </Link>
    </div>
  );
}
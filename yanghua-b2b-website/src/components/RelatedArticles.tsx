import Link from "next/link";
import { StrapiImage } from "@/components/custom/StrapiImage";
import { Article } from "@/lib/types";
import { getAllArticlesWithDrafts } from "@/lib/strapi-client";
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
    <section className="mt-12">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {candidates.map((a) => {
          const detailPath = getLocalizedPath('articles-detail', locale as any, { slug: a.slug });
          return (
            <article key={a.id} className="border rounded-lg overflow-hidden">
              <Link href={`/${locale}${detailPath === '/' ? '' : detailPath}`} className="block">
                <div className="relative h-40 w-full">
                  <StrapiImage
                    src={a.cover?.url || "/placeholder.svg?height=160&width=320&query=cover"}
                    alt={a.cover?.alternativeText || a.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium line-clamp-2">{a.title}</h3>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
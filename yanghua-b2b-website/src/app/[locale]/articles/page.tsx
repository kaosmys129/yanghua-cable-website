'use client';

import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { useArticles } from '@/lib/queries';
import { StrapiImage } from '@/components/custom/strapi-image';
import { Article } from '@/lib/types';
import ArticleErrorBoundary, { 
  ArticleListErrorFallback, 
  ArticleListSkeleton 
} from '@/components/ui/ArticleErrorBoundary';
import { useParams } from 'next/navigation';

function EmptyState() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#212529] mb-4">No Articles Found</h2>
        <p className="text-[#6c757d]">
          There are no articles available at the moment. Please check back later.
        </p>
      </div>
    </main>
  );
}

function ArticlesList() {
  const { locale } = useParams<{ locale: string }>();
  const { data: articles, isLoading, isError, error } = useArticles(locale);

  if (isLoading) {
    return <ArticleListSkeleton />;
  }

  if (isError) {
    console.error('Error loading articles:', error);
    return <ArticleListErrorFallback error={error} />;
  }

  if (!articles || articles.length === 0) {
    return <EmptyState />;
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#212529]">Latest Articles</h1>
        <p className="text-lg text-[#6c757d] max-w-2xl mx-auto">Stay updated with our latest insights, industry news, and expert perspectives</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article: Article) => (
          <Link key={article.id} href={`/${article.locale}/articles/${article.slug}`} className="group">
            <div className="card overflow-hidden transition-all duration-300 hover:scale-[1.02]">
              <div className="relative h-48 w-full">
                <StrapiImage
                  src={article.cover?.url || "/placeholder.svg?height=400&width=600&query=article"}
                  alt={article.cover?.alternativeText || article.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2">
                    <StrapiImage
                      src={article.author?.avatar?.url || "/placeholder.svg?height=50&width=50&query=avatar"}
                      alt={article.author?.name || "Author"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm text-gray-600">{article.author?.name || "Unknown Author"}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-sm text-gray-600">{formatDate(article.publishedAt)}</span>
                </div>
                <h2 className="text-xl font-semibold mb-3 text-[#212529] group-hover:text-[#fdb827] transition-colors duration-200 line-clamp-2">
                  {article.title}
                </h2>
                <p className="text-[#6c757d] line-clamp-3 mb-4 leading-relaxed">{article.description}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-block bg-[#f8f9fa] text-[#212529] rounded-full px-3 py-1 text-sm font-medium">
                    {article.category?.name || "Uncategorized"}
                  </span>
                  <span className="text-[#fdb827] text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
                    Read More →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <ArticleErrorBoundary FallbackComponent={ArticleListErrorFallback}>
      <ArticlesList />
    </ArticleErrorBoundary>
  );
}

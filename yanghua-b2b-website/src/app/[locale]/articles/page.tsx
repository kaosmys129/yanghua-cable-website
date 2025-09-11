import Link from "next/link"
import { getAllArticles } from "@/lib/strapi-client"
import { formatDate } from "@/lib/utils"
import { Suspense } from "react"
import { Article } from "@/lib/types"

import { StrapiImage } from "@/components/custom/strapi-image"

function LoadingSkeleton() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="h-12 bg-gray-200 rounded-lg w-96 mx-auto mb-4 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded-lg w-2/3 mx-auto animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="h-48 bg-gray-200 animate-pulse"></div>
            <div className="p-6">
              <div className="flex items-center mb-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse mr-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded mb-3 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="flex justify-between">
                <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function ErrorState({ retry }: { retry?: () => void }) {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#212529] mb-2">Unable to Load Articles</h2>
          <p className="text-[#6c757d] mb-6">We're having trouble loading the articles. Please try again later.</p>
          {retry && (
            <button 
              onClick={retry}
              className="btn-primary"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#212529]">Latest Articles</h1>
        <p className="text-lg text-[#6c757d] max-w-2xl mx-auto">Stay updated with our latest insights, industry news, and expert perspectives</p>
      </div>
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-4 bg-[#f8f9fa] rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-[#6c757d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#212529] mb-2">No Articles Yet</h2>
        <p className="text-[#6c757d]">Check back soon for our latest articles and insights.</p>
      </div>
    </main>
  );
}

export default async function Home() {
  try {
    const articles = await getAllArticles();
    console.log("All articles data:", JSON.stringify(articles, null, 2));
    
    if (!articles?.data || articles.data.length === 0) {
      return <EmptyState />;
    }

    return (
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#212529]">Latest Articles</h1>
          <p className="text-lg text-[#6c757d] max-w-2xl mx-auto">Stay updated with our latest insights, industry news, and expert perspectives</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.data.map((article) => (
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
  } catch (error) {
    console.error('Error loading articles:', error);
    return <ErrorState />;
  }
}

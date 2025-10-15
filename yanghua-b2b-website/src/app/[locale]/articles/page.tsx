'use client';

import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { useArticles } from '@/lib/queries';
import { StrapiImage } from "@/components/custom/StrapiImage";
import { Article } from '@/lib/types';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { startNetworkDebugging, getNetworkRequests, compareNetworkScenarios } from '@/lib/network-debug';

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
  const { data: articles, isLoading, isError, error, refetch, isFetching } = useArticles(locale);

  // Temporarily disabled network debugging to fix console errors
  useEffect(() => {
    // startNetworkDebugging(); // Disabled temporarily
    console.log('[ArticlesList] Component mounted for locale:', locale);
    console.log('[ArticlesList] Current URL:', window.location.href);

    // // Log requests after a delay to capture the initial load
    // const timer = setTimeout(() => {
    //   const requests = getNetworkRequests();
    //   console.log('[NetworkDebug] Captured requests after initial load:', requests);
    //   
    //   if (requests.length > 0) {
    //     const comparison = compareNetworkScenarios();
    //     console.log('[NetworkDebug] Scenario comparison:', comparison);
    //   }
    // }, 3000);

    // return () => {
    //   clearTimeout(timer);
    // };
  }, [locale]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-300"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    console.error('Error loading articles:', error);
    
    // // Log network requests when error occurs - disabled temporarily
    // const requests = getNetworkRequests();
    // const comparison = compareNetworkScenarios();
    // console.error('[NetworkDebug] Error occurred, captured requests:', requests);
    // console.error('[NetworkDebug] Scenario comparison at error time:', comparison);
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Articles</h3>
            <p className="text-red-600 mb-4">
              {error?.message || 'Unable to fetch data. Please try again later.'}
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
                    Retrying...
                  </span>
                ) : (
                  'Try Again'
                )}
              </button>
              <p className="text-sm text-red-500">
                {isFetching ? 'Retrying automatically...' : 'Will auto-retry in a few seconds'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return <EmptyState />;
  }

  return (
    <main className="container mx-auto px-4 py-12">
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

export default function ArticlesPage({ params }: { params: { locale: string } }) {
  // 移除双重useArticles调用，让ArticlesList组件处理数据获取
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#212529]">Latest Articles</h1>
        <p className="text-lg text-[#6c757d] max-w-2xl mx-auto">Stay updated with our latest insights, industry news, and expert perspectives</p>
      </div>
      
      {/* 让ArticlesList组件单独处理数据获取和状态管理 */}
      <ArticlesList />
    </main>
  );
}

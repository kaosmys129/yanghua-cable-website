'use client';

import React, { useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { logApiError } from '@/lib/error-logger';

interface WordPressPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  modified: string;
  status: string;
  link: string;
  author: number;
  categories: number[];
  tags: number[];
  featured_media?: number;
  _embedded?: any;
}

interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
}

interface WPApiResponse {
  posts: WordPressPost[];
  categories: WordPressCategory[];
  meta: { total: number; totalPages: number; page: number; perPage: number };
}

const PER_PAGE = 9;

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getFeaturedImageUrl(post: WordPressPost) {
  const media = post?._embedded?.['wp:featuredmedia'];
  if (Array.isArray(media) && media.length > 0) {
    const sizes = media[0]?.media_details?.sizes;
    return (
      sizes?.large?.source_url ||
      sizes?.medium_large?.source_url ||
      media[0]?.source_url ||
      ''
    );
  }
  return '';
}

function getAuthorInfo(post: WordPressPost) {
  const authors = post?._embedded?.author;
  if (Array.isArray(authors) && authors.length > 0) {
    const a = authors[0];
    return {
      name: a?.name || 'Unknown Author',
      avatar: a?.avatar_urls?.['48'] || a?.avatar_urls?.['96'] || '',
    };
  }
  return { name: 'Unknown Author', avatar: '' };
}

async function fetchPage(pageParam: number): Promise<WPApiResponse> {
  const url = `/api/wordpress/posts?page=${pageParam}&per_page=${PER_PAGE}&type=yanghua_article`;
  const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!res.ok) {
    const err = new Error(`Failed to fetch WordPress data: ${res.status} ${res.statusText}`);
    logApiError(url, 'GET', res.status, err);
    throw err;
  }
  return res.json();
}

export default function WordPressDemoClient() {
  const {
    data,
    error,
    isLoading,
    isError,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['wp-posts', PER_PAGE],
    queryFn: ({ pageParam = 1 }) => fetchPage(pageParam),
    getNextPageParam: (lastPage) => {
      const p = lastPage?.meta;
      if (!p) return undefined;
      return p.page < p.totalPages ? p.page + 1 : undefined;
    },
    staleTime: 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
  });

  const { ref, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts: WordPressPost[] = useMemo(() => {
    return data?.pages?.flatMap((p: WPApiResponse) => p.posts) || [];
  }, [data]);

  const categories: WordPressCategory[] = useMemo(() => {
    return (data?.pages?.[0]?.categories || []) as WordPressCategory[];
  }, [data]);

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((cat: WordPressCategory) => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#212529]">Latest Articles</h1>
          <p className="text-lg text-[#6c757d] max-w-2xl mx-auto">Stay updated with our latest insights, industry news, and expert perspectives</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-300" />
              <div className="p-6">
                <div className="h-6 bg-gray-300 rounded mb-2" />
                <div className="h-4 bg-gray-300 rounded mb-2" />
                <div className="h-4 bg-gray-300 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
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
            <p className="text-red-600 mb-4">{(error as Error)?.message || 'Network error'}</p>
            <div className="space-y-2">
              <button
                onClick={() => refetch()}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <p className="text-sm text-red-500">You can retry fetching posts.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#212529]">Latest Articles</h1>
        <p className="text-lg text-[#6c757d] max-w-2xl mx-auto">Stay updated with our latest insights, industry news, and expert perspectives</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {allPosts.map((post: WordPressPost) => {
          const { name: authorName, avatar: authorAvatar } = getAuthorInfo(post);
          const coverUrl = getFeaturedImageUrl(post) || "/placeholder.svg?height=400&width=600&query=article";

          return (
            <a key={post.id} href={post.link} target="_blank" rel="noopener noreferrer" className="group">
              <div className="card overflow-hidden transition-all duration-300 hover:scale-[1.02]">
                <div className="relative h-48 w-full">
                  {/* 使用 <img> 避免 Next Image 域名限制 */}
                  <img
                    src={coverUrl}
                    alt={post.title?.rendered?.replace(/<[^>]+>/g, '') || 'Article'}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2">
                      {authorAvatar ? (
                        <img src={authorAvatar} alt={authorName} className="object-cover w-full h-full" />
                      ) : (
                        <div className="bg-gray-200 w-full h-full" />
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{authorName}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{formatDate(post.date)}</span>
                  </div>
                  <h2 className="text-xl font-semibold mb-3 text-[#212529] group-hover:text-[#fdb827] transition-colors duration-200 line-clamp-2">
                    <span dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                  </h2>
                  <p className="text-[#6c757d] line-clamp-3 mb-4 leading-relaxed">
                    <span dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="inline-block bg-[#f8f9fa] text-[#212529] rounded-full px-3 py-1 text-sm font-medium">
                      {post.categories?.length ? getCategoryName(post.categories[0]) : 'Uncategorized'}
                    </span>
                    <span className="text-[#fdb827] text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
                      Read More →
                    </span>
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* 无限滚动触发器 */}
      <div ref={ref} className="h-10" />

      {/* 加载更多状态与按钮回退 */}
      <div className="flex items-center justify-center mt-6">
        {isFetchingNextPage ? (
          <span className="text-sm text-gray-600">Loading more…</span>
        ) : hasNextPage ? (
          <button
            onClick={() => fetchNextPage()}
            className="px-4 py-2 bg-[#fdb827] text-white rounded hover:bg-[#e39f13]"
          >
            Load More
          </button>
        ) : (
          <span className="text-sm text-gray-500">No more articles</span>
        )}
      </div>
    </main>
  );
}
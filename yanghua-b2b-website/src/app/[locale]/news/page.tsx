import { Suspense } from 'react';
import NewsPageClient from './NewsPageClient';
import NewsPageFallback from './NewsPageFallback';

// Static fallback data
const staticNewsData = {
  regularArticles: [],
  categories: ['Industry News', 'Product Updates', 'Company News'],
  tags: ['cables', 'technology', 'manufacturing']
};

export default function NewsPage() {
  return (
    <Suspense fallback={<NewsPageFallback />}>
      <NewsPageClient 
        regularArticles={staticNewsData.regularArticles}
        categories={staticNewsData.categories}
        tags={staticNewsData.tags}
      />
    </Suspense>
  );
}
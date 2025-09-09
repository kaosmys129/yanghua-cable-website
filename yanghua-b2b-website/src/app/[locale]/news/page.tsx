import fs from 'fs';
import path from 'path';
import NewsPageClient from './NewsPageClient';
import { getNewsArticles } from './NewsPageServer';

import { NewsArticle } from '@/types/news';

export default function NewsPage() {
  const articles = getNewsArticles();
  const featuredArticle = articles.find(article => article.featured);
  const regularArticles = articles.filter(article => !article.featured);

  const categories = ['All', 'Company News', 'Industry Trends', 'Technical Articles'];
  const tags = ['New Product Launch', 'Technological Innovation', 'New Energy', 'Data Center', 'Policy Interpretation'];

  return (
    <NewsPageClient 
      featuredArticle={featuredArticle}
      regularArticles={regularArticles}
      categories={categories}
      tags={tags}
    />
  );
}
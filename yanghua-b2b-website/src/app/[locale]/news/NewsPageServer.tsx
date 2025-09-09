import fs from 'fs';
import path from 'path';
import { NewsArticle } from '@/types/news';

export const getNewsArticles = (): NewsArticle[] => {
  try {
    // Use fs module to read JSON data
    const jsonPath = path.join(process.cwd(), 'public', 'data', 'yanghuasti_news_formatted.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const newsData = JSON.parse(jsonData);
    
    // Convert data format to match NewsArticle interface
    return newsData.news.map((item: any, index: number) => ({
      id: (index + 1).toString(),
      title: item.title || 'Untitled Article',
      excerpt: item.summary || item.title || '',
      content: item.content || item.summary || '',
      category: 'News',
      tags: item.tags || [],
      author: item.author || 'Yanghua Tech',
      date: item.date || '2024-01-01',
      readTime: '3 min',
      image: item.image || '/images/placeholder-image.jpg',
      featured: index === 0
    }));
  } catch (error) {
    console.error('Error reading news data:', error);
    // Return empty array or default data
    return [];
  }
};
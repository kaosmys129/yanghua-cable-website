import { compiler } from 'markdown-to-jsx';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  date: string;
  readTime: string;
  image: string;
  summary: string;
}

export async function getArticle(id: string): Promise<NewsArticle> {
  try {
    // Use dynamic import for fs and path to work in Next.js server environment
    const fs = await import('fs');
    const path = await import('path');
    
    const jsonPath = path.join(process.cwd(), 'public', 'data', 'yanghuasti_news_formatted.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const newsData = JSON.parse(jsonData);
    
    // Ensure we have the news array
    if (!newsData.news || !Array.isArray(newsData.news)) {
      throw new Error('Invalid news data structure');
    }
    
    // Get specific article by ID - handle both string and numeric IDs
    const articleIndex = parseInt(id) - 1;
    if (isNaN(articleIndex) || articleIndex < 0 || articleIndex >= newsData.news.length) {
      console.warn(`Article with ID ${id} not found (index: ${articleIndex}, total: ${newsData.news.length})`);
      return {
        id: id,
        title: 'Article Not Found',
        content: '<p>The requested article could not be found.</p>',
        category: 'News',
        tags: [],
        author: 'Yanghua Tech',
        date: '2024-01-01',
        readTime: '1 min',
        image: '/images/no-image-available.webp',
        summary: 'The requested article could not be found.'
      };
    }
    
    const articleItem = newsData.news[articleIndex];
    
    // Convert Markdown content to HTML
    let htmlContent = '';
    if (articleItem.content && articleItem.content.trim()) {
      try {
        const contentWithBreaks = articleItem.content.replace(/\n/g, '  \n');
        const reactElement = compiler(contentWithBreaks);
        
        // Handle markdown compilation safely
        if (reactElement) {
          htmlContent = String(reactElement);
        } else {
          htmlContent = `<p>${articleItem.content}</p>`;
        }
      } catch (compileError) {
        console.warn('Error compiling markdown, using raw content:', compileError);
        htmlContent = `<p>${articleItem.content}</p>`;
      }
    } else if (articleItem.summary && articleItem.summary.trim()) {
      htmlContent = `<p>${articleItem.summary}</p>`;
    } else {
      htmlContent = '<p>Content not available.</p>';
    }
    
    // Convert data format to match NewsArticle interface
    return {
      id: id,
      title: articleItem.title || 'Untitled Article',
      content: htmlContent,
      category: 'News',
      tags: [],
      author: articleItem.author || 'Yanghua Tech',
      date: articleItem.date || '2024-01-01',
      readTime: '3 min',
      image: articleItem.image || '/images/no-image-available.webp',
      summary: articleItem.summary || articleItem.title || ''
    };
  } catch (error) {
    console.error('Error reading news data:', error);
    return {
      id: id,
      title: `Error Loading Article ${id}`,
      content: `<p>There was an error loading the article: ${error instanceof Error ? error.message : 'Unknown error'}</p>`,
      category: 'News',
      tags: [],
      author: 'Yanghua Tech',
      date: '2024-01-01',
      readTime: '1 min',
      image: '/images/no-image-available.webp',
      summary: 'There was an error loading the article.'
    };
  }
}
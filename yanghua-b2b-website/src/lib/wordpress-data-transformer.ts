/**
 * WordPress 到 Strapi 数据格式转换器
 * 将 WordPress REST API 响应转换为 Strapi 兼容的数据格式
 * 确保前端组件无需修改即可使用 WordPress 数据
 */

import { 
  WordPressArticle, 
  WordPressMedia, 
  WordPressUser, 
  WordPressCategory,
  WordPressACFBlock,
  WordPressRichTextBlock,
  WordPressQuoteBlock,
  WordPressMediaBlock,
  WordPressSliderBlock
} from './wordpress-types';

import { 
  Article, 
  Block, 
  RichTextBlock, 
  QuoteBlock, 
  MediaBlock, 
  SliderBlock 
} from './types';

import { logError } from './error-logger';

/**
 * 转换 WordPress 媒体对象为 Strapi 格式
 */
export function transformWordPressMedia(wpMedia: WordPressMedia | number | null): any {
  if (!wpMedia || typeof wpMedia === 'number') {
    return {
      id: typeof wpMedia === 'number' ? wpMedia : 0,
      documentId: '',
      name: '',
      alternativeText: '',
      url: '',
      width: 0,
      height: 0
    };
  }

  return {
    id: wpMedia.id,
    documentId: wpMedia.slug || wpMedia.id.toString(),
    name: wpMedia.title?.rendered || wpMedia.slug || '',
    alternativeText: wpMedia.alt_text || wpMedia.title?.rendered || '',
    url: wpMedia.source_url || '',
    width: wpMedia.media_details?.width || 0,
    height: wpMedia.media_details?.height || 0
  };
}

/**
 * 转换 WordPress 用户对象为 Strapi 作者格式
 */
export function transformWordPressUser(wpUser: WordPressUser | number | null): any {
  if (!wpUser || typeof wpUser === 'number') {
    return {
      id: typeof wpUser === 'number' ? wpUser : 0,
      documentId: '',
      name: 'Unknown Author',
      email: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      avatar: {
        id: 0,
        documentId: '',
        url: '',
        alternativeText: '',
        width: 0,
        height: 0
      }
    };
  }

  // 获取最大尺寸的头像
  const avatarUrl = wpUser.avatar_urls ? 
    wpUser.avatar_urls['96'] || wpUser.avatar_urls['48'] || wpUser.avatar_urls['24'] || '' : '';

  return {
    id: wpUser.id,
    documentId: wpUser.slug || wpUser.id.toString(),
    name: wpUser.name || 'Unknown Author',
    email: wpUser.acf?.email || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    avatar: wpUser.acf?.avatar ? 
      transformWordPressMedia(wpUser.acf.avatar) : 
      {
        id: 0,
        documentId: '',
        url: avatarUrl,
        alternativeText: wpUser.name || '',
        width: 96,
        height: 96
      }
  };
}

/**
 * 转换 WordPress 分类对象为 Strapi 格式
 */
export function transformWordPressCategory(wpCategory: WordPressCategory | number | null): any {
  if (!wpCategory || typeof wpCategory === 'number') {
    return {
      id: typeof wpCategory === 'number' ? wpCategory : 0,
      documentId: '',
      name: 'Uncategorized',
      slug: 'uncategorized'
    };
  }

  return {
    id: wpCategory.id,
    documentId: wpCategory.slug || wpCategory.id.toString(),
    name: wpCategory.name || 'Uncategorized',
    slug: wpCategory.slug || 'uncategorized'
  };
}

/**
 * 转换 WordPress ACF 内容块为 Strapi 格式
 */
export function transformWordPressBlock(wpBlock: WordPressACFBlock): Block | null {
  try {
    switch (wpBlock.acf_fc_layout) {
      case 'rich_text': {
        const richTextBlock = wpBlock as WordPressRichTextBlock;
        return {
          __component: 'shared.rich-text',
          id: Math.floor(Math.random() * 1000000), // WordPress ACF 不提供块 ID，生成随机 ID
          body: richTextBlock.body || ''
        } as RichTextBlock;
      }

      case 'quote': {
        const quoteBlock = wpBlock as WordPressQuoteBlock;
        return {
          __component: 'shared.quote',
          id: Math.floor(Math.random() * 1000000),
          title: quoteBlock.title || '',
          body: quoteBlock.body || ''
        } as QuoteBlock;
      }

      case 'media': {
        const mediaBlock = wpBlock as WordPressMediaBlock;
        return {
          __component: 'shared.media',
          id: Math.floor(Math.random() * 1000000),
          file: transformWordPressMedia(mediaBlock.file)
        } as MediaBlock;
      }

      case 'slider': {
        const sliderBlock = wpBlock as WordPressSliderBlock;
        return {
          __component: 'shared.slider',
          id: Math.floor(Math.random() * 1000000),
          files: (sliderBlock.files || []).map(file => transformWordPressMedia(file))
        } as SliderBlock;
      }

      default:
        console.warn(`[WordPressTransformer] Unknown block type: ${wpBlock.acf_fc_layout}`);
        return null;
    }
  } catch (error) {
    logError(`transformWordPressBlock - ${wpBlock.acf_fc_layout}`, error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * 转换 WordPress 文章对象为 Strapi Article 格式
 */
export function transformWordPressArticle(
  wpArticle: WordPressArticle,
  embeddedData?: {
    author?: WordPressUser;
    featuredMedia?: WordPressMedia;
    categories?: WordPressCategory[];
  }
): Article {
  try {
    // 处理嵌入数据或 ACF 数据
    const author = embeddedData?.author || 
      (wpArticle._embedded?.author?.[0]) || 
      wpArticle.acf?.article_author || 
      wpArticle.author;

    const featuredMedia = embeddedData?.featuredMedia || 
      (wpArticle._embedded?.['wp:featuredmedia']?.[0]) || 
      wpArticle.acf?.article_cover || 
      wpArticle.featured_media;

    const categoryData = embeddedData?.categories || 
      (wpArticle._embedded?.['wp:term']?.[0]) || 
      wpArticle.acf?.article_category;
    
    // 处理分类数据，如果是数组则取第一个
    const categories = Array.isArray(categoryData) ? categoryData[0] : categoryData || null;

    // 转换内容块
    const blocks: Block[] = [];
    if (wpArticle.acf?.article_blocks) {
      wpArticle.acf.article_blocks.forEach(wpBlock => {
        const transformedBlock = transformWordPressBlock(wpBlock);
        if (transformedBlock) {
          blocks.push(transformedBlock);
        }
      });
    }

    // 如果没有 ACF 块，使用 WordPress 内容作为富文本块
    if (blocks.length === 0 && wpArticle.content?.rendered) {
      blocks.push({
        __component: 'shared.rich-text',
        id: 1,
        body: wpArticle.content.rendered
      } as RichTextBlock);
    }

    return {
      id: wpArticle.id,
      documentId: wpArticle.acf?.document_id || wpArticle.slug || wpArticle.id.toString(),
      title: wpArticle.title?.rendered || '',
      description: wpArticle.acf?.article_description || 
        (wpArticle.excerpt?.rendered ? wpArticle.excerpt.rendered.replace(/<[^>]*>/g, '') : ''),
      slug: wpArticle.slug,
      createdAt: wpArticle.date || new Date().toISOString(),
      updatedAt: wpArticle.modified || new Date().toISOString(),
      publishedAt: wpArticle.status === 'publish' ? 
        (wpArticle.date || new Date().toISOString()) : '',
      locale: wpArticle.acf?.article_locale || 'en',
      cover: transformWordPressMedia(featuredMedia),
      category: transformWordPressCategory(categories),
      author: transformWordPressUser(author),
      blocks
    };
  } catch (error) {
    logError(`transformWordPressArticle failed for article ${wpArticle.id}`, error instanceof Error ? error : new Error(String(error)));
    return createEmptyArticle(wpArticle.id);
  }
}

/**
 * 批量转换 WordPress 文章数组
 */
export function transformWordPressArticles(wpArticles: WordPressArticle[]): Article[] {
  return wpArticles.map(wpArticle => transformWordPressArticle(wpArticle));
}

/**
 * 规范化 WordPress API 响应为 Strapi 格式
 */
export function normalizeWordPressResponse<T>(
  data: T | T[], 
  transformer?: (item: any) => any
): { data: T[] } {
  try {
    const normalizedData = Array.isArray(data) ? data : [data];
    
    if (transformer) {
      return {
        data: normalizedData.map(transformer)
      };
    }
    
    return {
      data: normalizedData
    };
  } catch (error) {
    logError(`normalizeWordPressResponse failed`, error instanceof Error ? error : new Error(String(error)));
    return { data: [] };
  }
}

/**
 * 计算 WordPress 响应的字节大小
 */
export function computeWordPressPayloadSize(obj: any): number {
  try {
    return JSON.stringify(obj).length;
  } catch (error) {
    logError(`computeWordPressPayloadSize failed`, error instanceof Error ? error : new Error(String(error)));
    return 0;
  }
}

/**
 * 验证转换后的数据完整性
 */
export function validateTransformedArticle(article: Article): boolean {
  try {
    return !!(
      article.id &&
      article.title &&
      article.slug &&
      article.createdAt &&
      article.locale &&
      Array.isArray(article.blocks)
    );
  } catch (error) {
    logError(`validateTransformedArticle failed for article ${article.id}`, error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * 创建默认的空文章对象
 */
export function createEmptyArticle(id: number = 0): Article {
  return {
    id,
    documentId: id.toString(),
    title: '',
    description: '',
    slug: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: '',
    locale: 'en',
    cover: transformWordPressMedia(null),
    category: transformWordPressCategory(null),
    author: transformWordPressUser(null),
    blocks: []
  };
}
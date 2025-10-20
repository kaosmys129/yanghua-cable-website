/**
 * 内容提取器
 * 用于从HTML页面中提取关键SEO元素
 */

import { JSDOM } from 'jsdom';
import { PageContent } from './KeywordAnalyzer';

/**
 * 内容提取器类
 */
export class ContentExtractor {
  /**
   * 从HTML中提取页面内容
   */
  static extractPageContent(url: string, html: string): PageContent {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // 提取标题
    const title = this.extractTitle(document);

    // 提取Meta描述
    const metaDescription = this.extractMetaDescription(document);

    // 提取标题标签
    const headings = this.extractHeadings(document);

    // 提取正文内容
    const bodyText = this.extractBodyText(document);

    // 计算字数
    const wordCount = this.countWords(bodyText);

    return {
      url,
      title,
      metaDescription,
      headings,
      bodyText,
      wordCount
    };
  }

  /**
   * 提取页面标题
   */
  private static extractTitle(document: Document): string {
    const titleElement = document.querySelector('title');
    return titleElement ? titleElement.textContent?.trim() || '' : '';
  }

  /**
   * 提取Meta描述
   */
  private static extractMetaDescription(document: Document): string {
    const metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    return metaDesc ? metaDesc.content?.trim() || '' : '';
  }

  /**
   * 提取所有标题标签
   */
  private static extractHeadings(document: Document): PageContent['headings'] {
    const headings: PageContent['headings'] = {
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: []
    };

    // 提取各级标题
    for (let i = 1; i <= 6; i++) {
      const elements = document.querySelectorAll(`h${i}`);
      const key = `h${i}` as keyof PageContent['headings'];
      
      elements.forEach(element => {
        const text = element.textContent?.trim();
        if (text) {
          headings[key].push(text);
        }
      });
    }

    return headings;
  }

  /**
   * 提取正文内容
   */
  private static extractBodyText(document: Document): string {
    // 移除不需要的元素
    const elementsToRemove = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      'aside',
      '.navigation',
      '.menu',
      '.sidebar',
      '.ads',
      '.advertisement',
      '.social-media',
      '.breadcrumb'
    ];

    // 克隆文档以避免修改原始DOM
    const clonedDocument = document.cloneNode(true) as Document;

    // 移除不需要的元素
    elementsToRemove.forEach(selector => {
      const elements = clonedDocument.querySelectorAll(selector);
      elements.forEach(element => element.remove());
    });

    // 获取主要内容区域
    const mainContentSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      '.content',
      '.post-content',
      '.article-content',
      '.page-content',
      'article',
      '.entry-content'
    ];

    let mainContent: Element | null = null;

    // 尝试找到主要内容区域
    for (const selector of mainContentSelectors) {
      mainContent = clonedDocument.querySelector(selector);
      if (mainContent) break;
    }

    // 如果没有找到主要内容区域，使用body
    if (!mainContent) {
      mainContent = clonedDocument.body;
    }

    if (!mainContent) {
      return '';
    }

    // 提取文本内容
    let text = mainContent.textContent || '';

    // 清理文本
    text = this.cleanText(text);

    return text;
  }

  /**
   * 清理文本内容
   */
  private static cleanText(text: string): string {
    return text
      // 移除多余的空白字符
      .replace(/\s+/g, ' ')
      // 移除行首行尾空白
      .trim()
      // 移除特殊字符（保留基本标点）
      .replace(/[^\w\s\u4e00-\u9fff.,!?;:()\-"']/g, ' ')
      // 再次清理多余空格
      .replace(/\s+/g, ' ');
  }

  /**
   * 计算字数
   */
  private static countWords(text: string): number {
    if (!text.trim()) return 0;

    // 分别处理中文和英文
    const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
    const englishWords = text
      .replace(/[\u4e00-\u9fff]/g, ' ') // 移除中文字符
      .match(/\b\w+\b/g) || [];

    return chineseChars.length + englishWords.length;
  }

  /**
   * 提取页面的所有链接
   */
  static extractLinks(document: Document, baseUrl: string): string[] {
    const links: string[] = [];
    const linkElements = document.querySelectorAll('a[href]');

    linkElements.forEach(element => {
      const href = element.getAttribute('href');
      if (href) {
        try {
          const url = new URL(href, baseUrl);
          // 只包含同域名的链接
          if (url.hostname === new URL(baseUrl).hostname) {
            links.push(url.href);
          }
        } catch (error) {
          // 忽略无效的URL
        }
      }
    });

    // 去重并排序
    return [...new Set(links)].sort();
  }

  /**
   * 提取页面的图片信息
   */
  static extractImages(document: Document): Array<{
    src: string;
    alt: string;
    title?: string;
  }> {
    const images: Array<{ src: string; alt: string; title?: string; }> = [];
    const imgElements = document.querySelectorAll('img[src]');

    imgElements.forEach(element => {
      const src = element.getAttribute('src');
      const alt = element.getAttribute('alt') || '';
      const title = element.getAttribute('title');

      if (src) {
        images.push({
          src,
          alt,
          ...(title && { title })
        });
      }
    });

    return images;
  }

  /**
   * 检查页面是否有结构化数据
   */
  static extractStructuredData(document: Document): any[] {
    const structuredData: any[] = [];

    // JSON-LD
    const jsonLdElements = document.querySelectorAll('script[type="application/ld+json"]');
    jsonLdElements.forEach(element => {
      try {
        const data = JSON.parse(element.textContent || '');
        structuredData.push(data);
      } catch (error) {
        // 忽略解析错误
      }
    });

    // Microdata (简单提取)
    const microdataElements = document.querySelectorAll('[itemscope]');
    microdataElements.forEach(element => {
      const itemType = element.getAttribute('itemtype');
      if (itemType) {
        structuredData.push({
          '@type': itemType,
          '@context': 'microdata'
        });
      }
    });

    return structuredData;
  }

  /**
   * 提取页面的语言信息
   */
  static extractLanguageInfo(document: Document): {
    htmlLang?: string;
    hreflangLinks: Array<{ href: string; hreflang: string; }>;
  } {
    const htmlLang = document.documentElement.getAttribute('lang') || undefined;
    
    const hreflangLinks: Array<{ href: string; hreflang: string; }> = [];
    const hreflangElements = document.querySelectorAll('link[hreflang]');
    
    hreflangElements.forEach(element => {
      const href = element.getAttribute('href');
      const hreflang = element.getAttribute('hreflang');
      
      if (href && hreflang) {
        hreflangLinks.push({ href, hreflang });
      }
    });

    return {
      htmlLang,
      hreflangLinks
    };
  }
}
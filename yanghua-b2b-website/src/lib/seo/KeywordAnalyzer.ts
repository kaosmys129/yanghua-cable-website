/**
 * 网站关键词检测测试模块
 * 用于全面分析关键词在核心位置的布局情况
 */

import { JSDOM } from 'jsdom';

/**
 * 关键词类型枚举
 */
export enum KeywordType {
  CORE = 'core',        // 核心关键词
  LONG_TAIL = 'long_tail' // 长尾关键词
}

/**
 * 关键词配置接口
 */
export interface KeywordConfig {
  keyword: string;
  type: KeywordType;
  targetDensity?: number; // 目标密度百分比
  priority: number;       // 优先级 1-10
}

/**
 * 页面内容结构
 */
export interface PageContent {
  url: string;
  title: string;
  metaDescription: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
  };
  bodyText: string;
  wordCount: number;
}

/**
 * 关键词分析结果
 */
export interface KeywordAnalysis {
  keyword: string;
  type: KeywordType;
  positions: {
    title: {
      found: boolean;
      count: number;
      positions: number[];
    };
    metaDescription: {
      found: boolean;
      count: number;
      positions: number[];
    };
    headings: {
      h1: { found: boolean; count: number; };
      h2: { found: boolean; count: number; };
      h3: { found: boolean; count: number; };
      h4: { found: boolean; count: number; };
      h5: { found: boolean; count: number; };
      h6: { found: boolean; count: number; };
    };
    bodyText: {
      found: boolean;
      count: number;
      density: number; // 密度百分比
      positions: number[];
    };
  };
  seoScore: number; // SEO评分 0-100
  issues: string[]; // 发现的问题
  suggestions: string[]; // 优化建议
}

/**
 * 页面分析结果
 */
export interface PageAnalysisResult {
  url: string;
  content: PageContent;
  keywordAnalyses: KeywordAnalysis[];
  overallScore: number;
  issues: string[];
  suggestions: string[];
  timestamp: Date;
}

/**
 * 全站分析报告
 */
export interface SiteAnalysisReport {
  siteUrl: string;
  analyzedPages: number;
  totalKeywords: number;
  pageResults: PageAnalysisResult[];
  summary: {
    averageScore: number;
    topPerformingPages: string[];
    poorPerformingPages: string[];
    commonIssues: { issue: string; frequency: number; }[];
    keywordCoverage: { keyword: string; coverage: number; }[];
  };
  recommendations: string[];
  generatedAt: Date;
}

/**
 * 关键词分析器核心类
 */
export class KeywordAnalyzer {
  private keywords: KeywordConfig[] = [];
  private baseUrl: string = '';
  private maxPages: number = 50;
  private crawlDelay: number = 1000; // 爬取延迟（毫秒）

  constructor(baseUrl: string, keywords: KeywordConfig[] = []) {
    this.baseUrl = baseUrl;
    this.keywords = keywords;
  }

  /**
   * 设置关键词列表
   */
  setKeywords(keywords: KeywordConfig[]): void {
    this.keywords = keywords;
  }

  /**
   * 添加关键词
   */
  addKeyword(keyword: KeywordConfig): void {
    this.keywords.push(keyword);
  }

  /**
   * 设置最大分析页面数
   */
  setMaxPages(maxPages: number): void {
    this.maxPages = maxPages;
  }

  /**
   * 设置爬取延迟
   */
  setCrawlDelay(delay: number): void {
    this.crawlDelay = delay;
  }

  /**
   * 获取站点地图URL列表
   */
  private async getSitemapUrls(): Promise<string[]> {
    const sitemapUrls = [
      `${this.baseUrl}/sitemap.xml`,
      `${this.baseUrl}/sitemap_index.xml`,
      `${this.baseUrl}/robots.txt`
    ];

    const urls: string[] = [];

    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await fetch(sitemapUrl);
        if (response.ok) {
          const content = await response.text();
          
          if (sitemapUrl.endsWith('.xml')) {
            // 解析XML站点地图
            const urlMatches = content.match(/<loc>(.*?)<\/loc>/g);
            if (urlMatches) {
              urlMatches.forEach(match => {
                const url = match.replace(/<\/?loc>/g, '');
                if (url.startsWith('http')) {
                  urls.push(url);
                }
              });
            }
          } else if (sitemapUrl.endsWith('robots.txt')) {
            // 从robots.txt中提取站点地图
            const sitemapMatches = content.match(/Sitemap:\s*(.*)/gi);
            if (sitemapMatches) {
              for (const match of sitemapMatches) {
                const sitemapUrl = match.replace(/Sitemap:\s*/i, '').trim();
                try {
                  const sitemapResponse = await fetch(sitemapUrl);
                  if (sitemapResponse.ok) {
                    const sitemapContent = await sitemapResponse.text();
                    const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);
                    if (urlMatches) {
                      urlMatches.forEach(urlMatch => {
                        const url = urlMatch.replace(/<\/?loc>/g, '');
                        if (url.startsWith('http')) {
                          urls.push(url);
                        }
                      });
                    }
                  }
                } catch (error) {
                  console.warn(`Failed to fetch sitemap: ${sitemapUrl}`, error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch: ${sitemapUrl}`, error);
      }
    }

    // 如果没有找到站点地图，返回基础URL
    if (urls.length === 0) {
      urls.push(this.baseUrl);
    }

    // 限制页面数量
    return urls.slice(0, this.maxPages);
  }

  /**
   * 分析单个页面
   */
  async analyzePage(url: string): Promise<PageAnalysisResult> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const content = this.extractPageContent(url, html);
      const keywordAnalyses = this.analyzeKeywords(content);
      
      const overallScore = this.calculateOverallScore(keywordAnalyses);
      const { issues, suggestions } = this.generatePageRecommendations(keywordAnalyses);

      return {
        url,
        content,
        keywordAnalyses,
        overallScore,
        issues,
        suggestions,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Failed to analyze page: ${url}`, error);
      throw error;
    }
  }

  /**
   * 分析整个网站
   */
  async analyzeSite(): Promise<SiteAnalysisReport> {
    console.log(`开始分析网站: ${this.baseUrl}`);
    
    const urls = await this.getSitemapUrls();
    console.log(`发现 ${urls.length} 个页面待分析`);

    const pageResults: PageAnalysisResult[] = [];
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`分析页面 ${i + 1}/${urls.length}: ${url}`);
      
      try {
        const result = await this.analyzePage(url);
        pageResults.push(result);
        
        // 添加延迟避免过于频繁的请求
        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.crawlDelay));
        }
      } catch (error) {
        console.error(`跳过页面 ${url}:`, error);
      }
    }

    const summary = this.generateSummary(pageResults);
    const recommendations = this.generateSiteRecommendations(pageResults);

    return {
      siteUrl: this.baseUrl,
      analyzedPages: pageResults.length,
      totalKeywords: this.keywords.length,
      pageResults,
      summary,
      recommendations,
      generatedAt: new Date()
    };
  }

  /**
   * 提取页面内容
   */
  private extractPageContent(url: string, html: string): PageContent {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // 提取标题
    const title = document.querySelector('title')?.textContent?.trim() || '';

    // 提取Meta描述
    const metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    const metaDescription = metaDesc ? metaDesc.content?.trim() || '' : '';

    // 提取标题标签
    const headings: PageContent['headings'] = {
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: []
    };

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
   * 提取正文内容
   */
  private extractBodyText(document: Document): string {
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
  private cleanText(text: string): string {
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
  private countWords(text: string): number {
    if (!text.trim()) return 0;

    // 分别处理中文和英文
    const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
    const englishWords = text
      .replace(/[\u4e00-\u9fff]/g, ' ') // 移除中文字符
      .match(/\b\w+\b/g) || [];

    return chineseChars.length + englishWords.length;
  }

  /**
   * 分析关键词
   */
  private analyzeKeywords(content: PageContent): KeywordAnalysis[] {
    const { KeywordDensityCalculator } = require('./KeywordDensityCalculator');
    return KeywordDensityCalculator.analyzeKeywords(content, this.keywords);
  }

  /**
   * 计算整体评分
   */
  private calculateOverallScore(analyses: KeywordAnalysis[]): number {
    if (analyses.length === 0) return 0;
    
    const totalScore = analyses.reduce((sum, analysis) => sum + analysis.seoScore, 0);
    return Math.round(totalScore / analyses.length);
  }

  /**
   * 生成页面建议
   */
  private generatePageRecommendations(analyses: KeywordAnalysis[]): { issues: string[]; suggestions: string[]; } {
    const allIssues: string[] = [];
    const allSuggestions: string[] = [];

    analyses.forEach(analysis => {
      allIssues.push(...analysis.issues);
      allSuggestions.push(...analysis.suggestions);
    });

    // 去重并限制数量
    const issues = [...new Set(allIssues)].slice(0, 10);
    const suggestions = [...new Set(allSuggestions)].slice(0, 10);

    return { issues, suggestions };
  }

  /**
   * 生成摘要
   */
  private generateSummary(pageResults: PageAnalysisResult[]): SiteAnalysisReport['summary'] {
    if (pageResults.length === 0) {
      return {
        averageScore: 0,
        topPerformingPages: [],
        poorPerformingPages: [],
        commonIssues: [],
        keywordCoverage: []
      };
    }

    // 计算平均分
    const averageScore = Math.round(
      pageResults.reduce((sum, result) => sum + result.overallScore, 0) / pageResults.length
    );

    // 找出表现最好和最差的页面
    const sortedByScore = [...pageResults].sort((a, b) => b.overallScore - a.overallScore);
    const topPerformingPages = sortedByScore.slice(0, 5).map(r => r.url);
    const poorPerformingPages = sortedByScore.slice(-5).map(r => r.url);

    // 统计常见问题
    const issueCount: { [key: string]: number } = {};
    pageResults.forEach(result => {
      result.issues.forEach(issue => {
        issueCount[issue] = (issueCount[issue] || 0) + 1;
      });
    });

    const commonIssues = Object.entries(issueCount)
      .map(([issue, frequency]) => ({ issue, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // 计算关键词覆盖率
    const keywordCoverage = this.keywords.map(keyword => {
      const pagesWithKeyword = pageResults.filter(result =>
        result.keywordAnalyses.some(analysis => 
          analysis.keyword === keyword.keyword && 
          (analysis.positions.title.found || 
           analysis.positions.bodyText.found || 
           analysis.positions.metaDescription.found)
        )
      ).length;

      const coverage = pageResults.length > 0 ? (pagesWithKeyword / pageResults.length) * 100 : 0;
      return { keyword: keyword.keyword, coverage: Math.round(coverage) };
    });

    return {
      averageScore,
      topPerformingPages,
      poorPerformingPages,
      commonIssues,
      keywordCoverage
    };
  }

  /**
   * 生成网站建议
   */
  private generateSiteRecommendations(pageResults: PageAnalysisResult[]): string[] {
    const recommendations: string[] = [];

    if (pageResults.length === 0) {
      return ['无法生成建议：没有成功分析的页面'];
    }

    // 基于平均分给出建议
    const averageScore = pageResults.reduce((sum, result) => sum + result.overallScore, 0) / pageResults.length;

    if (averageScore < 50) {
      recommendations.push('网站整体SEO表现较差，需要全面优化');
    } else if (averageScore < 70) {
      recommendations.push('网站SEO有改进空间，建议重点优化低分页面');
    } else {
      recommendations.push('网站SEO表现良好，继续保持并优化细节');
    }

    // 基于关键词覆盖率给出建议
    const summary = this.generateSummary(pageResults);
    const lowCoverageKeywords = summary.keywordCoverage.filter(kc => kc.coverage < 50);
    
    if (lowCoverageKeywords.length > 0) {
      recommendations.push(`以下关键词覆盖率较低，建议增加使用：${lowCoverageKeywords.map(k => k.keyword).join(', ')}`);
    }

    // 基于常见问题给出建议
    if (summary.commonIssues.length > 0) {
      const topIssue = summary.commonIssues[0];
      recommendations.push(`最常见的问题是"${topIssue.issue}"，影响了${topIssue.frequency}个页面`);
    }

    // 基于页面表现给出建议
    const poorPages = summary.poorPerformingPages.length;
    if (poorPages > pageResults.length * 0.3) {
      recommendations.push('超过30%的页面SEO表现不佳，建议制定系统性优化计划');
    }

    return recommendations;
  }
}
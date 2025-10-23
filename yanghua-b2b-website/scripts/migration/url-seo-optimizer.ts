#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

// SEO优化配置接口
interface SEOConfig {
  wordpress: {
    url: string;
    username: string;
    password: string;
  };
  seo: {
    generateSitemap: boolean;
    optimizeMetaTags: boolean;
    setupRedirects: boolean;
    checkBrokenLinks: boolean;
  };
  redirects: {
    strapiBaseUrl: string;
    wordpressBaseUrl: string;
    preserveLocale: boolean;
  };
}

// URL映射接口
interface URLMapping {
  strapiUrl: string;
  wordpressUrl: string;
  locale: string;
  articleId: number;
  status: 'active' | 'redirect' | 'broken';
}

// SEO检查结果
interface SEOCheckResult {
  url: string;
  title: string;
  metaDescription: string;
  h1Tags: string[];
  imageAlts: number;
  internalLinks: number;
  externalLinks: number;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
  }>;
  score: number;
}

// SEO报告
interface SEOReport {
  startTime: Date;
  endTime?: Date;
  totalPages: number;
  checkedPages: number;
  averageScore: number;
  urlMappings: URLMapping[];
  seoResults: SEOCheckResult[];
  redirectsGenerated: number;
  sitemapGenerated: boolean;
  recommendations: string[];
}

class URLSEOOptimizer {
  private config: SEOConfig;
  private report: SEOReport;
  private logFile: string;

  constructor(config: SEOConfig) {
    this.config = config;
    this.report = {
      startTime: new Date(),
      totalPages: 0,
      checkedPages: 0,
      averageScore: 0,
      urlMappings: [],
      seoResults: [],
      redirectsGenerated: 0,
      sitemapGenerated: false,
      recommendations: []
    };
    this.logFile = path.join(process.cwd(), `seo-optimization-${Date.now()}.log`);
  }

  private async log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;
    console.log(logMessage);
    await fs.appendFile(this.logFile, logMessage + '\n');
  }

  // 获取WordPress文章
  private async fetchWordPressArticles(): Promise<any[]> {
    await this.log('获取WordPress文章数据...');
    
    const articles: any[] = [];
    let page = 1;
    const perPage = 100;
    
    try {
      while (true) {
        const response = await axios.get(`${this.config.wordpress.url}/wp-json/wp/v2/posts`, {
          headers: {
            'Authorization': `Basic ${Buffer.from(
              `${this.config.wordpress.username}:${this.config.wordpress.password}`
            ).toString('base64')}`
          },
          params: {
            page: page,
            per_page: perPage,
            status: 'publish',
            _embed: true
          }
        });

        const data = response.data;
        if (!data || data.length === 0) break;

        articles.push(...data);
        page++;
        
        if (data.length < perPage) break;
      }

      this.report.totalPages = articles.length;
      await this.log(`获取到 ${articles.length} 篇WordPress文章`);
      return articles;
      
    } catch (error) {
      await this.log(`获取WordPress文章失败: ${error}`, 'ERROR');
      throw error;
    }
  }

  // 生成URL映射
  private async generateURLMappings(articles: any[]): Promise<URLMapping[]> {
    const mappings: URLMapping[] = [];

    for (const article of articles) {
      const locale = article.meta?.locale || 'zh-CN';
      const strapiId = article.meta?.strapi_id;
      
      if (!strapiId) continue;

      // 生成Strapi URL
      const strapiUrl = `${this.config.redirects.strapiBaseUrl}/${locale}/articles/${article.slug}`;
      
      // 生成WordPress URL
      const wordpressUrl = `${this.config.redirects.wordpressBaseUrl}/${locale}/articles/${article.slug}`;

      mappings.push({
        strapiUrl,
        wordpressUrl,
        locale,
        articleId: Number(strapiId),
        status: 'active'
      });
    }

    this.report.urlMappings = mappings;
    await this.log(`生成了 ${mappings.length} 个URL映射`);
    return mappings;
  }

  // 生成重定向规则
  private async generateRedirectRules(mappings: URLMapping[]): Promise<string> {
    await this.log('生成重定向规则...');

    const rules: string[] = [
      '# WordPress CMS迁移重定向规则',
      '# 从Strapi URL重定向到WordPress URL',
      ''
    ];

    // Apache .htaccess 格式
    rules.push('# Apache .htaccess 格式');
    rules.push('RewriteEngine On');
    rules.push('');

    for (const mapping of mappings) {
      const strapiPath = new URL(mapping.strapiUrl).pathname;
      const wordpressPath = new URL(mapping.wordpressUrl).pathname;
      
      rules.push(`RewriteRule ^${strapiPath.replace(/^\//, '')}$ ${wordpressPath} [R=301,L]`);
    }

    rules.push('');
    rules.push('# Nginx 格式');
    rules.push('');

    for (const mapping of mappings) {
      const strapiPath = new URL(mapping.strapiUrl).pathname;
      const wordpressPath = new URL(mapping.wordpressUrl).pathname;
      
      rules.push(`rewrite ^${strapiPath}$ ${wordpressPath} permanent;`);
    }

    const redirectContent = rules.join('\n');
    const redirectFile = path.join(process.cwd(), `redirects-${Date.now()}.txt`);
    await fs.writeFile(redirectFile, redirectContent);
    
    this.report.redirectsGenerated = mappings.length;
    await this.log(`重定向规则已生成: ${redirectFile}`);
    
    return redirectFile;
  }

  // 检查页面SEO
  private async checkPageSEO(url: string): Promise<SEOCheckResult> {
    const result: SEOCheckResult = {
      url,
      title: '',
      metaDescription: '',
      h1Tags: [],
      imageAlts: 0,
      internalLinks: 0,
      externalLinks: 0,
      issues: [],
      score: 0
    };

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEO-Checker/1.0)'
        }
      });

      const html = response.data;
      
      // 提取标题
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      result.title = titleMatch ? titleMatch[1].trim() : '';

      // 提取meta描述
      const metaDescMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i);
      result.metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';

      // 提取H1标签
      const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi);
      result.h1Tags = h1Matches ? h1Matches.map((h1: string) => h1.replace(/<[^>]*>/g, '').trim()) : [];

      // 统计图片alt属性
      const imgMatches = html.match(/<img[^>]*>/gi);
      if (imgMatches) {
        result.imageAlts = imgMatches.filter((img: string) => /alt\s*=\s*["\'][^"']+["\']/.test(img)).length;
      }

      // 统计链接
      const linkMatches = html.match(/<a[^>]*href\s*=\s*["\']([^"']+)["\'][^>]*>/gi);
      if (linkMatches) {
        for (const link of linkMatches) {
          const hrefMatch = link.match(/href\s*=\s*["\']([^"']+)["\']/i);
          if (hrefMatch) {
            const href = hrefMatch[1];
            if (href.startsWith('http') && !href.includes(new URL(url).hostname)) {
              result.externalLinks++;
            } else if (href.startsWith('/') || href.includes(new URL(url).hostname)) {
              result.internalLinks++;
            }
          }
        }
      }

      // SEO检查
      this.performSEOChecks(result);

    } catch (error) {
      result.issues.push({
        type: 'error',
        message: `无法访问页面: ${error}`
      });
    }

    return result;
  }

  // 执行SEO检查
  private performSEOChecks(result: SEOCheckResult) {
    let score = 100;

    // 标题检查
    if (!result.title) {
      result.issues.push({
        type: 'error',
        message: '缺少页面标题'
      });
      score -= 20;
    } else if (result.title.length < 30 || result.title.length > 60) {
      result.issues.push({
        type: 'warning',
        message: `标题长度不理想: ${result.title.length}字符 (建议30-60字符)`
      });
      score -= 10;
    }

    // Meta描述检查
    if (!result.metaDescription) {
      result.issues.push({
        type: 'error',
        message: '缺少meta描述'
      });
      score -= 15;
    } else if (result.metaDescription.length < 120 || result.metaDescription.length > 160) {
      result.issues.push({
        type: 'warning',
        message: `Meta描述长度不理想: ${result.metaDescription.length}字符 (建议120-160字符)`
      });
      score -= 8;
    }

    // H1标签检查
    if (result.h1Tags.length === 0) {
      result.issues.push({
        type: 'error',
        message: '缺少H1标签'
      });
      score -= 15;
    } else if (result.h1Tags.length > 1) {
      result.issues.push({
        type: 'warning',
        message: `多个H1标签: ${result.h1Tags.length}个 (建议只有1个)`
      });
      score -= 5;
    }

    // 图片alt属性检查
    const imgMatches = result.url.match(/<img[^>]*>/gi);
    const totalImages = imgMatches ? imgMatches.length : 0;
    if (totalImages > 0 && result.imageAlts < totalImages) {
      result.issues.push({
        type: 'warning',
        message: `${totalImages - result.imageAlts}张图片缺少alt属性`
      });
      score -= Math.min(10, (totalImages - result.imageAlts) * 2);
    }

    // 内部链接检查
    if (result.internalLinks < 2) {
      result.issues.push({
        type: 'info',
        message: '内部链接较少，建议增加相关文章链接'
      });
      score -= 5;
    }

    result.score = Math.max(0, score);
  }

  // 生成XML站点地图
  private async generateSitemap(articles: any[]): Promise<string> {
    await this.log('生成XML站点地图...');

    const urls: string[] = [];
    
    // 添加首页
    urls.push(`
  <url>
    <loc>${this.config.wordpress.url}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`);

    // 添加文章页面
    for (const article of articles) {
      const locale = article.meta?.locale || 'zh-CN';
      const url = `${this.config.wordpress.url}/${locale}/articles/${article.slug}`;
      const lastmod = new Date(article.modified).toISOString().split('T')[0];
      
      urls.push(`
  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`);
    }

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;

    const sitemapFile = path.join(process.cwd(), `sitemap-${Date.now()}.xml`);
    await fs.writeFile(sitemapFile, sitemapContent);
    
    this.report.sitemapGenerated = true;
    await this.log(`XML站点地图已生成: ${sitemapFile}`);
    
    return sitemapFile;
  }

  // 优化WordPress文章的SEO设置
  private async optimizeArticleSEO(articleId: number, seoData: any): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.config.wordpress.url}/wp-json/wp/v2/posts/${articleId}`,
        {
          meta: {
            ...seoData.meta,
            _yoast_wpseo_title: seoData.title,
            _yoast_wpseo_metadesc: seoData.description,
            _yoast_wpseo_focuskw: seoData.focusKeyword
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(
              `${this.config.wordpress.username}:${this.config.wordpress.password}`
            ).toString('base64')}`
          }
        }
      );

      return response.status === 200;
      
    } catch (error) {
      await this.log(`优化文章SEO失败 ID:${articleId}: ${error}`, 'ERROR');
      return false;
    }
  }

  // 执行SEO优化
  async optimize(): Promise<SEOReport> {
    await this.log('开始URL和SEO优化...');

    try {
      // 获取WordPress文章
      const articles = await this.fetchWordPressArticles();

      // 生成URL映射
      const mappings = await this.generateURLMappings(articles);

      // 生成重定向规则
      if (this.config.seo.setupRedirects) {
        await this.generateRedirectRules(mappings);
      }

      // 生成站点地图
      if (this.config.seo.generateSitemap) {
        await this.generateSitemap(articles);
      }

      // SEO检查
      if (this.config.seo.checkBrokenLinks) {
        await this.log('开始SEO检查...');
        
        for (const mapping of mappings.slice(0, 10)) { // 限制检查数量
          const seoResult = await this.checkPageSEO(mapping.wordpressUrl);
          this.report.seoResults.push(seoResult);
          this.report.checkedPages++;
          
          // 添加延迟避免过于频繁的请求
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 计算平均分数
        if (this.report.seoResults.length > 0) {
          this.report.averageScore = this.report.seoResults.reduce((sum, result) => 
            sum + result.score, 0) / this.report.seoResults.length;
        }
      }

      this.report.endTime = new Date();
      this.generateRecommendations();
      await this.generateSEOReport();

      await this.log('SEO优化完成');
      return this.report;

    } catch (error) {
      await this.log(`SEO优化过程中发生错误: ${error}`, 'ERROR');
      throw error;
    }
  }

  // 生成建议
  private generateRecommendations() {
    const recommendations: string[] = [];

    // 基于SEO检查结果生成建议
    if (this.report.averageScore < 80) {
      recommendations.push('整体SEO分数偏低，需要优化页面标题、描述和结构');
    }

    const commonIssues = new Map<string, number>();
    this.report.seoResults.forEach(result => {
      result.issues.forEach(issue => {
        const key = issue.message.split(':')[0];
        commonIssues.set(key, (commonIssues.get(key) || 0) + 1);
      });
    });

    // 找出最常见的问题
    const sortedIssues = Array.from(commonIssues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    sortedIssues.forEach(([issue, count]) => {
      recommendations.push(`修复常见问题: ${issue} (影响${count}个页面)`);
    });

    if (this.report.redirectsGenerated > 0) {
      recommendations.push('配置服务器重定向规则，确保旧URL正确跳转');
    }

    if (this.report.sitemapGenerated) {
      recommendations.push('将生成的站点地图提交给搜索引擎');
    }

    recommendations.push('监控搜索引擎收录情况，确保迁移后的页面被正确索引');
    recommendations.push('设置Google Search Console和百度站长工具监控');

    this.report.recommendations = recommendations;
  }

  // 生成SEO报告
  private async generateSEOReport() {
    const duration = this.report.endTime 
      ? (this.report.endTime.getTime() - this.report.startTime.getTime()) / 1000
      : 0;

    const reportContent = `
# URL和SEO优化报告

## 优化概览
- 优化时间: ${this.report.startTime.toISOString()} - ${this.report.endTime?.toISOString()}
- 总耗时: ${duration}秒
- 总页面数: ${this.report.totalPages}
- 检查页面数: ${this.report.checkedPages}
- 平均SEO分数: ${this.report.averageScore.toFixed(2)}
- URL映射数: ${this.report.urlMappings.length}
- 重定向规则: ${this.report.redirectsGenerated}
- 站点地图: ${this.report.sitemapGenerated ? '已生成' : '未生成'}

## URL映射示例
${this.report.urlMappings.slice(0, 5).map(mapping => 
  `- ${mapping.strapiUrl} → ${mapping.wordpressUrl}`
).join('\n')}

## SEO检查结果
${this.report.seoResults.map(result => `
### ${result.url}
- 分数: ${result.score}/100
- 标题: ${result.title}
- 描述: ${result.metaDescription}
- H1标签: ${result.h1Tags.length}个
- 图片alt: ${result.imageAlts}个
- 内部链接: ${result.internalLinks}个
- 外部链接: ${result.externalLinks}个
- 问题: ${result.issues.length}个
`).join('\n')}

## 常见SEO问题
${Array.from(
  this.report.seoResults.reduce((issues, result) => {
    result.issues.forEach(issue => {
      const key = issue.message;
      issues.set(key, (issues.get(key) || 0) + 1);
    });
    return issues;
  }, new Map<string, number>())
).sort((a, b) => b[1] - a[1])
.slice(0, 10)
.map(([issue, count]) => `- ${issue} (${count}次)`).join('\n')}

## 优化建议
${this.report.recommendations.map(rec => `- ${rec}`).join('\n')}

## 下一步行动
1. 配置服务器重定向规则
2. 提交站点地图到搜索引擎
3. 监控搜索引擎收录情况
4. 优化页面SEO设置
5. 设置性能监控
`;

    const reportPath = path.join(process.cwd(), `seo-optimization-report-${Date.now()}.md`);
    await fs.writeFile(reportPath, reportContent);
    await this.log(`SEO优化报告已生成: ${reportPath}`);
  }
}

// 默认配置
const defaultConfig: SEOConfig = {
  wordpress: {
    url: process.env.WORDPRESS_URL || 'http://localhost:8080',
    username: process.env.WORDPRESS_USERNAME || 'admin',
    password: process.env.WORDPRESS_PASSWORD || 'password'
  },
  seo: {
    generateSitemap: true,
    optimizeMetaTags: true,
    setupRedirects: true,
    checkBrokenLinks: true
  },
  redirects: {
    strapiBaseUrl: process.env.STRAPI_URL || 'https://fruitful-presence-02d7be759c.strapiapp.com',
    wordpressBaseUrl: process.env.WORDPRESS_URL || 'http://localhost:8080',
    preserveLocale: true
  }
};

// 主函数
async function main() {
  const optimizer = new URLSEOOptimizer(defaultConfig);
  
  try {
    const report = await optimizer.optimize();
    
    console.log('\n✅ SEO优化完成!');
    console.log(`处理页面: ${report.checkedPages}/${report.totalPages}`);
    console.log(`平均SEO分数: ${report.averageScore.toFixed(2)}`);
    console.log(`生成重定向规则: ${report.redirectsGenerated}条`);
    console.log(`站点地图: ${report.sitemapGenerated ? '已生成' : '未生成'}`);
    
    console.log('\n主要建议:');
    report.recommendations.slice(0, 3).forEach(rec => console.log(`- ${rec}`));
    
  } catch (error) {
    console.error('❌ SEO优化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { URLSEOOptimizer, type SEOConfig, type SEOReport };
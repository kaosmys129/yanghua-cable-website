#!/usr/bin/env node

/**
 * SEO分析脚本 - 专门针对 www.yhflexiblebusbar.com
 * 
 * 功能特性：
 * - 全站页面爬取和分析
 * - 页面标题和元描述检查
 * - 关键词密度分析
 * - 内部链接结构分析
 * - 图片alt属性检查
 * - 生成详细的优化建议报告
 * 
 * 使用方法：
 * node analyze-seo.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { JSDOM } = require('jsdom');

// 目标网站配置
const TARGET_WEBSITE = 'https://www.yhflexiblebusbar.com';
const MAX_PAGES = 20;
const CRAWL_DELAY = 2000; // 2秒延迟，避免过于频繁的请求

// 柔性母线行业相关关键词配置
const FLEXIBLE_BUSBAR_KEYWORDS = [
  // 核心关键词
  { keyword: 'flexible busbar', type: 'CORE', priority: 10, targetDensity: 2.5 },
  { keyword: 'copper busbar', type: 'CORE', priority: 9, targetDensity: 2.0 },
  { keyword: 'electrical busbar', type: 'CORE', priority: 8, targetDensity: 1.8 },
  { keyword: 'busbar connector', type: 'CORE', priority: 8, targetDensity: 1.5 },
  { keyword: 'power distribution', type: 'CORE', priority: 7, targetDensity: 1.2 },
  
  // 长尾关键词
  { keyword: 'flexible copper busbar manufacturer', type: 'LONG_TAIL', priority: 7, targetDensity: 1.5 },
  { keyword: 'high current busbar solution', type: 'LONG_TAIL', priority: 6, targetDensity: 1.2 },
  { keyword: 'custom busbar design', type: 'LONG_TAIL', priority: 6, targetDensity: 1.0 },
  { keyword: 'electrical power distribution system', type: 'LONG_TAIL', priority: 5, targetDensity: 1.0 },
  { keyword: 'industrial busbar applications', type: 'LONG_TAIL', priority: 5, targetDensity: 0.8 },
  
  // 品牌和产品相关
  { keyword: 'yanghua', type: 'BRAND', priority: 8, targetDensity: 1.5 },
  { keyword: 'yanghua cable', type: 'BRAND', priority: 7, targetDensity: 1.2 },
  { keyword: 'flexible cable', type: 'PRODUCT', priority: 6, targetDensity: 1.0 },
  { keyword: 'cable assembly', type: 'PRODUCT', priority: 5, targetDensity: 0.8 }
];

// SEO分析配置
const SEO_CONFIG = {
  maxTitleLength: 60,
  maxMetaDescriptionLength: 160,
  minWordCount: 300,
  targetDensityRange: { min: 0.5, max: 3.0 },
  requiredMetaTags: ['title', 'description', 'keywords'],
  imageAltRequired: true,
  internalLinksMinimum: 3
};

// 分析结果存储
let analysisResults = {
  website: TARGET_WEBSITE,
  analyzedPages: [],
  summary: {},
  recommendations: [],
  timestamp: new Date().toISOString()
};

/**
 * 获取网页内容（支持重定向）
 */
async function fetchPageContent(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const followRedirect = (currentUrl, redirectCount) => {
      if (redirectCount > maxRedirects) {
        reject(new Error('Too many redirects'));
        return;
      }
      
      const request = https.get(currentUrl, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          if (response.statusCode === 200) {
            resolve(data);
          } else if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
            const location = response.headers.location;
            if (location) {
              console.log(`重定向到: ${location}`);
              // 处理相对URL重定向
              let redirectUrl;
              if (location.startsWith('http')) {
                redirectUrl = location;
              } else if (location.startsWith('/')) {
                const urlObj = new URL(currentUrl);
                redirectUrl = `${urlObj.protocol}//${urlObj.host}${location}`;
              } else {
                const urlObj = new URL(currentUrl);
                redirectUrl = `${urlObj.protocol}//${urlObj.host}/${location}`;
              }
              followRedirect(redirectUrl, redirectCount + 1);
            } else {
              reject(new Error(`Redirect without location header`));
            }
          } else {
            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          }
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.setTimeout(15000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    };
    
    followRedirect(url, 0);
  });
}

/**
 * 提取页面链接
 */
function extractLinks(html, baseUrl) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const links = [];
  
  const linkElements = document.querySelectorAll('a[href]');
  linkElements.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      let fullUrl;
      if (href.startsWith('http')) {
        fullUrl = href;
      } else if (href.startsWith('/')) {
        fullUrl = new URL(href, baseUrl).toString();
      } else {
        fullUrl = new URL(href, baseUrl).toString();
      }
      
      // 只收集同域名的链接
      if (fullUrl.includes('yhflexiblebusbar.com')) {
        links.push({
          url: fullUrl,
          text: link.textContent.trim(),
          title: link.getAttribute('title') || ''
        });
      }
    }
  });
  
  return links;
}

/**
 * 分析页面SEO要素
 */
function analyzePageSEO(html, url) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // 基本信息提取
  const title = document.querySelector('title')?.textContent?.trim() || '';
  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
  const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content')?.trim() || '';
  const h1Tags = Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim());
  const h2Tags = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
  
  // 内容分析
  const bodyText = document.body?.textContent?.trim() || '';
  const wordCount = bodyText.split(/\s+/).length;
  
  // 图片分析
  const images = Array.from(document.querySelectorAll('img'));
  const imagesWithoutAlt = images.filter(img => !img.getAttribute('alt') || img.getAttribute('alt').trim() === '');
  
  // 内部链接分析
  const internalLinks = extractLinks(html, url);
  
  // 关键词密度分析
  const keywordAnalysis = analyzeKeywordDensity(bodyText, title, metaDescription);
  
  return {
    url,
    title,
    metaDescription,
    metaKeywords,
    h1Tags,
    h2Tags,
    wordCount,
    images: {
      total: images.length,
      withoutAlt: imagesWithoutAlt.length,
      altCoverage: images.length > 0 ? ((images.length - imagesWithoutAlt.length) / images.length * 100).toFixed(1) : 0
    },
    internalLinks: {
      count: internalLinks.length,
      links: internalLinks
    },
    keywordAnalysis,
    seoIssues: identifySEOIssues({
      title,
      metaDescription,
      wordCount,
      h1Tags,
      imagesWithoutAlt: imagesWithoutAlt.length,
      internalLinksCount: internalLinks.length
    })
  };
}

/**
 * 关键词密度分析
 */
function analyzeKeywordDensity(text, title = '', metaDescription = '') {
  const allText = `${title} ${metaDescription} ${text}`.toLowerCase();
  const words = allText.split(/\s+/);
  const totalWords = words.length;
  
  const keywordResults = FLEXIBLE_BUSBAR_KEYWORDS.map(config => {
    const keyword = config.keyword.toLowerCase();
    const keywordWords = keyword.split(/\s+/);
    let count = 0;
    
    // 计算关键词出现次数
    if (keywordWords.length === 1) {
      count = words.filter(word => word.includes(keyword)).length;
    } else {
      // 多词关键词匹配
      for (let i = 0; i <= words.length - keywordWords.length; i++) {
        const phrase = words.slice(i, i + keywordWords.length).join(' ');
        if (phrase.includes(keyword)) {
          count++;
        }
      }
    }
    
    const density = totalWords > 0 ? (count / totalWords * 100) : 0;
    
    return {
      keyword: config.keyword,
      type: config.type,
      priority: config.priority,
      count,
      density: parseFloat(density.toFixed(2)),
      targetDensity: config.targetDensity,
      status: density >= config.targetDensity * 0.5 && density <= config.targetDensity * 1.5 ? 'optimal' : 
              density < config.targetDensity * 0.5 ? 'low' : 'high'
    };
  });
  
  return {
    totalWords,
    keywords: keywordResults
  };
}

/**
 * 识别SEO问题
 */
function identifySEOIssues(pageData) {
  const issues = [];
  
  // 标题检查
  if (!pageData.title) {
    issues.push({ type: 'error', category: 'title', message: '页面缺少标题标签' });
  } else if (pageData.title.length > SEO_CONFIG.maxTitleLength) {
    issues.push({ type: 'warning', category: 'title', message: `标题过长 (${pageData.title.length}字符，建议不超过${SEO_CONFIG.maxTitleLength}字符)` });
  } else if (pageData.title.length < 30) {
    issues.push({ type: 'warning', category: 'title', message: '标题可能过短，建议30-60字符' });
  }
  
  // 元描述检查
  if (!pageData.metaDescription) {
    issues.push({ type: 'error', category: 'meta', message: '页面缺少元描述' });
  } else if (pageData.metaDescription.length > SEO_CONFIG.maxMetaDescriptionLength) {
    issues.push({ type: 'warning', category: 'meta', message: `元描述过长 (${pageData.metaDescription.length}字符，建议不超过${SEO_CONFIG.maxMetaDescriptionLength}字符)` });
  } else if (pageData.metaDescription.length < 120) {
    issues.push({ type: 'warning', category: 'meta', message: '元描述可能过短，建议120-160字符' });
  }
  
  // H1标签检查
  if (pageData.h1Tags.length === 0) {
    issues.push({ type: 'error', category: 'heading', message: '页面缺少H1标签' });
  } else if (pageData.h1Tags.length > 1) {
    issues.push({ type: 'warning', category: 'heading', message: `页面有多个H1标签 (${pageData.h1Tags.length}个)，建议只使用一个` });
  }
  
  // 内容长度检查
  if (pageData.wordCount < SEO_CONFIG.minWordCount) {
    issues.push({ type: 'warning', category: 'content', message: `内容过短 (${pageData.wordCount}词，建议至少${SEO_CONFIG.minWordCount}词)` });
  }
  
  // 图片Alt属性检查
  if (pageData.imagesWithoutAlt > 0) {
    issues.push({ type: 'warning', category: 'images', message: `${pageData.imagesWithoutAlt}张图片缺少alt属性` });
  }
  
  // 内部链接检查
  if (pageData.internalLinksCount < SEO_CONFIG.internalLinksMinimum) {
    issues.push({ type: 'warning', category: 'links', message: `内部链接过少 (${pageData.internalLinksCount}个，建议至少${SEO_CONFIG.internalLinksMinimum}个)` });
  }
  
  return issues;
}

/**
 * 爬取网站页面
 */
async function crawlWebsite() {
  console.log(`开始分析网站: ${TARGET_WEBSITE}`);
  console.log('正在获取首页...');
  
  const visitedUrls = new Set();
  const urlsToVisit = [TARGET_WEBSITE];
  
  try {
    // 分析首页
    const homePageContent = await fetchPageContent(TARGET_WEBSITE);
    const homePageAnalysis = analyzePageSEO(homePageContent, TARGET_WEBSITE);
    analysisResults.analyzedPages.push(homePageAnalysis);
    visitedUrls.add(TARGET_WEBSITE);
    
    console.log(`✓ 首页分析完成`);
    
    // 从首页提取更多链接
    const homePageLinks = extractLinks(homePageContent, TARGET_WEBSITE);
    homePageLinks.forEach(link => {
      if (!visitedUrls.has(link.url) && urlsToVisit.length < MAX_PAGES) {
        urlsToVisit.push(link.url);
      }
    });
    
    // 分析其他页面
    for (let i = 1; i < Math.min(urlsToVisit.length, MAX_PAGES); i++) {
      const url = urlsToVisit[i];
      
      if (visitedUrls.has(url)) continue;
      
      console.log(`正在分析页面 ${i + 1}/${Math.min(urlsToVisit.length, MAX_PAGES)}: ${url}`);
      
      try {
        await new Promise(resolve => setTimeout(resolve, CRAWL_DELAY));
        const pageContent = await fetchPageContent(url);
        const pageAnalysis = analyzePageSEO(pageContent, url);
        analysisResults.analyzedPages.push(pageAnalysis);
        visitedUrls.add(url);
        
        console.log(`✓ 页面分析完成`);
        
        // 从当前页面提取更多链接
        const pageLinks = extractLinks(pageContent, url);
        pageLinks.forEach(link => {
          if (!visitedUrls.has(link.url) && !urlsToVisit.includes(link.url) && urlsToVisit.length < MAX_PAGES) {
            urlsToVisit.push(link.url);
          }
        });
        
      } catch (error) {
        console.log(`✗ 页面分析失败: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error(`首页分析失败: ${error.message}`);
    return;
  }
  
  console.log(`\n分析完成！共分析了 ${analysisResults.analyzedPages.length} 个页面`);
}

/**
 * 生成分析摘要
 */
function generateSummary() {
  const pages = analysisResults.analyzedPages;
  if (pages.length === 0) return;
  
  // 计算平均值和统计
  const totalWords = pages.reduce((sum, page) => sum + page.wordCount, 0);
  const totalImages = pages.reduce((sum, page) => sum + page.images.total, 0);
  const totalImagesWithoutAlt = pages.reduce((sum, page) => sum + page.images.withoutAlt, 0);
  const totalInternalLinks = pages.reduce((sum, page) => sum + page.internalLinks.count, 0);
  
  // SEO问题统计
  const allIssues = pages.flatMap(page => page.seoIssues);
  const errorCount = allIssues.filter(issue => issue.type === 'error').length;
  const warningCount = allIssues.filter(issue => issue.type === 'warning').length;
  
  // 关键词表现统计
  const keywordPerformance = {};
  FLEXIBLE_BUSBAR_KEYWORDS.forEach(config => {
    const keywordData = pages.map(page => 
      page.keywordAnalysis.keywords.find(k => k.keyword === config.keyword)
    ).filter(Boolean);
    
    if (keywordData.length > 0) {
      const avgDensity = keywordData.reduce((sum, k) => sum + k.density, 0) / keywordData.length;
      const totalCount = keywordData.reduce((sum, k) => sum + k.count, 0);
      
      keywordPerformance[config.keyword] = {
        averageDensity: parseFloat(avgDensity.toFixed(2)),
        totalOccurrences: totalCount,
        targetDensity: config.targetDensity,
        performance: avgDensity >= config.targetDensity * 0.5 && avgDensity <= config.targetDensity * 1.5 ? 'good' : 
                    avgDensity < config.targetDensity * 0.5 ? 'low' : 'high'
      };
    }
  });
  
  analysisResults.summary = {
    totalPages: pages.length,
    averageWordCount: Math.round(totalWords / pages.length),
    totalImages,
    imagesWithoutAlt: totalImagesWithoutAlt,
    imageAltCoverage: totalImages > 0 ? parseFloat(((totalImages - totalImagesWithoutAlt) / totalImages * 100).toFixed(1)) : 0,
    averageInternalLinks: Math.round(totalInternalLinks / pages.length),
    seoIssues: {
      errors: errorCount,
      warnings: warningCount,
      total: errorCount + warningCount
    },
    keywordPerformance
  };
}

/**
 * 生成优化建议
 */
function generateRecommendations() {
  const summary = analysisResults.summary;
  const recommendations = [];
  
  // 基于整体统计的建议
  if (summary.averageWordCount < SEO_CONFIG.minWordCount) {
    recommendations.push({
      priority: 'high',
      category: 'content',
      title: '增加页面内容长度',
      description: `平均页面内容只有${summary.averageWordCount}词，建议增加到至少${SEO_CONFIG.minWordCount}词以提高SEO效果。`,
      action: '为每个页面添加更多有价值的内容，包括产品详细描述、技术规格、应用案例等。'
    });
  }
  
  if (summary.imageAltCoverage < 90) {
    recommendations.push({
      priority: 'medium',
      category: 'images',
      title: '完善图片Alt属性',
      description: `${summary.imagesWithoutAlt}张图片缺少alt属性，alt属性覆盖率仅${summary.imageAltCoverage}%。`,
      action: '为所有图片添加描述性的alt属性，特别是产品图片应包含相关关键词。'
    });
  }
  
  if (summary.averageInternalLinks < SEO_CONFIG.internalLinksMinimum) {
    recommendations.push({
      priority: 'medium',
      category: 'links',
      title: '增加内部链接',
      description: `平均每页只有${summary.averageInternalLinks}个内部链接，建议增加到至少${SEO_CONFIG.internalLinksMinimum}个。`,
      action: '在页面内容中添加更多指向相关产品页面、技术文档和公司信息的内部链接。'
    });
  }
  
  // 基于关键词表现的建议
  Object.entries(summary.keywordPerformance).forEach(([keyword, data]) => {
    if (data.performance === 'low') {
      recommendations.push({
        priority: 'high',
        category: 'keywords',
        title: `优化关键词"${keyword}"`,
        description: `关键词"${keyword}"平均密度为${data.averageDensity}%，低于目标密度${data.targetDensity}%。`,
        action: `在页面标题、描述、H标签和内容中更多地使用"${keyword}"，但要保持自然。`
      });
    } else if (data.performance === 'high') {
      recommendations.push({
        priority: 'medium',
        category: 'keywords',
        title: `减少关键词"${keyword}"使用频率`,
        description: `关键词"${keyword}"平均密度为${data.averageDensity}%，超过目标密度${data.targetDensity}%。`,
        action: `适当减少"${keyword}"的使用频率，避免关键词堆砌。`
      });
    }
  });
  
  // 基于具体页面问题的建议
  const commonIssues = {};
  analysisResults.analyzedPages.forEach(page => {
    page.seoIssues.forEach(issue => {
      const key = `${issue.category}-${issue.message}`;
      if (!commonIssues[key]) {
        commonIssues[key] = { ...issue, count: 0, pages: [] };
      }
      commonIssues[key].count++;
      commonIssues[key].pages.push(page.url);
    });
  });
  
  Object.values(commonIssues).forEach(issue => {
    if (issue.count > 1) {
      recommendations.push({
        priority: issue.type === 'error' ? 'high' : 'medium',
        category: issue.category,
        title: `修复常见问题：${issue.message}`,
        description: `${issue.count}个页面存在此问题。`,
        action: `批量修复这些页面的问题，影响页面：${issue.pages.slice(0, 3).join(', ')}${issue.pages.length > 3 ? '等' : ''}`
      });
    }
  });
  
  analysisResults.recommendations = recommendations;
}

/**
 * 生成HTML报告
 */
function generateHTMLReport() {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO分析报告 - ${TARGET_WEBSITE}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
        .summary-card h3 { margin: 0 0 10px; color: #333; }
        .summary-card .value { font-size: 2em; font-weight: bold; color: #667eea; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .recommendations { display: grid; gap: 15px; }
        .recommendation { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
        .recommendation.high { border-left: 4px solid #dc3545; }
        .recommendation.medium { border-left: 4px solid #ffc107; }
        .recommendation.low { border-left: 4px solid #28a745; }
        .recommendation h4 { margin: 0 0 10px; color: #333; }
        .recommendation .priority { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; }
        .priority.high { background: #dc3545; color: white; }
        .priority.medium { background: #ffc107; color: #333; }
        .priority.low { background: #28a745; color: white; }
        .pages-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .pages-table th, .pages-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; }
        .pages-table th { background: #f8f9fa; font-weight: 600; }
        .pages-table tr:hover { background: #f8f9fa; }
        .keyword-performance { display: grid; gap: 15px; }
        .keyword-item { background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .keyword-item.good { border-left: 4px solid #28a745; }
        .keyword-item.low { border-left: 4px solid #dc3545; }
        .keyword-item.high { border-left: 4px solid #ffc107; }
        .progress-bar { background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden; margin: 5px 0; }
        .progress-fill { height: 100%; background: #667eea; transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SEO分析报告</h1>
            <p>网站：${TARGET_WEBSITE}</p>
            <p>分析时间：${new Date(analysisResults.timestamp).toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>分析摘要</h2>
                <div class="summary">
                    <div class="summary-card">
                        <h3>分析页面数</h3>
                        <div class="value">${analysisResults.summary.totalPages}</div>
                    </div>
                    <div class="summary-card">
                        <h3>平均内容长度</h3>
                        <div class="value">${analysisResults.summary.averageWordCount}</div>
                        <small>词</small>
                    </div>
                    <div class="summary-card">
                        <h3>图片Alt覆盖率</h3>
                        <div class="value">${analysisResults.summary.imageAltCoverage}%</div>
                    </div>
                    <div class="summary-card">
                        <h3>SEO问题总数</h3>
                        <div class="value">${analysisResults.summary.seoIssues.total}</div>
                        <small>${analysisResults.summary.seoIssues.errors}个错误，${analysisResults.summary.seoIssues.warnings}个警告</small>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>关键词表现</h2>
                <div class="keyword-performance">
                    ${Object.entries(analysisResults.summary.keywordPerformance).map(([keyword, data]) => `
                        <div class="keyword-item ${data.performance}">
                            <h4>${keyword}</h4>
                            <p>平均密度：${data.averageDensity}% (目标：${data.targetDensity}%)</p>
                            <p>总出现次数：${data.totalOccurrences}</p>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(data.averageDensity / data.targetDensity * 100, 100)}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="section">
                <h2>优化建议</h2>
                <div class="recommendations">
                    ${analysisResults.recommendations.map(rec => `
                        <div class="recommendation ${rec.priority}">
                            <span class="priority ${rec.priority}">${rec.priority}</span>
                            <h4>${rec.title}</h4>
                            <p><strong>问题：</strong>${rec.description}</p>
                            <p><strong>建议：</strong>${rec.action}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="section">
                <h2>页面详情</h2>
                <table class="pages-table">
                    <thead>
                        <tr>
                            <th>页面URL</th>
                            <th>标题长度</th>
                            <th>内容长度</th>
                            <th>图片数量</th>
                            <th>内部链接</th>
                            <th>SEO问题</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${analysisResults.analyzedPages.map(page => `
                            <tr>
                                <td><a href="${page.url}" target="_blank">${page.url.replace(TARGET_WEBSITE, '')}</a></td>
                                <td>${page.title.length}</td>
                                <td>${page.wordCount}</td>
                                <td>${page.images.total} (${page.images.withoutAlt}缺alt)</td>
                                <td>${page.internalLinks.count}</td>
                                <td>${page.seoIssues.length}个问题</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>`;
  
  return html;
}

/**
 * 保存报告文件
 */
function saveReports() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFilename = `seo-analysis-yhflexiblebusbar-${timestamp}`;
  
  // 保存JSON报告
  const jsonFilename = `${baseFilename}.json`;
  fs.writeFileSync(jsonFilename, JSON.stringify(analysisResults, null, 2));
  console.log(`✓ JSON报告已保存：${jsonFilename}`);
  
  // 保存HTML报告
  const htmlFilename = `${baseFilename}.html`;
  const htmlContent = generateHTMLReport();
  fs.writeFileSync(htmlFilename, htmlContent);
  console.log(`✓ HTML报告已保存：${htmlFilename}`);
  
  // 保存CSV报告（页面摘要）
  const csvFilename = `${baseFilename}-pages.csv`;
  const csvHeaders = 'URL,标题,标题长度,元描述长度,内容长度,H1数量,图片总数,缺少Alt的图片,内部链接数,SEO问题数\n';
  const csvRows = analysisResults.analyzedPages.map(page => 
    `"${page.url}","${page.title.replace(/"/g, '""')}",${page.title.length},${page.metaDescription.length},${page.wordCount},${page.h1Tags.length},${page.images.total},${page.images.withoutAlt},${page.internalLinks.count},${page.seoIssues.length}`
  ).join('\n');
  fs.writeFileSync(csvFilename, csvHeaders + csvRows);
  console.log(`✓ CSV报告已保存：${csvFilename}`);
  
  return { jsonFilename, htmlFilename, csvFilename };
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('SEO分析工具 - 专门针对 www.yhflexiblebusbar.com');
  console.log('='.repeat(60));
  
  try {
    // 1. 爬取和分析网站
    await crawlWebsite();
    
    if (analysisResults.analyzedPages.length === 0) {
      console.error('未能分析任何页面，请检查网站是否可访问。');
      return;
    }
    
    // 2. 生成分析摘要
    console.log('\n正在生成分析摘要...');
    generateSummary();
    
    // 3. 生成优化建议
    console.log('正在生成优化建议...');
    generateRecommendations();
    
    // 4. 保存报告
    console.log('正在保存报告文件...');
    const reportFiles = saveReports();
    
    // 5. 显示结果摘要
    console.log('\n' + '='.repeat(60));
    console.log('分析完成！');
    console.log('='.repeat(60));
    console.log(`✓ 共分析页面：${analysisResults.summary.totalPages}个`);
    console.log(`✓ 发现SEO问题：${analysisResults.summary.seoIssues.total}个 (${analysisResults.summary.seoIssues.errors}个错误，${analysisResults.summary.seoIssues.warnings}个警告)`);
    console.log(`✓ 生成优化建议：${analysisResults.recommendations.length}条`);
    console.log(`✓ 平均内容长度：${analysisResults.summary.averageWordCount}词`);
    console.log(`✓ 图片Alt覆盖率：${analysisResults.summary.imageAltCoverage}%`);
    
    console.log('\n报告文件：');
    console.log(`- HTML报告：${reportFiles.htmlFilename}`);
    console.log(`- JSON数据：${reportFiles.jsonFilename}`);
    console.log(`- CSV数据：${reportFiles.csvFilename}`);
    
    console.log('\n主要优化建议：');
    analysisResults.recommendations.slice(0, 5).forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
    });
    
    if (analysisResults.recommendations.length > 5) {
      console.log(`   ... 还有${analysisResults.recommendations.length - 5}条建议，详见HTML报告`);
    }
    
  } catch (error) {
    console.error(`分析过程中发生错误：${error.message}`);
    console.error(error.stack);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  crawlWebsite,
  analyzePageSEO,
  generateSummary,
  generateRecommendations,
  saveReports
};
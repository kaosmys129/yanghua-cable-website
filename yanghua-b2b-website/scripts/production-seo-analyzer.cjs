#!/usr/bin/env node

/**
 * 生产环境全面SEO分析工具
 * 针对 https://www.yhflexiblebusbar.com 进行全面的SEO检查
 * 
 * 检查项目：
 * 1. 图片alt属性检查
 * 2. 页面标题重复/缺失检测
 * 3. HTML标签W3C标准验证
 * 4. 元标签完整性分析
 * 5. h1-h6标题层级结构检查
 * 6. SEO不友好因素识别
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// 生产环境配置
const PRODUCTION_BASE_URL = 'https://www.yhflexiblebusbar.com';
const OUTPUT_DIR = path.join(__dirname, '..', 'seo-reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// 要分析的页面路径
const PAGES_TO_ANALYZE = [
  '/',
  '/en',
  '/es',
  '/en/products',
  '/es/productos',
  '/en/solutions',
  '/es/soluciones',
  '/en/about',
  '/es/acerca-de',
  '/en/services',
  '/es/servicios',
  '/en/projects',
  '/es/proyectos',
  '/en/contact',
  '/es/contacto',
  '/en/articles',
  '/es/articulos'
];

class ProductionSEOAnalyzer {
  constructor() {
    this.browser = null;
    this.results = [];
    this.titleTracker = new Map(); // 跟踪标题重复
    this.issues = {
      critical: [],
      error: [],
      warning: [],
      info: []
    };
  }

  async init() {
    console.log('🚀 启动生产环境SEO分析...');
    console.log(`📍 目标网站: ${PRODUCTION_BASE_URL}`);
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
  }

  async analyzePage(pagePath) {
    const fullUrl = `${PRODUCTION_BASE_URL}${pagePath}`;
    console.log(`🔍 分析页面: ${fullUrl}`);

    const page = await this.browser.newPage();
    
    try {
      // 设置用户代理和视口
      await page.setUserAgent('Mozilla/5.0 (compatible; SEO-Analyzer/1.0; +https://www.yhflexiblebusbar.com)');
      await page.setViewport({ width: 1920, height: 1080 });

      // 访问页面
      const response = await page.goto(fullUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
      }

      // 获取页面内容
      const pageData = await page.evaluate(() => {
        return {
          title: document.title,
          metaDescription: document.querySelector('meta[name="description"]')?.content || '',
          metaKeywords: document.querySelector('meta[name="keywords"]')?.content || '',
          metaViewport: document.querySelector('meta[name="viewport"]')?.content || '',
          metaCharset: document.querySelector('meta[charset]')?.getAttribute('charset') || 
                      document.querySelector('meta[http-equiv="Content-Type"]')?.content || '',
          metaRobots: document.querySelector('meta[name="robots"]')?.content || '',
          langAttribute: document.documentElement.lang || '',
          canonicalUrl: document.querySelector('link[rel="canonical"]')?.href || '',
          hreflangLinks: Array.from(document.querySelectorAll('link[hreflang]')).map(link => ({
            hreflang: link.hreflang,
            href: link.href
          })),
          openGraphTags: {
            title: document.querySelector('meta[property="og:title"]')?.content || '',
            description: document.querySelector('meta[property="og:description"]')?.content || '',
            image: document.querySelector('meta[property="og:image"]')?.content || '',
            url: document.querySelector('meta[property="og:url"]')?.content || '',
            type: document.querySelector('meta[property="og:type"]')?.content || ''
          },
          twitterTags: {
            card: document.querySelector('meta[name="twitter:card"]')?.content || '',
            title: document.querySelector('meta[name="twitter:title"]')?.content || '',
            description: document.querySelector('meta[name="twitter:description"]')?.content || '',
            image: document.querySelector('meta[name="twitter:image"]')?.content || ''
          },
          headings: {
            h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
            h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()),
            h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim()),
            h4: Array.from(document.querySelectorAll('h4')).map(h => h.textContent.trim()),
            h5: Array.from(document.querySelectorAll('h5')).map(h => h.textContent.trim()),
            h6: Array.from(document.querySelectorAll('h6')).map(h => h.textContent.trim())
          },
          images: Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt || '',
            title: img.title || '',
            width: img.width,
            height: img.height,
            loading: img.loading || ''
          })),
          links: Array.from(document.querySelectorAll('a[href]')).map(link => ({
            href: link.href,
            text: link.textContent.trim(),
            title: link.title || '',
            rel: link.rel || '',
            target: link.target || ''
          })),
          structuredData: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(script => {
            try {
              return JSON.parse(script.textContent);
            } catch (e) {
              return null;
            }
          }).filter(Boolean),
          wordCount: document.body.textContent.trim().split(/\s+/).length,
          htmlValidation: {
            hasDoctype: document.doctype !== null,
            hasHtmlLang: document.documentElement.hasAttribute('lang'),
            hasMetaCharset: !!document.querySelector('meta[charset], meta[http-equiv="Content-Type"]'),
            hasMetaViewport: !!document.querySelector('meta[name="viewport"]'),
            hasTitle: !!document.title
          }
        };
      });

      // 分析页面数据
      const analysis = this.analyzePageData(fullUrl, pageData);
      
      this.results.push({
        url: fullUrl,
        path: pagePath,
        timestamp: new Date().toISOString(),
        data: pageData,
        analysis: analysis,
        issues: analysis.issues
      });

      console.log(`✅ 完成分析: ${fullUrl} (发现 ${analysis.issues.length} 个问题)`);

    } catch (error) {
      console.error(`❌ 分析失败: ${fullUrl} - ${error.message}`);
      this.issues.error.push({
        url: fullUrl,
        type: 'page_load_error',
        message: `页面加载失败: ${error.message}`,
        severity: 'error'
      });
    } finally {
      await page.close();
    }
  }

  analyzePageData(url, data) {
    const issues = [];
    const warnings = [];
    const suggestions = [];

    // 1. 图片alt属性检查
    const imagesWithoutAlt = data.images.filter(img => !img.alt || img.alt.trim() === '');
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        type: 'missing_image_alt',
        severity: 'error',
        message: `发现 ${imagesWithoutAlt.length} 个图片缺少alt属性`,
        details: imagesWithoutAlt.map(img => img.src),
        recommendation: '为所有图片添加描述性的alt属性，提高可访问性和SEO效果'
      });
    }

    // 2. 页面标题检查
    if (!data.title || data.title.trim() === '') {
      issues.push({
        type: 'missing_title',
        severity: 'critical',
        message: '页面缺少标题标签',
        recommendation: '添加描述性的页面标题'
      });
    } else {
      // 检查标题长度
      if (data.title.length < 10) {
        warnings.push({
          type: 'title_too_short',
          severity: 'warning',
          message: `页面标题过短 (${data.title.length} 字符)`,
          recommendation: '标题应该在30-60字符之间'
        });
      } else if (data.title.length > 60) {
        warnings.push({
          type: 'title_too_long',
          severity: 'warning',
          message: `页面标题过长 (${data.title.length} 字符)`,
          recommendation: '标题应该在30-60字符之间'
        });
      }

      // 跟踪标题重复
      if (this.titleTracker.has(data.title)) {
        const existingUrls = this.titleTracker.get(data.title);
        existingUrls.push(url);
        issues.push({
          type: 'duplicate_title',
          severity: 'error',
          message: `标题重复: "${data.title}"`,
          details: existingUrls,
          recommendation: '每个页面应该有唯一的标题'
        });
      } else {
        this.titleTracker.set(data.title, [url]);
      }
    }

    // 3. HTML标准验证
    if (!data.htmlValidation.hasDoctype) {
      issues.push({
        type: 'missing_doctype',
        severity: 'error',
        message: '缺少DOCTYPE声明',
        recommendation: '添加HTML5 DOCTYPE声明'
      });
    }

    if (!data.htmlValidation.hasHtmlLang) {
      issues.push({
        type: 'missing_html_lang',
        severity: 'error',
        message: 'HTML标签缺少lang属性',
        recommendation: '为HTML标签添加lang属性，如lang="en"或lang="es"'
      });
    }

    if (!data.htmlValidation.hasMetaCharset) {
      issues.push({
        type: 'missing_charset',
        severity: 'error',
        message: '缺少字符编码声明',
        recommendation: '添加<meta charset="UTF-8">'
      });
    }

    // 4. 元标签完整性分析
    if (!data.metaDescription || data.metaDescription.trim() === '') {
      issues.push({
        type: 'missing_meta_description',
        severity: 'error',
        message: '缺少meta description',
        recommendation: '添加120-160字符的页面描述'
      });
    } else {
      if (data.metaDescription.length < 120) {
        warnings.push({
          type: 'meta_description_too_short',
          severity: 'warning',
          message: `Meta description过短 (${data.metaDescription.length} 字符)`,
          recommendation: 'Meta description应该在120-160字符之间'
        });
      } else if (data.metaDescription.length > 160) {
        warnings.push({
          type: 'meta_description_too_long',
          severity: 'warning',
          message: `Meta description过长 (${data.metaDescription.length} 字符)`,
          recommendation: 'Meta description应该在120-160字符之间'
        });
      }
    }

    if (!data.htmlValidation.hasMetaViewport) {
      warnings.push({
        type: 'missing_viewport',
        severity: 'warning',
        message: '缺少viewport meta标签',
        recommendation: '添加<meta name="viewport" content="width=device-width, initial-scale=1">'
      });
    }

    if (!data.metaRobots) {
      suggestions.push({
        type: 'missing_robots_meta',
        severity: 'info',
        message: '建议添加robots meta标签',
        recommendation: '明确指定搜索引擎爬虫行为'
      });
    }

    // 5. h1-h6标题层级结构检查
    if (data.headings.h1.length === 0) {
      issues.push({
        type: 'missing_h1',
        severity: 'error',
        message: '页面缺少H1标签',
        recommendation: '每个页面应该有一个唯一的H1标签'
      });
    } else if (data.headings.h1.length > 1) {
      warnings.push({
        type: 'multiple_h1',
        severity: 'warning',
        message: `页面有多个H1标签 (${data.headings.h1.length} 个)`,
        details: data.headings.h1,
        recommendation: '每个页面应该只有一个H1标签'
      });
    }

    // 检查标题层级结构
    const headingLevels = [];
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((level, index) => {
      if (data.headings[level].length > 0) {
        headingLevels.push(index + 1);
      }
    });

    // 检查是否跳级
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i-1] > 1) {
        warnings.push({
          type: 'heading_structure_skip',
          severity: 'warning',
          message: `标题层级跳跃: 从H${headingLevels[i-1]}直接跳到H${headingLevels[i]}`,
          recommendation: '标题应该按层级顺序使用，不要跳级'
        });
      }
    }

    // 6. SEO不友好因素识别
    
    // 检查canonical URL
    if (!data.canonicalUrl) {
      warnings.push({
        type: 'missing_canonical',
        severity: 'warning',
        message: '缺少canonical URL',
        recommendation: '添加canonical链接避免重复内容问题'
      });
    }

    // 检查hreflang（多语言网站）
    if (data.hreflangLinks.length === 0) {
      suggestions.push({
        type: 'missing_hreflang',
        severity: 'info',
        message: '建议添加hreflang标签',
        recommendation: '多语言网站应该使用hreflang标签'
      });
    }

    // 检查Open Graph标签
    if (!data.openGraphTags.title || !data.openGraphTags.description) {
      suggestions.push({
        type: 'incomplete_og_tags',
        severity: 'info',
        message: 'Open Graph标签不完整',
        recommendation: '添加完整的Open Graph标签提高社交媒体分享效果'
      });
    }

    // 检查结构化数据
    if (data.structuredData.length === 0) {
      suggestions.push({
        type: 'missing_structured_data',
        severity: 'info',
        message: '建议添加结构化数据',
        recommendation: '使用JSON-LD格式添加结构化数据提高搜索结果展示'
      });
    }

    // 检查内容长度
    if (data.wordCount < 300) {
      warnings.push({
        type: 'low_word_count',
        severity: 'warning',
        message: `页面内容较少 (${data.wordCount} 词)`,
        recommendation: '增加有价值的内容，建议至少300词'
      });
    }

    // 检查图片优化
    const largeImages = data.images.filter(img => img.width > 1920 || img.height > 1080);
    if (largeImages.length > 0) {
      suggestions.push({
        type: 'large_images',
        severity: 'info',
        message: `发现 ${largeImages.length} 个大尺寸图片`,
        recommendation: '优化图片尺寸和格式以提高页面加载速度'
      });
    }

    // 检查链接
    const emptyLinks = data.links.filter(link => !link.text || link.text.trim() === '');
    if (emptyLinks.length > 0) {
      warnings.push({
        type: 'empty_link_text',
        severity: 'warning',
        message: `发现 ${emptyLinks.length} 个空链接文本`,
        recommendation: '为所有链接添加描述性文本'
      });
    }

    return {
      issues: [...issues, ...warnings, ...suggestions],
      summary: {
        totalIssues: issues.length + warnings.length + suggestions.length,
        critical: issues.filter(i => i.severity === 'critical').length,
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: warnings.length,
        suggestions: suggestions.length
      }
    };
  }

  async generateReport() {
    console.log('📊 生成分析报告...');

    // 统计总体情况
    const totalIssues = this.results.reduce((sum, result) => sum + result.analysis.summary.totalIssues, 0);
    const totalCritical = this.results.reduce((sum, result) => sum + result.analysis.summary.critical, 0);
    const totalErrors = this.results.reduce((sum, result) => sum + result.analysis.summary.errors, 0);
    const totalWarnings = this.results.reduce((sum, result) => sum + result.analysis.summary.warnings, 0);
    const totalSuggestions = this.results.reduce((sum, result) => sum + result.analysis.summary.suggestions, 0);

    // 收集所有问题类型
    const issueTypes = new Map();
    this.results.forEach(result => {
      result.issues.forEach(issue => {
        const key = issue.type;
        if (!issueTypes.has(key)) {
          issueTypes.set(key, {
            type: issue.type,
            severity: issue.severity,
            count: 0,
            pages: []
          });
        }
        const issueData = issueTypes.get(key);
        issueData.count++;
        issueData.pages.push(result.url);
      });
    });

    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        baseUrl: PRODUCTION_BASE_URL,
        totalPages: this.results.length,
        analysisVersion: '1.0.0-production'
      },
      summary: {
        totalIssues,
        issueBreakdown: {
          critical: totalCritical,
          errors: totalErrors,
          warnings: totalWarnings,
          suggestions: totalSuggestions
        },
        overallScore: Math.max(0, 100 - (totalCritical * 10 + totalErrors * 5 + totalWarnings * 2 + totalSuggestions * 1)),
        commonIssues: Array.from(issueTypes.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      },
      pages: this.results.map(result => ({
        url: result.url,
        path: result.path,
        title: result.data.title,
        metaDescription: result.data.metaDescription,
        issues: result.issues,
        summary: result.analysis.summary,
        seoScore: Math.max(0, 100 - (
          result.analysis.summary.critical * 10 +
          result.analysis.summary.errors * 5 +
          result.analysis.summary.warnings * 2 +
          result.analysis.summary.suggestions * 1
        ))
      })),
      recommendations: this.generateRecommendations(issueTypes)
    };

    // 保存JSON报告
    const jsonReportPath = path.join(OUTPUT_DIR, `production-seo-analysis-${TIMESTAMP}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));

    // 生成HTML报告
    const htmlReport = this.generateHTMLReport(report);
    const htmlReportPath = path.join(OUTPUT_DIR, `production-seo-analysis-${TIMESTAMP}.html`);
    fs.writeFileSync(htmlReportPath, htmlReport);

    console.log('✅ 报告生成完成:');
    console.log(`📄 JSON报告: ${jsonReportPath}`);
    console.log(`🌐 HTML报告: ${htmlReportPath}`);

    return report;
  }

  generateRecommendations(issueTypes) {
    const recommendations = [];
    
    // 基于最常见的问题生成建议
    const sortedIssues = Array.from(issueTypes.values()).sort((a, b) => b.count - a.count);
    
    sortedIssues.slice(0, 5).forEach(issue => {
      switch (issue.type) {
        case 'missing_image_alt':
          recommendations.push({
            priority: 'high',
            category: '可访问性',
            title: '为图片添加alt属性',
            description: '所有图片都应该有描述性的alt属性，这不仅有助于SEO，还能提高网站的可访问性。',
            impact: '提高搜索引擎理解图片内容的能力，改善视障用户体验'
          });
          break;
        case 'title_too_long':
          recommendations.push({
            priority: 'high',
            category: 'SEO基础',
            title: '优化页面标题长度',
            description: '页面标题应该控制在30-60字符之间，过长的标题在搜索结果中会被截断。',
            impact: '提高搜索结果中标题的完整显示，增加点击率'
          });
          break;
        case 'meta_description_too_short':
          recommendations.push({
            priority: 'medium',
            category: 'SEO基础',
            title: '完善meta description',
            description: 'Meta description应该在120-160字符之间，提供页面内容的简洁描述。',
            impact: '提高搜索结果中描述的吸引力，增加点击率'
          });
          break;
        case 'missing_h1':
          recommendations.push({
            priority: 'high',
            category: '内容结构',
            title: '添加H1标签',
            description: '每个页面都应该有一个唯一的H1标签，明确页面的主要主题。',
            impact: '帮助搜索引擎理解页面主题，改善内容结构'
          });
          break;
        case 'missing_canonical':
          recommendations.push({
            priority: 'medium',
            category: '技术SEO',
            title: '添加canonical URL',
            description: '为每个页面添加canonical链接，避免重复内容问题。',
            impact: '防止搜索引擎将相似页面视为重复内容，集中页面权重'
          });
          break;
      }
    });

    return recommendations;
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>生产环境SEO分析报告 - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .metric h3 { margin: 0 0 10px 0; color: #495057; }
        .metric .value { font-size: 2em; font-weight: bold; color: #007bff; }
        .section { padding: 0 30px 30px 30px; }
        .section h2 { color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; }
        .issue-card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #dc3545; }
        .issue-card.warning { border-left-color: #ffc107; }
        .issue-card.info { border-left-color: #17a2b8; }
        .issue-card h4 { margin: 0 0 10px 0; color: #495057; }
        .issue-card p { margin: 5px 0; color: #6c757d; }
        .page-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .page-card { background: #f8f9fa; border-radius: 8px; padding: 20px; }
        .page-card h4 { margin: 0 0 10px 0; color: #495057; }
        .page-card .url { font-size: 0.9em; color: #6c757d; word-break: break-all; }
        .score { font-weight: bold; padding: 5px 10px; border-radius: 20px; color: white; }
        .score.excellent { background: #28a745; }
        .score.good { background: #17a2b8; }
        .score.fair { background: #ffc107; color: #212529; }
        .score.poor { background: #dc3545; }
        .recommendations { background: #e7f3ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .recommendation { background: white; border-radius: 6px; padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; }
        .recommendation h4 { margin: 0 0 10px 0; color: #007bff; }
        .recommendation .category { background: #007bff; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; }
        .footer { text-align: center; padding: 20px; color: #6c757d; border-top: 1px solid #e9ecef; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 生产环境SEO分析报告</h1>
            <p>网站: ${report.metadata.baseUrl} | 分析时间: ${new Date(report.metadata.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>总页面数</h3>
                <div class="value">${report.metadata.totalPages}</div>
            </div>
            <div class="metric">
                <h3>总问题数</h3>
                <div class="value">${report.summary.totalIssues}</div>
            </div>
            <div class="metric">
                <h3>严重问题</h3>
                <div class="value" style="color: #dc3545;">${report.summary.issueBreakdown.critical}</div>
            </div>
            <div class="metric">
                <h3>错误</h3>
                <div class="value" style="color: #fd7e14;">${report.summary.issueBreakdown.errors}</div>
            </div>
            <div class="metric">
                <h3>警告</h3>
                <div class="value" style="color: #ffc107;">${report.summary.issueBreakdown.warnings}</div>
            </div>
            <div class="metric">
                <h3>建议</h3>
                <div class="value" style="color: #17a2b8;">${report.summary.issueBreakdown.suggestions}</div>
            </div>
        </div>

        <div class="section">
            <h2>📋 常见问题</h2>
            ${report.summary.commonIssues.map(issue => `
                <div class="issue-card ${issue.severity === 'critical' || issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warning' : 'info'}">
                    <h4>${issue.type} (${issue.count} 个页面)</h4>
                    <p><strong>严重程度:</strong> ${issue.severity}</p>
                    <p><strong>影响页面:</strong> ${issue.pages.slice(0, 3).join(', ')}${issue.pages.length > 3 ? ` 等 ${issue.pages.length} 个页面` : ''}</p>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>🎯 优化建议</h2>
            <div class="recommendations">
                ${report.recommendations.map(rec => `
                    <div class="recommendation">
                        <h4>${rec.title} <span class="category">${rec.category}</span></h4>
                        <p>${rec.description}</p>
                        <p><strong>预期效果:</strong> ${rec.impact}</p>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>📄 页面详情</h2>
            <div class="page-list">
                ${report.pages.map(page => {
                    let scoreClass = 'poor';
                    if (page.seoScore >= 90) scoreClass = 'excellent';
                    else if (page.seoScore >= 70) scoreClass = 'good';
                    else if (page.seoScore >= 50) scoreClass = 'fair';
                    
                    return `
                        <div class="page-card">
                            <h4>${page.title || '无标题'}</h4>
                            <p class="url">${page.url}</p>
                            <p><strong>SEO评分:</strong> <span class="score ${scoreClass}">${page.seoScore}</span></p>
                            <p><strong>问题数:</strong> ${page.summary.totalIssues} (严重: ${page.summary.critical}, 错误: ${page.summary.errors}, 警告: ${page.summary.warnings})</p>
                            <p><strong>Meta描述:</strong> ${page.metaDescription ? page.metaDescription.substring(0, 100) + '...' : '无'}</p>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <div class="footer">
            <p>报告生成时间: ${new Date().toLocaleString()} | Yanghua B2B Website SEO Analyzer v1.0</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();

      // 确保输出目录存在
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }

      // 分析所有页面
      for (const pagePath of PAGES_TO_ANALYZE) {
        await this.analyzePage(pagePath);
        // 添加延迟避免对服务器造成压力
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // 生成报告
      const report = await this.generateReport();

      console.log('\n🎉 生产环境SEO分析完成!');
      console.log(`📊 总页面数: ${report.metadata.totalPages}`);
      console.log(`⚠️  总问题数: ${report.summary.totalIssues}`);
      console.log(`🔴 严重问题: ${report.summary.issueBreakdown.critical}`);
      console.log(`🟠 错误: ${report.summary.issueBreakdown.errors}`);
      console.log(`🟡 警告: ${report.summary.issueBreakdown.warnings}`);
      console.log(`🔵 建议: ${report.summary.issueBreakdown.suggestions}`);
      console.log(`📈 平均SEO评分: ${Math.round(report.pages.reduce((sum, page) => sum + page.seoScore, 0) / report.pages.length)}`);

    } catch (error) {
      console.error('❌ 分析过程中发生错误:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// 运行分析
if (require.main === module) {
  const analyzer = new ProductionSEOAnalyzer();
  analyzer.run().catch(error => {
    console.error('分析失败:', error);
    process.exit(1);
  });
}

module.exports = ProductionSEOAnalyzer;
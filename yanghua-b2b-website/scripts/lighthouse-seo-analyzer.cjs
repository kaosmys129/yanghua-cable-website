#!/usr/bin/env node

/**
 * 基于Lighthouse的生产环境SEO分析脚本
 * 提供全面的SEO、性能、可访问性和最佳实践分析
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// 导入生产环境配置
const config = require('../seo-analyzer-production.config.cjs');

class LighthouseSEOAnalyzer {
  constructor() {
    this.config = config;
    this.outputDir = path.join(__dirname, '..', 'seo-reports');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.results = [];
  }

  async run() {
    console.log('🚀 开始基于Lighthouse的生产环境SEO分析...');
    console.log(`📍 目标网站: ${config.site}`);
    console.log(`📄 分析页面数: ${config.pages.length}`);
    console.log('');

    try {
      // 确保输出目录存在
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }

      // 启动Chrome实例
      const chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
      });

      const options = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: ['seo', 'performance', 'accessibility', 'best-practices'],
        port: chrome.port,
      };

      // 分析每个页面
      for (const page of config.pages) {
        const fullUrl = `${config.site}${page}`;
        console.log(`🔍 分析页面: ${page}`);
        
        try {
          const runnerResult = await lighthouse.navigation(fullUrl, options);
          
          if (runnerResult && runnerResult.lhr) {
            const result = this.processLighthouseResult(fullUrl, page, runnerResult.lhr);
            this.results.push(result);
            console.log(`✅ 完成: ${page} (SEO评分: ${result.seoScore}/100)`);
          } else {
            console.log(`❌ 失败: ${page} - 无法获取Lighthouse结果`);
            this.results.push({
              url: fullUrl,
              path: page,
              success: false,
              error: '无法获取Lighthouse结果'
            });
          }
        } catch (error) {
          console.log(`❌ 失败: ${page} - ${error.message}`);
          this.results.push({
            url: fullUrl,
            path: page,
            success: false,
            error: error.message
          });
        }
        
        // 添加延迟避免服务器压力
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // 关闭Chrome实例
      await chrome.kill();

      // 处理和生成报告
      const processedResults = this.processResults();
      await this.generateReports(processedResults);
      this.displaySummary(processedResults);

    } catch (error) {
      console.error('❌ 分析过程中发生错误:', error);
      throw error;
    }
  }

  processLighthouseResult(url, path, lhr) {
    const seoCategory = lhr.categories.seo;
    const performanceCategory = lhr.categories.performance;
    const accessibilityCategory = lhr.categories.accessibility;
    const bestPracticesCategory = lhr.categories['best-practices'];

    // 提取SEO相关的审计结果
    const seoAudits = {};
    const seoIssues = [];

    // 检查关键SEO审计项
    const keyAudits = [
      'document-title',
      'meta-description',
      'image-alt',
      'link-text',
      'canonical',
      'hreflang',
      'structured-data',
      'robots-txt',
      'viewport',
      'font-size',
      'tap-targets',
      'crawlable-anchors'
    ];

    keyAudits.forEach(auditId => {
      if (lhr.audits[auditId]) {
        const audit = lhr.audits[auditId];
        seoAudits[auditId] = {
          score: audit.score,
          title: audit.title,
          description: audit.description,
          displayValue: audit.displayValue
        };

        // 如果审计失败，添加到问题列表
        if (audit.score !== null && audit.score < 1) {
          seoIssues.push({
            type: auditId,
            title: audit.title,
            description: audit.description,
            severity: audit.score === 0 ? 'error' : 'warning',
            details: audit.details
          });
        }
      }
    });

    return {
      url,
      path,
      success: true,
      timestamp: new Date().toISOString(),
      scores: {
        seo: Math.round((seoCategory.score || 0) * 100),
        performance: Math.round((performanceCategory.score || 0) * 100),
        accessibility: Math.round((accessibilityCategory.score || 0) * 100),
        bestPractices: Math.round((bestPracticesCategory.score || 0) * 100)
      },
      seoScore: Math.round((seoCategory.score || 0) * 100),
      seoAudits,
      seoIssues,
      metrics: {
        firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue,
        largestContentfulPaint: lhr.audits['largest-contentful-paint']?.numericValue,
        cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue,
        totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue
      }
    };
  }

  processResults() {
    const processedResults = {
      timestamp: new Date().toISOString(),
      totalPages: config.pages.length,
      successfulPages: 0,
      failedPages: 0,
      averageScores: {
        seo: 0,
        performance: 0,
        accessibility: 0,
        bestPractices: 0
      },
      totalIssues: 0,
      issuesByType: {},
      pages: []
    };

    let totalScores = { seo: 0, performance: 0, accessibility: 0, bestPractices: 0 };

    this.results.forEach(result => {
      if (result.success) {
        processedResults.successfulPages++;
        processedResults.pages.push(result);
        
        // 累计分数
        totalScores.seo += result.scores.seo;
        totalScores.performance += result.scores.performance;
        totalScores.accessibility += result.scores.accessibility;
        totalScores.bestPractices += result.scores.bestPractices;
        
        // 统计问题
        processedResults.totalIssues += result.seoIssues.length;
        
        result.seoIssues.forEach(issue => {
          if (!processedResults.issuesByType[issue.type]) {
            processedResults.issuesByType[issue.type] = {
              count: 0,
              title: issue.title,
              severity: issue.severity,
              pages: []
            };
          }
          processedResults.issuesByType[issue.type].count++;
          processedResults.issuesByType[issue.type].pages.push(result.path);
        });
      } else {
        processedResults.failedPages++;
        processedResults.pages.push(result);
      }
    });

    // 计算平均分数
    if (processedResults.successfulPages > 0) {
      processedResults.averageScores.seo = Math.round(totalScores.seo / processedResults.successfulPages);
      processedResults.averageScores.performance = Math.round(totalScores.performance / processedResults.successfulPages);
      processedResults.averageScores.accessibility = Math.round(totalScores.accessibility / processedResults.successfulPages);
      processedResults.averageScores.bestPractices = Math.round(totalScores.bestPractices / processedResults.successfulPages);
    }

    return processedResults;
  }

  async generateReports(processedResults) {
    console.log('📊 生成分析报告...');

    const jsonFilename = `lighthouse-seo-analysis-${this.timestamp}.json`;
    const htmlFilename = `lighthouse-seo-analysis-${this.timestamp}.html`;
    const csvFilename = `lighthouse-seo-analysis-${this.timestamp}.csv`;

    const jsonPath = path.join(this.outputDir, jsonFilename);
    const htmlPath = path.join(this.outputDir, htmlFilename);
    const csvPath = path.join(this.outputDir, csvFilename);

    // 生成JSON报告
    fs.writeFileSync(jsonPath, JSON.stringify(processedResults, null, 2));

    // 生成HTML报告
    const htmlContent = this.generateHTMLReport(processedResults);
    fs.writeFileSync(htmlPath, htmlContent);

    // 生成CSV报告
    const csvContent = this.generateCSVReport(processedResults);
    fs.writeFileSync(csvPath, csvContent);

    console.log('✅ 报告生成完成:');
    console.log(`📄 JSON报告: ${jsonPath}`);
    console.log(`🌐 HTML报告: ${htmlPath}`);
    console.log(`📊 CSV报告: ${csvPath}`);
  }

  generateHTMLReport(results) {
    const commonIssues = Object.entries(results.issuesByType)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lighthouse SEO分析报告</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
        .header h1 { margin: 0 0 10px 0; font-size: 2.5rem; }
        .header p { margin: 5px 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .metric h3 { margin: 0 0 10px 0; color: #4a5568; font-size: 0.9rem; text-transform: uppercase; }
        .metric .value { font-size: 2.5rem; font-weight: bold; margin-bottom: 5px; }
        .metric .label { color: #718096; font-size: 0.9rem; }
        .score-excellent { color: #38a169; }
        .score-good { color: #3182ce; }
        .score-fair { color: #d69e2e; }
        .score-poor { color: #e53e3e; }
        .section { background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .section h2 { margin: 0 0 20px 0; color: #2d3748; border-bottom: 3px solid #e2e8f0; padding-bottom: 10px; }
        .issues-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .issue-card { background: #f7fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #e2e8f0; }
        .issue-card.error { border-left-color: #e53e3e; background: #fef5f5; }
        .issue-card.warning { border-left-color: #d69e2e; background: #fffaf0; }
        .issue-card h4 { margin: 0 0 10px 0; color: #2d3748; }
        .issue-card .count { font-size: 1.5rem; font-weight: bold; color: #4a5568; }
        .issue-card .pages { margin-top: 10px; font-size: 0.9rem; color: #718096; }
        .pages-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .page-card { background: #f7fafc; padding: 20px; border-radius: 8px; }
        .page-card h4 { margin: 0 0 15px 0; color: #2d3748; }
        .page-card .url { color: #718096; font-size: 0.9rem; margin-bottom: 15px; word-break: break-all; }
        .scores { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 15px; }
        .score-item { text-align: center; padding: 10px; background: white; border-radius: 6px; }
        .score-item .score { font-size: 1.5rem; font-weight: bold; }
        .score-item .label { font-size: 0.8rem; color: #718096; text-transform: uppercase; }
        .issues-list { margin-top: 15px; }
        .issue-item { background: white; padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 3px solid #e2e8f0; }
        .issue-item.error { border-left-color: #e53e3e; }
        .issue-item.warning { border-left-color: #d69e2e; }
        .issue-item h5 { margin: 0 0 5px 0; font-size: 0.9rem; }
        .issue-item p { margin: 0; font-size: 0.8rem; color: #718096; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Lighthouse SEO分析报告</h1>
            <p><strong>网站:</strong> ${config.site}</p>
            <p><strong>分析时间:</strong> ${new Date(results.timestamp).toLocaleString()}</p>
            <p><strong>分析页面数:</strong> ${results.totalPages} | <strong>成功:</strong> ${results.successfulPages} | <strong>失败:</strong> ${results.failedPages}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>SEO评分</h3>
                <div class="value ${this.getScoreClass(results.averageScores.seo)}">${results.averageScores.seo}</div>
                <div class="label">平均分</div>
            </div>
            <div class="metric">
                <h3>性能评分</h3>
                <div class="value ${this.getScoreClass(results.averageScores.performance)}">${results.averageScores.performance}</div>
                <div class="label">平均分</div>
            </div>
            <div class="metric">
                <h3>可访问性</h3>
                <div class="value ${this.getScoreClass(results.averageScores.accessibility)}">${results.averageScores.accessibility}</div>
                <div class="label">平均分</div>
            </div>
            <div class="metric">
                <h3>最佳实践</h3>
                <div class="value ${this.getScoreClass(results.averageScores.bestPractices)}">${results.averageScores.bestPractices}</div>
                <div class="label">平均分</div>
            </div>
        </div>

        ${commonIssues.length > 0 ? `
        <div class="section">
            <h2>📋 常见SEO问题</h2>
            <div class="issues-grid">
                ${commonIssues.map(([type, issue]) => `
                    <div class="issue-card ${issue.severity}">
                        <h4>${issue.title}</h4>
                        <div class="count">${issue.count} 个页面</div>
                        <div class="pages">
                            影响页面: ${issue.pages.slice(0, 3).join(', ')}
                            ${issue.pages.length > 3 ? ` 等 ${issue.pages.length} 个页面` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h2>📄 页面详细分析</h2>
            <div class="pages-grid">
                ${results.pages.filter(page => page.success).map(page => `
                    <div class="page-card">
                        <h4>${page.path}</h4>
                        <div class="url">${page.url}</div>
                        <div class="scores">
                            <div class="score-item">
                                <div class="score ${this.getScoreClass(page.scores.seo)}">${page.scores.seo}</div>
                                <div class="label">SEO</div>
                            </div>
                            <div class="score-item">
                                <div class="score ${this.getScoreClass(page.scores.performance)}">${page.scores.performance}</div>
                                <div class="label">性能</div>
                            </div>
                            <div class="score-item">
                                <div class="score ${this.getScoreClass(page.scores.accessibility)}">${page.scores.accessibility}</div>
                                <div class="label">可访问性</div>
                            </div>
                            <div class="score-item">
                                <div class="score ${this.getScoreClass(page.scores.bestPractices)}">${page.scores.bestPractices}</div>
                                <div class="label">最佳实践</div>
                            </div>
                        </div>
                        ${page.seoIssues.length > 0 ? `
                        <div class="issues-list">
                            <strong>SEO问题 (${page.seoIssues.length}):</strong>
                            ${page.seoIssues.slice(0, 5).map(issue => `
                                <div class="issue-item ${issue.severity}">
                                    <h5>${issue.title}</h5>
                                    <p>${issue.description}</p>
                                </div>
                            `).join('')}
                            ${page.seoIssues.length > 5 ? `<p>还有 ${page.seoIssues.length - 5} 个问题...</p>` : ''}
                        </div>
                        ` : '<div style="color: #38a169; margin-top: 15px;">✅ 未发现SEO问题</div>'}
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  getScoreClass(score) {
    if (score >= 90) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 50) return 'score-fair';
    return 'score-poor';
  }

  generateCSVReport(results) {
    const headers = ['URL', 'Path', 'SEO Score', 'Performance Score', 'Accessibility Score', 'Best Practices Score', 'Issues Count', 'Status'];
    const rows = results.pages.map(page => [
      page.url,
      page.path,
      page.success ? page.scores.seo : 'N/A',
      page.success ? page.scores.performance : 'N/A',
      page.success ? page.scores.accessibility : 'N/A',
      page.success ? page.scores.bestPractices : 'N/A',
      page.success ? page.seoIssues.length : 'N/A',
      page.success ? 'Success' : 'Failed'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  displaySummary(results) {
    console.log('');
    console.log('🎉 Lighthouse SEO分析完成!');
    console.log('==================================================');
    console.log(`📊 总页面数: ${results.totalPages}`);
    console.log(`✅ 成功分析: ${results.successfulPages}`);
    console.log(`❌ 分析失败: ${results.failedPages}`);
    console.log(`📈 平均SEO评分: ${results.averageScores.seo}/100`);
    console.log(`⚡ 平均性能评分: ${results.averageScores.performance}/100`);
    console.log(`♿ 平均可访问性评分: ${results.averageScores.accessibility}/100`);
    console.log(`🏆 平均最佳实践评分: ${results.averageScores.bestPractices}/100`);
    console.log(`⚠️  总SEO问题数: ${results.totalIssues}`);
    
    if (Object.keys(results.issuesByType).length > 0) {
      console.log('');
      console.log('📋 最常见的SEO问题:');
      Object.entries(results.issuesByType)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .forEach(([type, issue], index) => {
          console.log(`${index + 1}. ${issue.title} (${issue.count} 个页面)`);
        });
    }
    
    console.log('');
    console.log('📄 报告已保存到 seo-reports/ 目录');
    console.log('==================================================');
  }
}

// 运行分析
async function main() {
  try {
    const analyzer = new LighthouseSEOAnalyzer();
    await analyzer.run();
  } catch (error) {
    console.error('分析失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = LighthouseSEOAnalyzer;
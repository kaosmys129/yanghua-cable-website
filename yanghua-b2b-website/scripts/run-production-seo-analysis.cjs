#!/usr/bin/env node

/**
 * 生产环境SEO分析脚本
 * 使用seo-analyzer包对生产环境进行全面SEO检查
 */

const seoAnalyzer = require('seo-analyzer');
const fs = require('fs');
const path = require('path');

// 导入生产环境配置
const config = require('../seo-analyzer-production.config.cjs');

class ProductionSEORunner {
  constructor() {
    this.config = config;
    this.outputDir = path.join(__dirname, '..', 'seo-reports');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  async run() {
    console.log('🚀 开始生产环境SEO分析...');
    console.log(`📍 目标网站: ${config.site}`);
    console.log(`📄 分析页面数: ${config.pages.length}`);
    console.log('');

    try {
      // 确保输出目录存在
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }

      const results = [];
      
      // 分析每个页面
      for (const page of config.pages) {
        const fullUrl = `${config.site}${page}`;
        console.log(`🔍 分析页面: ${page}`);
        
        try {
          const result = await seoAnalyzer(fullUrl, {
            ...this.config,
            site: fullUrl
          });
          
          results.push({
            url: fullUrl,
            path: page,
            success: true,
            result: result
          });
          
          console.log(`✅ 完成: ${page}`);
        } catch (error) {
          console.log(`❌ 失败: ${page} - ${error.message}`);
          results.push({
            url: fullUrl,
            path: page,
            success: false,
            error: error.message
          });
        }
        
        // 添加延迟避免服务器压力
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // 处理结果
      const processedResults = this.processAnalyzerResults(results);

      // 生成报告
      await this.generateReports(processedResults);

      // 显示摘要
      this.displaySummary(processedResults);

    } catch (error) {
      console.error('❌ 分析过程中发生错误:', error);
      throw error;
    }
  }

  processAnalyzerResults(results) {
    console.log('📊 处理分析结果...');
    
    const processedResults = {
      timestamp: new Date().toISOString(),
      totalPages: config.pages.length,
      successfulPages: 0,
      failedPages: 0,
      totalIssues: 0,
      criticalIssues: 0,
      errors: 0,
      warnings: 0,
      suggestions: 0,
      averageScore: 0,
      pages: [],
      summary: {
        imgAltIssues: 0,
        titleIssues: 0,
        metaDescriptionIssues: 0,
        headingStructureIssues: 0,
        canonicalIssues: 0,
        socialTagIssues: 0
      }
    };

    let totalScore = 0;

    // 处理每个页面的结果
    results.forEach(pageResult => {
      if (pageResult.success) {
        processedResults.successfulPages++;
        
        // 计算页面分数和问题
        const issues = pageResult.result || [];
        const issueCount = Array.isArray(issues) ? issues.length : 0;
        const pageScore = Math.max(0, 100 - (issueCount * 10));
        
        processedResults.pages.push({
          url: pageResult.url,
          path: pageResult.path,
          success: true,
          issues: issues,
          score: pageScore
        });
        
        totalScore += pageScore;
        processedResults.totalIssues += issueCount;
        
      } else {
        processedResults.failedPages++;
        processedResults.pages.push({
          url: pageResult.url,
          path: pageResult.path,
          success: false,
          error: pageResult.error,
          issues: [],
          score: 0
        });
      }
    });

    // 计算平均分数
    if (processedResults.successfulPages > 0) {
      processedResults.averageScore = Math.round(totalScore / processedResults.successfulPages);
    }

    return processedResults;
  }

  async generateReports(processedResults) {
    console.log('📊 生成分析报告...');

    const jsonFilename = `production-seo-analysis-${this.timestamp}.json`;
    const htmlFilename = `production-seo-analysis-${this.timestamp}.html`;
    const csvFilename = `production-seo-analysis-${this.timestamp}.csv`;

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
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>生产环境SEO分析报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; color: #007cba; }
        .pages { margin-top: 30px; }
        .page { background: white; margin: 10px 0; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .page h4 { margin: 0 0 10px 0; color: #333; }
        .issues { margin-top: 10px; }
        .issue { padding: 5px 10px; margin: 5px 0; border-radius: 4px; }
        .critical { background: #ffebee; border-left: 4px solid #f44336; }
        .error { background: #fff3e0; border-left: 4px solid #ff9800; }
        .warning { background: #f3e5f5; border-left: 4px solid #9c27b0; }
        .success { color: #4caf50; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 生产环境SEO分析报告</h1>
        <p><strong>网站:</strong> ${config.site}</p>
        <p><strong>分析时间:</strong> ${results.timestamp}</p>
        <p><strong>分析页面数:</strong> ${results.totalPages}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>总页面数</h3>
            <div class="value">${results.totalPages}</div>
        </div>
        <div class="metric">
            <h3>成功分析</h3>
            <div class="value">${results.successfulPages}</div>
        </div>
        <div class="metric">
            <h3>平均评分</h3>
            <div class="value">${results.averageScore}/100</div>
        </div>
        <div class="metric">
            <h3>总问题数</h3>
            <div class="value">${results.totalIssues}</div>
        </div>
    </div>

    <div class="pages">
        <h2>📄 页面详情</h2>
        ${results.pages.map(page => `
            <div class="page">
                <h4>${page.path} <span class="success">✅ 评分: ${page.score}/100</span></h4>
                <p><strong>URL:</strong> <a href="${page.url}" target="_blank">${page.url}</a></p>
                <div class="issues">
                    ${page.issues.length > 0 ? 
                        page.issues.map(issue => `<div class="issue ${issue.severity || 'warning'}">${issue.message || issue}</div>`).join('') :
                        '<div class="success">✅ 未发现SEO问题</div>'
                    }
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  generateCSVReport(results) {
    const headers = ['URL', 'Path', 'Score', 'Issues Count', 'Status'];
    const rows = results.pages.map(page => [
      page.url,
      page.path,
      page.score,
      page.issues.length,
      page.success ? 'Success' : 'Failed'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  displaySummary(results) {
    console.log('');
    console.log('🎉 生产环境SEO分析完成!');
    console.log('==================================================');
    console.log(`📊 总页面数: ${results.totalPages}`);
    console.log(`📈 平均SEO评分: ${results.averageScore}/100`);
    console.log(`⚠️  总问题数: ${results.totalIssues}`);
    console.log(`🔴 严重问题: ${results.criticalIssues}`);
    console.log(`🟠 错误: ${results.errors}`);
    console.log(`🟡 警告: ${results.warnings}`);
    console.log(`🔵 建议: ${results.suggestions}`);
    console.log('');
    console.log('📄 报告已保存到 seo-reports/ 目录');
    console.log('==================================================');
  }
}

// 运行分析
async function main() {
  try {
    const runner = new ProductionSEORunner();
    await runner.run();
  } catch (error) {
    console.error('分析失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ProductionSEORunner;
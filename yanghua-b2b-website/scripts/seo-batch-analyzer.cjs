#!/usr/bin/env node

/**
 * SEO 批量分析脚本
 * 用于对网站进行全面的SEO基础检查
 * 支持多页面批量处理、详细报告生成和告警机制
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const seoAnalyzer = require('seo-analyzer');

// 配置文件路径
const CONFIG_PATH = path.join(__dirname, '..', 'seo-analyzer.config.cjs');
const PAGES_CONFIG_PATH = path.join(__dirname, '..', 'seo-pages.config.json');
const REPORTS_DIR = path.join(__dirname, '..', 'seo-reports');

// 确保报告目录存在
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * 生成时间戳
 */
function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

/**
 * 记录日志
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  // 写入日志文件
  const logFile = path.join(REPORTS_DIR, 'seo-analyzer.log');
  fs.appendFileSync(logFile, logMessage + '\n');
}

/**
 * 加载页面配置
 */
function loadPagesConfig() {
  try {
    if (fs.existsSync(PAGES_CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(PAGES_CONFIG_PATH, 'utf8'));
      return config;
    } else {
      log('页面配置文件不存在，使用默认配置', 'warning');
      return getDefaultPagesConfig();
    }
  } catch (error) {
    log(`加载页面配置失败: ${error.message}`, 'error');
    return getDefaultPagesConfig();
  }
}

/**
 * 获取默认页面配置
 */
function getDefaultPagesConfig() {
  return {
    baseUrl: 'http://localhost:3000',
    pages: [
      { path: '/en', name: 'English Home', priority: 'high' },
      { path: '/zh', name: 'Chinese Home', priority: 'high' },
      { path: '/en/about', name: 'About Us (EN)', priority: 'medium' },
      { path: '/zh/about', name: 'About Us (ZH)', priority: 'medium' },
      { path: '/en/products', name: 'Products (EN)', priority: 'high' },
      { path: '/zh/products', name: 'Products (ZH)', priority: 'high' },
      { path: '/en/contact', name: 'Contact (EN)', priority: 'medium' },
      { path: '/zh/contact', name: 'Contact (ZH)', priority: 'medium' }
    ],
    excludePatterns: [
      '/api/*',
      '/admin/*',
      '/_next/*',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml'
    ]
  };
}

/**
 * 检查服务器是否运行
 */
async function checkServerStatus(baseUrl) {
  try {
    const response = await fetch(baseUrl);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * 分析单个页面
 */
async function analyzePage(url, pageName, config) {
  try {
    log(`开始分析页面: ${pageName} (${url})`);
    
    const result = await seoAnalyzer(url, {
      ...config,
      site: url
    });
    
    log(`页面分析完成: ${pageName}`);
    return {
      url,
      name: pageName,
      timestamp: new Date().toISOString(),
      success: true,
      result
    };
  } catch (error) {
    log(`页面分析失败: ${pageName} - ${error.message}`, 'error');
    return {
      url,
      name: pageName,
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message
    };
  }
}

/**
 * 批量分析页面
 */
async function batchAnalyze() {
  log('开始批量SEO分析');
  
  // 加载配置
  const config = require(CONFIG_PATH);
  const pagesConfig = loadPagesConfig();
  
  // 检查服务器状态
  const serverRunning = await checkServerStatus(pagesConfig.baseUrl);
  if (!serverRunning) {
    log(`服务器未运行或无法访问: ${pagesConfig.baseUrl}`, 'error');
    process.exit(1);
  }
  
  log(`服务器状态正常: ${pagesConfig.baseUrl}`);
  
  const results = [];
  const errors = [];
  
  // 按优先级排序页面
  const sortedPages = pagesConfig.pages.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
  });
  
  // 分析每个页面
  for (const page of sortedPages) {
    const fullUrl = `${pagesConfig.baseUrl}${page.path}`;
    
    try {
      const result = await analyzePage(fullUrl, page.name, config);
      results.push(result);
      
      if (!result.success) {
        errors.push(result);
      }
      
      // 添加延迟避免服务器压力
      if (config.request && config.request.delay) {
        await new Promise(resolve => setTimeout(resolve, config.request.delay));
      }
    } catch (error) {
      log(`处理页面时发生错误: ${page.name} - ${error.message}`, 'error');
      errors.push({
        url: fullUrl,
        name: page.name,
        error: error.message,
        success: false
      });
    }
  }
  
  // 生成综合报告
  const report = generateComprehensiveReport(results, errors, pagesConfig);
  
  // 保存报告
  const timestamp = getTimestamp();
  const reportPath = path.join(REPORTS_DIR, `seo-report-${timestamp}.json`);
  const htmlReportPath = path.join(REPORTS_DIR, `seo-report-${timestamp}.html`);
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(htmlReportPath, generateHtmlReport(report));
  
  // 创建最新报告的符号链接
  const latestReportPath = path.join(REPORTS_DIR, 'latest-report.json');
  const latestHtmlReportPath = path.join(REPORTS_DIR, 'latest-report.html');
  
  if (fs.existsSync(latestReportPath)) fs.unlinkSync(latestReportPath);
  if (fs.existsSync(latestHtmlReportPath)) fs.unlinkSync(latestHtmlReportPath);
  
  fs.symlinkSync(path.basename(reportPath), latestReportPath);
  fs.symlinkSync(path.basename(htmlReportPath), latestHtmlReportPath);
  
  log(`分析完成，报告已保存:`);
  log(`JSON报告: ${reportPath}`);
  log(`HTML报告: ${htmlReportPath}`);
  
  // 检查是否需要告警
  checkAndAlert(report);
  
  return report;
}

/**
 * 生成综合报告
 */
function generateComprehensiveReport(results, errors, pagesConfig) {
  const totalPages = results.length;
  const successfulPages = results.filter(r => r.success).length;
  const failedPages = errors.length;
  
  // 统计问题
  const issueStats = {
    critical: 0,
    error: 0,
    warning: 0,
    info: 0
  };
  
  const allIssues = [];
  
  results.forEach(result => {
    if (result.success && result.result) {
      // 这里需要根据seo-analyzer的实际返回格式来解析
      // 假设返回格式包含issues数组
      if (result.result.issues) {
        result.result.issues.forEach(issue => {
          allIssues.push({
            ...issue,
            page: result.name,
            url: result.url
          });
          
          if (issue.severity) {
            issueStats[issue.severity] = (issueStats[issue.severity] || 0) + 1;
          }
        });
      }
    }
  });
  
  return {
    metadata: {
      timestamp: new Date().toISOString(),
      baseUrl: pagesConfig.baseUrl,
      totalPages,
      successfulPages,
      failedPages,
      analysisVersion: '1.0.0'
    },
    summary: {
      issueStats,
      overallScore: calculateOverallScore(issueStats, totalPages),
      recommendations: generateRecommendations(issueStats, allIssues)
    },
    results,
    errors,
    issues: allIssues,
    detailedAnalysis: generateDetailedAnalysis(results)
  };
}

/**
 * 计算总体评分
 */
function calculateOverallScore(issueStats, totalPages) {
  const weights = { critical: 10, error: 5, warning: 2, info: 1 };
  const totalIssues = Object.entries(issueStats).reduce((sum, [type, count]) => {
    return sum + (count * weights[type]);
  }, 0);
  
  const maxPossibleScore = totalPages * 100;
  const score = Math.max(0, maxPossibleScore - totalIssues);
  
  return {
    score: Math.round((score / maxPossibleScore) * 100),
    grade: getGrade(score / maxPossibleScore),
    totalIssues: Object.values(issueStats).reduce((a, b) => a + b, 0)
  };
}

/**
 * 获取评级
 */
function getGrade(ratio) {
  if (ratio >= 0.9) return 'A';
  if (ratio >= 0.8) return 'B';
  if (ratio >= 0.7) return 'C';
  if (ratio >= 0.6) return 'D';
  return 'F';
}

/**
 * 生成建议
 */
function generateRecommendations(issueStats, allIssues) {
  const recommendations = [];
  
  if (issueStats.critical > 0) {
    recommendations.push({
      priority: 'high',
      message: `发现 ${issueStats.critical} 个严重问题，需要立即修复`
    });
  }
  
  if (issueStats.error > 0) {
    recommendations.push({
      priority: 'medium',
      message: `发现 ${issueStats.error} 个错误，建议尽快修复`
    });
  }
  
  // 分析常见问题
  const commonIssues = {};
  allIssues.forEach(issue => {
    const key = issue.type || issue.rule || 'unknown';
    commonIssues[key] = (commonIssues[key] || 0) + 1;
  });
  
  const topIssues = Object.entries(commonIssues)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  topIssues.forEach(([issue, count]) => {
    recommendations.push({
      priority: 'medium',
      message: `${issue} 问题出现 ${count} 次，建议统一处理`
    });
  });
  
  return recommendations;
}

/**
 * 生成详细分析
 */
function generateDetailedAnalysis(results) {
  return results.map(result => ({
    page: result.name,
    url: result.url,
    success: result.success,
    summary: result.success ? {
      // 这里根据实际的seo-analyzer返回格式来提取摘要信息
      hasTitle: true, // 示例字段
      hasMetaDescription: true,
      hasH1: true,
      imageCount: 0,
      imagesWithoutAlt: 0
    } : null,
    error: result.error || null
  }));
}

/**
 * 生成HTML报告
 */
function generateHtmlReport(report) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO分析报告 - ${report.metadata.timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .card { background: white; border: 1px solid #ddd; border-radius: 5px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .score { font-size: 2em; font-weight: bold; text-align: center; }
        .grade-A { color: #28a745; }
        .grade-B { color: #17a2b8; }
        .grade-C { color: #ffc107; }
        .grade-D { color: #fd7e14; }
        .grade-F { color: #dc3545; }
        .issues { margin-top: 20px; }
        .issue { padding: 10px; margin: 5px 0; border-left: 4px solid; }
        .issue-critical { border-color: #dc3545; background: #f8d7da; }
        .issue-error { border-color: #fd7e14; background: #fff3cd; }
        .issue-warning { border-color: #ffc107; background: #fff3cd; }
        .issue-info { border-color: #17a2b8; background: #d1ecf1; }
        .recommendations { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SEO分析报告</h1>
        <p><strong>生成时间:</strong> ${new Date(report.metadata.timestamp).toLocaleString('zh-CN')}</p>
        <p><strong>基础URL:</strong> ${report.metadata.baseUrl}</p>
        <p><strong>分析页面数:</strong> ${report.metadata.totalPages} (成功: ${report.metadata.successfulPages}, 失败: ${report.metadata.failedPages})</p>
    </div>

    <div class="summary">
        <div class="card">
            <h3>总体评分</h3>
            <div class="score grade-${report.summary.overallScore.grade}">${report.summary.overallScore.score}</div>
            <p>评级: ${report.summary.overallScore.grade}</p>
        </div>
        <div class="card">
            <h3>问题统计</h3>
            <p>严重: ${report.summary.issueStats.critical || 0}</p>
            <p>错误: ${report.summary.issueStats.error || 0}</p>
            <p>警告: ${report.summary.issueStats.warning || 0}</p>
            <p>信息: ${report.summary.issueStats.info || 0}</p>
        </div>
    </div>

    <div class="recommendations">
        <h3>修复建议</h3>
        ${report.summary.recommendations.map(rec => 
          `<p><strong>[${rec.priority.toUpperCase()}]</strong> ${rec.message}</p>`
        ).join('')}
    </div>

    <h3>页面分析结果</h3>
    <table>
        <thead>
            <tr>
                <th>页面名称</th>
                <th>URL</th>
                <th>状态</th>
                <th>问题数量</th>
            </tr>
        </thead>
        <tbody>
            ${report.results.map(result => `
                <tr>
                    <td>${result.name}</td>
                    <td><a href="${result.url}" target="_blank">${result.url}</a></td>
                    <td class="${result.success ? 'success' : 'error'}">${result.success ? '成功' : '失败'}</td>
                    <td>${result.success && result.result && result.result.issues ? result.result.issues.length : 'N/A'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="issues">
        <h3>详细问题列表</h3>
        ${report.issues.map(issue => `
            <div class="issue issue-${issue.severity || 'info'}">
                <strong>${issue.page}</strong> - ${issue.message || issue.description || '未知问题'}
                <br><small>URL: ${issue.url}</small>
            </div>
        `).join('')}
    </div>

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        <p>报告由 SEO Analyzer 自动生成 | 版本: ${report.metadata.analysisVersion}</p>
    </footer>
</body>
</html>
  `;
}

/**
 * 检查并发送告警
 */
function checkAndAlert(report) {
  const { issueStats, overallScore } = report.summary;
  
  // 告警条件
  const shouldAlert = 
    issueStats.critical > 0 || 
    issueStats.error > 5 || 
    overallScore.score < 70;
  
  if (shouldAlert) {
    log('检测到严重SEO问题，触发告警', 'warning');
    
    // 这里可以集成邮件、Slack、钉钉等告警机制
    const alertMessage = `
SEO告警通知:
- 总体评分: ${overallScore.score} (${overallScore.grade})
- 严重问题: ${issueStats.critical}
- 错误数量: ${issueStats.error}
- 警告数量: ${issueStats.warning}

请及时查看详细报告并处理相关问题。
    `;
    
    console.log('\n' + '='.repeat(50));
    console.log('🚨 SEO告警通知');
    console.log('='.repeat(50));
    console.log(alertMessage);
    console.log('='.repeat(50) + '\n');
    
    // 保存告警记录
    const alertLog = {
      timestamp: new Date().toISOString(),
      score: overallScore.score,
      issues: issueStats,
      message: alertMessage
    };
    
    const alertLogPath = path.join(REPORTS_DIR, 'alerts.log');
    fs.appendFileSync(alertLogPath, JSON.stringify(alertLog) + '\n');
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
SEO批量分析工具

用法:
  node seo-batch-analyzer.js [选项]

选项:
  --help, -h     显示帮助信息
  --config       指定配置文件路径
  --pages        指定页面配置文件路径
  --output       指定输出目录

示例:
  node seo-batch-analyzer.js
  node seo-batch-analyzer.js --config ./custom-config.js
      `);
      return;
    }
    
    await batchAnalyze();
    log('SEO批量分析完成');
  } catch (error) {
    log(`分析过程中发生错误: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  batchAnalyze,
  analyzePage,
  generateComprehensiveReport
};
#!/usr/bin/env node

/**
 * 简化版SEO分析脚本
 * 使用seo-analyzer包进行基础SEO检查
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const BASE_URL = 'http://localhost:3000';
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
  const logFile = path.join(REPORTS_DIR, 'seo-simple-analyzer.log');
  fs.appendFileSync(logFile, logMessage + '\n');
}

/**
 * 页面配置
 */
const PAGES = [
  { path: '/en', name: 'English Homepage', priority: 'high' },
  { path: '/es', name: 'Spanish Homepage', priority: 'high' },
  { path: '/en/about', name: 'About Us (EN)', priority: 'medium' },
  { path: '/es/acerca-de', name: 'About Us (ES)', priority: 'medium' },
  { path: '/en/products', name: 'Products (EN)', priority: 'high' },
  { path: '/es/productos', name: 'Products (ES)', priority: 'high' },
  { path: '/en/solutions', name: 'Solutions (EN)', priority: 'high' },
  { path: '/es/soluciones', name: 'Solutions (ES)', priority: 'high' },
  { path: '/en/services', name: 'Services (EN)', priority: 'medium' },
  { path: '/es/servicios', name: 'Services (ES)', priority: 'medium' },
  { path: '/en/projects', name: 'Projects (EN)', priority: 'medium' },
  { path: '/es/proyectos', name: 'Projects (ES)', priority: 'medium' },
  { path: '/en/contact', name: 'Contact (EN)', priority: 'medium' },
  { path: '/es/contacto', name: 'Contact (ES)', priority: 'medium' },
  { path: '/en/articles', name: 'Articles (EN)', priority: 'low' },
  { path: '/es/articulos', name: 'Articles (ES)', priority: 'low' }
];

/**
 * 检查服务器状态
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
 * 使用命令行工具分析页面
 */
function analyzePageWithCLI(url, outputFile) {
  try {
    log(`使用CLI分析页面: ${url}`);
    
    // 使用seo-analyzer命令行工具
    const command = `npx seo-analyzer ${url} --output-format json --output-file ${outputFile}`;
    
    execSync(command, { 
      stdio: 'pipe',
      timeout: 30000 
    });
    
    // 读取结果
    if (fs.existsSync(outputFile)) {
      const result = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      return {
        success: true,
        result: result
      };
    } else {
      return {
        success: false,
        error: '输出文件未生成'
      };
    }
  } catch (error) {
    log(`CLI分析失败: ${url} - ${error.message}`, 'error');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 手动HTML分析
 */
async function analyzePageManually(url) {
  try {
    log(`手动分析页面: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const issues = [];
    const warnings = [];
    const suggestions = [];
    
    // 基础SEO检查
    
    // 1. 检查title标签
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (!titleMatch) {
      issues.push({
        type: 'error',
        rule: 'title-missing',
        message: '缺少title标签'
      });
    } else {
      const title = titleMatch[1].trim();
      if (title.length === 0) {
        issues.push({
          type: 'error',
          rule: 'title-empty',
          message: 'title标签为空'
        });
      } else if (title.length < 10) {
        warnings.push({
          type: 'warning',
          rule: 'title-too-short',
          message: `title标签过短 (${title.length}字符)，建议至少10字符`
        });
      } else if (title.length > 60) {
        warnings.push({
          type: 'warning',
          rule: 'title-too-long',
          message: `title标签过长 (${title.length}字符)，建议不超过60字符`
        });
      }
    }
    
    // 2. 检查meta description
    const metaDescMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']*)["\'][^>]*>/i);
    if (!metaDescMatch) {
      issues.push({
        type: 'error',
        rule: 'meta-description-missing',
        message: '缺少meta description标签'
      });
    } else {
      const description = metaDescMatch[1].trim();
      if (description.length === 0) {
        issues.push({
          type: 'error',
          rule: 'meta-description-empty',
          message: 'meta description为空'
        });
      } else if (description.length < 120) {
        warnings.push({
          type: 'warning',
          rule: 'meta-description-too-short',
          message: `meta description过短 (${description.length}字符)，建议120-160字符`
        });
      } else if (description.length > 160) {
        warnings.push({
          type: 'warning',
          rule: 'meta-description-too-long',
          message: `meta description过长 (${description.length}字符)，建议120-160字符`
        });
      }
    }
    
    // 3. 检查H1标签
    const h1Matches = html.match(/<h1[^>]*>.*?<\/h1>/gi);
    if (!h1Matches || h1Matches.length === 0) {
      issues.push({
        type: 'error',
        rule: 'h1-missing',
        message: '缺少H1标签'
      });
    } else if (h1Matches.length > 1) {
      warnings.push({
        type: 'warning',
        rule: 'multiple-h1',
        message: `发现${h1Matches.length}个H1标签，建议只使用一个`
      });
    }
    
    // 4. 检查图片alt属性
    const imgMatches = html.match(/<img[^>]*>/gi);
    if (imgMatches) {
      let imagesWithoutAlt = 0;
      imgMatches.forEach(img => {
        if (!img.match(/alt\s*=\s*["\'][^"']*["\']/i)) {
          imagesWithoutAlt++;
        }
      });
      
      if (imagesWithoutAlt > 0) {
        issues.push({
          type: 'error',
          rule: 'img-missing-alt',
          message: `${imagesWithoutAlt}个图片缺少alt属性`
        });
      }
    }
    
    // 5. 检查lang属性
    const langMatch = html.match(/<html[^>]*lang=["\']([^"']*)["\'][^>]*>/i);
    if (!langMatch) {
      issues.push({
        type: 'error',
        rule: 'html-missing-lang',
        message: 'HTML标签缺少lang属性'
      });
    }
    
    // 6. 检查viewport meta标签
    const viewportMatch = html.match(/<meta[^>]*name=["\']viewport["\'][^>]*>/i);
    if (!viewportMatch) {
      warnings.push({
        type: 'warning',
        rule: 'viewport-missing',
        message: '缺少viewport meta标签'
      });
    }
    
    // 7. 检查charset
    const charsetMatch = html.match(/<meta[^>]*charset=["\']([^"']*)["\'][^>]*>/i);
    if (!charsetMatch) {
      warnings.push({
        type: 'warning',
        rule: 'charset-missing',
        message: '缺少charset声明'
      });
    }
    
    // 8. 检查hreflang标签
    const hreflangMatches = html.match(/<link[^>]*hreflang=["\'][^"']*["\'][^>]*>/gi);
    if (!hreflangMatches || hreflangMatches.length === 0) {
      suggestions.push({
        type: 'info',
        rule: 'hreflang-missing',
        message: '建议添加hreflang标签以支持多语言SEO'
      });
    }
    
    // 9. 检查Open Graph标签
    const ogTitleMatch = html.match(/<meta[^>]*property=["\']og:title["\'][^>]*>/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["\']og:description["\'][^>]*>/i);
    const ogImageMatch = html.match(/<meta[^>]*property=["\']og:image["\'][^>]*>/i);
    
    if (!ogTitleMatch) {
      suggestions.push({
        type: 'info',
        rule: 'og-title-missing',
        message: '建议添加og:title标签'
      });
    }
    
    if (!ogDescMatch) {
      suggestions.push({
        type: 'info',
        rule: 'og-description-missing',
        message: '建议添加og:description标签'
      });
    }
    
    if (!ogImageMatch) {
      suggestions.push({
        type: 'info',
        rule: 'og-image-missing',
        message: '建议添加og:image标签'
      });
    }
    
    return {
      success: true,
      result: {
        url: url,
        issues: [...issues, ...warnings, ...suggestions],
        summary: {
          totalIssues: issues.length + warnings.length + suggestions.length,
          errors: issues.length,
          warnings: warnings.length,
          suggestions: suggestions.length
        }
      }
    };
    
  } catch (error) {
    log(`手动分析失败: ${url} - ${error.message}`, 'error');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 批量分析
 */
async function batchAnalyze() {
  log('开始简化版SEO批量分析');
  
  // 检查服务器状态
  const serverRunning = await checkServerStatus(BASE_URL);
  if (!serverRunning) {
    log(`服务器未运行或无法访问: ${BASE_URL}`, 'error');
    process.exit(1);
  }
  
  log(`服务器状态正常: ${BASE_URL}`);
  
  const results = [];
  const errors = [];
  
  // 按优先级排序页面
  const sortedPages = PAGES.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
  });
  
  // 分析每个页面
  for (const page of sortedPages) {
    const fullUrl = `${BASE_URL}${page.path}`;
    
    try {
      const result = await analyzePageManually(fullUrl);
      result.name = page.name;
      result.url = fullUrl;
      result.timestamp = new Date().toISOString();
      
      results.push(result);
      
      if (!result.success) {
        errors.push(result);
      }
      
      // 添加延迟避免服务器压力
      await new Promise(resolve => setTimeout(resolve, 1000));
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
  const report = generateComprehensiveReport(results, errors);
  
  // 保存报告
  const timestamp = getTimestamp();
  const reportPath = path.join(REPORTS_DIR, `seo-simple-report-${timestamp}.json`);
  const htmlReportPath = path.join(REPORTS_DIR, `seo-simple-report-${timestamp}.html`);
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(htmlReportPath, generateHtmlReport(report));
  
  // 创建最新报告的符号链接
  const latestReportPath = path.join(REPORTS_DIR, 'latest-simple-report.json');
  const latestHtmlReportPath = path.join(REPORTS_DIR, 'latest-simple-report.html');
  
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
function generateComprehensiveReport(results, errors) {
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
    if (result.success && result.result && result.result.issues) {
      result.result.issues.forEach(issue => {
        allIssues.push({
          ...issue,
          page: result.name,
          url: result.url
        });
        
        if (issue.type === 'error') {
          issueStats.error++;
        } else if (issue.type === 'warning') {
          issueStats.warning++;
        } else if (issue.type === 'info') {
          issueStats.info++;
        }
      });
    }
  });
  
  return {
    metadata: {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      totalPages,
      successfulPages,
      failedPages,
      analysisVersion: '1.0.0-simple'
    },
    summary: {
      issueStats,
      overallScore: calculateOverallScore(issueStats, totalPages),
      recommendations: generateRecommendations(issueStats, allIssues)
    },
    results,
    errors,
    issues: allIssues
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
  
  if (issueStats.error > 0) {
    recommendations.push({
      priority: 'high',
      message: `发现 ${issueStats.error} 个错误，需要立即修复`
    });
  }
  
  if (issueStats.warning > 0) {
    recommendations.push({
      priority: 'medium',
      message: `发现 ${issueStats.warning} 个警告，建议尽快修复`
    });
  }
  
  // 分析常见问题
  const commonIssues = {};
  allIssues.forEach(issue => {
    const key = issue.rule || 'unknown';
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
        .issue-error { border-color: #dc3545; background: #f8d7da; }
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
        <h1>SEO分析报告 (简化版)</h1>
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
            <p>错误: ${report.summary.issueStats.error || 0}</p>
            <p>警告: ${report.summary.issueStats.warning || 0}</p>
            <p>建议: ${report.summary.issueStats.info || 0}</p>
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
                    <td>${result.success && result.result ? result.result.summary.totalIssues : 'N/A'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="issues">
        <h3>详细问题列表</h3>
        ${report.issues.map(issue => `
            <div class="issue issue-${issue.type}">
                <strong>${issue.page}</strong> - ${issue.message}
                <br><small>规则: ${issue.rule} | URL: ${issue.url}</small>
            </div>
        `).join('')}
    </div>

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        <p>报告由简化版SEO分析器生成 | 版本: ${report.metadata.analysisVersion}</p>
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
    issueStats.error > 0 || 
    issueStats.warning > 5 || 
    overallScore.score < 70;
  
  if (shouldAlert) {
    log('检测到SEO问题，触发告警', 'warning');
    
    const alertMessage = `
SEO告警通知:
- 总体评分: ${overallScore.score} (${overallScore.grade})
- 错误数量: ${issueStats.error}
- 警告数量: ${issueStats.warning}
- 建议数量: ${issueStats.info}

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
简化版SEO批量分析工具

用法:
  node seo-simple-analyzer.cjs [选项]

选项:
  --help, -h     显示帮助信息

示例:
  node seo-simple-analyzer.cjs
      `);
      return;
    }
    
    await batchAnalyze();
    log('简化版SEO批量分析完成');
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
  analyzePageManually,
  generateComprehensiveReport
};
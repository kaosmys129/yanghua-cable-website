import { promises as fs } from 'fs';
import path from 'path';
import { ErrorReportGenerator } from '../tests/e2e/error-report-generator';

interface ErrorReport {
  timestamp: string;
  url: string;
  userAgent: string;
  viewport: string;
  errors: {
    consoleErrors: Array<any>;
    networkErrors: Array<any>;
    javascriptErrors: Array<any>;
    performanceIssues: Array<any>;
  };
  pageLoadMetrics: {
    domContentLoaded: number;
    loadComplete: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  };
}

/**
 * 错误收集和报告生成脚本
 * 用于运行错误收集测试并生成HTML报告
 */
async function runErrorCollection() {
  console.log('🚀 开始运行错误收集测试...\n');
  
  try {
    // 检查错误收集报告是否存在
    const reportPath = path.join(process.cwd(), 'test-results', 'error-collection-report.json');
    
    let reportData;
    try {
      const reportContent = await fs.readFile(reportPath, 'utf8');
      reportData = JSON.parse(reportContent);
    } catch (error) {
      console.log('❌ 未找到错误收集报告，请先运行测试');
      console.log('请执行: npm run test:error-collection');
      return;
    }

    console.log(`📊 发现测试报告，包含 ${reportData.reports.length} 个页面的测试结果`);
    console.log(`📈 总计发现 ${reportData.totalErrors} 个错误\n`);

    // 生成HTML报告
    console.log('📝 正在生成HTML错误报告...');
    const htmlReportPath = await ErrorReportGenerator.generateHTMLReport(reportData);
    
    console.log(`✅ HTML错误报告已生成: ${htmlReportPath}`);
    console.log('\n📋 报告包含以下内容:');
    console.log('  • 错误统计概览');
    console.log('  • 控制台错误详情');
    console.log('  • 网络请求错误');
    console.log('  • JavaScript运行时错误');
    console.log('  • 页面性能问题');
    console.log('  • 详细性能指标');

    // 输出错误统计
    const { reports }: { reports: ErrorReport[] } = reportData;
    const stats = {
      consoleErrors: reports.reduce((sum: number, r: ErrorReport) => sum + r.errors.consoleErrors.length, 0),
      networkErrors: reports.reduce((sum: number, r: ErrorReport) => sum + r.errors.networkErrors.length, 0),
      jsErrors: reports.reduce((sum: number, r: ErrorReport) => sum + r.errors.javascriptErrors.length, 0),
      performanceIssues: reports.reduce((sum: number, r: ErrorReport) => sum + r.errors.performanceIssues.length, 0)
    };

    console.log('\n📊 错误统计:');
    console.log(`  🚨 控制台错误: ${stats.consoleErrors}`);
    console.log(`  🌐 网络错误: ${stats.networkErrors}`);
    console.log(`  ⚡ JavaScript错误: ${stats.jsErrors}`);
    console.log(`  🔥 性能问题: ${stats.performanceIssues}`);

    // 显示最慢的页面
    const slowestPages = reports
      .sort((a: ErrorReport, b: ErrorReport) => b.pageLoadMetrics.loadComplete - a.pageLoadMetrics.loadComplete)
      .slice(0, 3);

    if (slowestPages.length > 0) {
      console.log('\n🐌 加载最慢的页面:');
      slowestPages.forEach((page, index) => {
        console.log(`  ${index + 1}. ${page.url} - ${page.pageLoadMetrics.loadComplete}ms`);
      });
    }

    // 显示错误最多的页面
    const pageErrors = reports.map(report => ({
      url: report.url,
      errorCount: report.errors.consoleErrors.length + 
                  report.errors.networkErrors.length + 
                  report.errors.javascriptErrors.length + 
                  report.errors.performanceIssues.length
    }))
    .filter(page => page.errorCount > 0)
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 3);

    if (pageErrors.length > 0) {
      console.log('\n❌ 错误最多的页面:');
      pageErrors.forEach((page, index) => {
        console.log(`  ${index + 1}. ${page.url} - ${page.errorCount}个错误`);
      });
    }

    console.log(`\n🎉 错误收集完成！可以在浏览器中打开以下文件查看详细报告:`);
    console.log(`file://${htmlReportPath}`);

  } catch (error) {
    console.error('❌ 错误收集失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runErrorCollection();
}

export { runErrorCollection };
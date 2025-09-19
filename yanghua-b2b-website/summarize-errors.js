import { promises as fs } from 'fs';
import path from 'path';

async function summarizeErrors() {
  try {
    const reportPath = path.join(process.cwd(), 'test-results', 'error-collection-report.json');
    const reportContent = await fs.readFile(reportPath, 'utf8');
    const reportData = JSON.parse(reportContent);
    
    console.log('📊 阳华B2B网站错误收集报告总结');
    console.log('=' .repeat(50));
    console.log(`📅 生成时间: ${new Date(reportData.generatedAt).toLocaleString('zh-CN')}`);
    console.log(`🔍 测试页面数: ${reportData.reports.length}`);
    console.log(`❌ 总错误数: ${reportData.totalErrors}`);
    console.log();

    // 按错误类型统计
    let totalConsoleErrors = 0;
    let totalNetworkErrors = 0;
    let totalJsErrors = 0;
    let totalPerfIssues = 0;

    const missingImages = new Set();
    const problematicPages = [];

    reportData.reports.forEach(report => {
      const consoleErrors = report.errors.consoleErrors.length;
      const networkErrors = report.errors.networkErrors.length;
      const jsErrors = report.errors.javascriptErrors.length;
      const perfIssues = report.errors.performanceIssues.length;

      totalConsoleErrors += consoleErrors;
      totalNetworkErrors += networkErrors;
      totalJsErrors += jsErrors;
      totalPerfIssues += perfIssues;

      // 记录有问题的页面
      if (consoleErrors + networkErrors + jsErrors + perfIssues > 0) {
        problematicPages.push({
          url: report.url,
          consoleErrors,
          networkErrors,
          jsErrors,
          perfIssues,
          total: consoleErrors + networkErrors + jsErrors + perfIssues,
          loadTime: report.pageLoadMetrics.loadComplete
        });
      }

      // 收集缺失的图片
      report.errors.networkErrors.forEach(error => {
        if (error.status === 404 && error.url.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
          missingImages.add(error.url);
        }
      });
    });

    console.log('📈 错误类型统计:');
    console.log(`   🚨 控制台错误: ${totalConsoleErrors}`);
    console.log(`   🌐 网络错误: ${totalNetworkErrors}`);
    console.log(`   ⚡ JavaScript错误: ${totalJsErrors}`);
    console.log(`   🔥 性能问题: ${totalPerfIssues}`);
    console.log();

    if (problematicPages.length > 0) {
      console.log('🔍 有问题的页面详情:');
      problematicPages
        .sort((a, b) => b.total - a.total)
        .forEach((page, index) => {
          console.log(`   ${index + 1}. ${page.url}`);
          console.log(`      • 总错误: ${page.total} (控制台:${page.consoleErrors}, 网络:${page.networkErrors}, JS:${page.jsErrors}, 性能:${page.perfIssues})`);
          console.log(`      • 加载时间: ${page.loadTime}ms`);
        });
      console.log();
    }

    if (missingImages.size > 0) {
      console.log('🖼️ 缺失的图片文件 (404错误):');
      Array.from(missingImages)
        .sort()
        .forEach((image, index) => {
          const imageName = image.split('/').pop();
          const imagePath = image.replace('http://localhost:3000', '');
          console.log(`   ${index + 1}. ${imageName}`);
          console.log(`      路径: ${imagePath}`);
        });
      console.log();
    }

    // 生成修复建议
    console.log('🔧 修复建议:');
    console.log();
    
    if (missingImages.size > 0) {
      console.log('1. 图片资源问题:');
      console.log('   • 检查以下图片文件是否存在于 public/ 目录中');
      console.log('   • 确保图片文件名和路径大小写匹配');
      console.log('   • 考虑使用占位图片替代缺失的资源');
      console.log();
    }

    if (totalConsoleErrors > totalNetworkErrors) {
      console.log('2. Next.js图片优化问题:');
      console.log('   • 检查 next.config.js 中的图片配置');
      console.log('   • 确保使用 Next.js Image 组件的图片路径正确');
      console.log('   • 验证图片优化API是否正常工作');
      console.log();
    }

    if (reportData.reports.some(r => r.url.includes('/projects') && r.errors.javascriptErrors.some(e => e.message.includes('TOO_MANY_REDIRECTS')))) {
      console.log('3. 路由重定向问题:');
      console.log('   • 检查 /en/projects 页面的路由配置');
      console.log('   • 查看是否存在循环重定向');
      console.log('   • 验证中间件配置是否正确');
      console.log();
    }

    console.log('4. 总体建议:');
    console.log('   • 优先修复404图片资源问题');
    console.log('   • 检查API端点是否正常工作');
    console.log('   • 添加错误边界处理缺失资源');
    console.log('   • 考虑实施资源预加载策略');
    console.log();

    console.log('📋 完整HTML报告地址:');
    console.log(`   file://${path.join(process.cwd(), 'test-results', 'error-report.html')}`);
    console.log();

    console.log('🚀 下次运行测试命令:');
    console.log('   npm run error-analysis  # 运行完整的错误收集和分析');
    console.log('   npm run test:error-collection  # 仅运行错误收集测试');

  } catch (error) {
    console.error('❌ 读取错误报告失败:', error);
  }
}

summarizeErrors();
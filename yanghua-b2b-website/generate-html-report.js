import { promises as fs } from 'fs';
import path from 'path';
import { ErrorReportGenerator } from './tests/e2e/error-report-generator.js';

async function generateHTMLReport() {
  try {
    const reportPath = path.join(process.cwd(), 'test-results', 'error-collection-report.json');
    const reportContent = await fs.readFile(reportPath, 'utf8');
    const reportData = JSON.parse(reportContent);
    
    console.log('🚀 开始生成HTML错误报告...\n');
    console.log(`📊 发现测试报告，包含 ${reportData.reports.length} 个页面的测试结果`);
    console.log(`📈 总计发现 ${reportData.totalErrors} 个错误\n`);

    const htmlReportPath = await ErrorReportGenerator.generateHTMLReport(reportData);
    
    console.log(`✅ HTML错误报告已生成: ${htmlReportPath}`);
    console.log(`🎉 可以在浏览器中打开以下文件查看详细报告:`);
    console.log(`file://${htmlReportPath}`);
    
  } catch (error) {
    console.error('❌ 生成HTML报告失败:', error);
  }
}

generateHTMLReport();
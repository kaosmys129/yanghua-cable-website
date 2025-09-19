import { promises as fs } from 'fs';
import path from 'path';

async function checkProjectStatus() {
  console.log('🔍 阳华B2B网站项目状态检查');
  console.log('=' .repeat(40));
  
  try {
    // 检查是否有最新的错误报告
    const testResultsPath = path.join(process.cwd(), 'test-results');
    const reportPath = path.join(testResultsPath, 'error-collection-report.json');
    
    let hasRecentReport = false;
    let reportAge = 0;
    
    try {
      const reportStat = await fs.stat(reportPath);
      const reportTime = reportStat.mtime;
      reportAge = Math.floor((Date.now() - reportTime.getTime()) / (1000 * 60)); // 分钟
      hasRecentReport = reportAge < 60; // 一小时内的报告认为是最新的
      
      console.log(`📊 错误报告状态:`);
      console.log(`   • 最后更新: ${reportAge}分钟前`);
      console.log(`   • 状态: ${hasRecentReport ? '✅ 最新' : '⚠️ 需要更新'}`);
    } catch (error) {
      console.log(`📊 错误报告状态:`);
      console.log(`   • 状态: ❌ 未找到报告`);
      console.log(`   • 建议: 运行 npm run error-analysis`);
    }
    
    console.log();
    
    // 检查公共图片目录
    const publicImagesPath = path.join(process.cwd(), 'public', 'images');
    try {
      const imagesDirs = await fs.readdir(publicImagesPath);
      console.log(`🖼️ 图片目录状态:`);
      console.log(`   • 找到图片目录: ${imagesDirs.length}个`);
      console.log(`   • 目录列表: ${imagesDirs.join(', ')}`);
      
      // 检查缺失的关键目录
      const requiredDirs = ['about', 'certifications', 'homepage'];
      const missingDirs = requiredDirs.filter(dir => !imagesDirs.includes(dir));
      
      if (missingDirs.length > 0) {
        console.log(`   • ⚠️ 缺失目录: ${missingDirs.join(', ')}`);
      } else {
        console.log(`   • ✅ 关键目录完整`);
      }
    } catch (error) {
      console.log(`🖼️ 图片目录状态:`);
      console.log(`   • ❌ 无法访问 public/images 目录`);
    }
    
    console.log();
    
    // 检查开发服务器状态
    try {
      const response = await fetch('http://localhost:3000', { 
        signal: AbortSignal.timeout(3000) 
      });
      
      console.log(`🚀 开发服务器状态:`);
      if (response.ok) {
        console.log(`   • ✅ 运行正常 (状态码: ${response.status})`);
        console.log(`   • 访问地址: http://localhost:3000`);
      } else {
        console.log(`   • ⚠️ 响应异常 (状态码: ${response.status})`);
      }
    } catch (error) {
      console.log(`🚀 开发服务器状态:`);
      console.log(`   • ❌ 无法连接 (可能未启动)`);
      console.log(`   • 建议: 运行 npm run dev`);
    }
    
    console.log();
    
    // 提供行动建议
    console.log('📋 建议操作:');
    
    if (!hasRecentReport) {
      console.log('   1. 运行错误收集分析:');
      console.log('      npm run error-analysis');
      console.log();
    }
    
    console.log('   2. 查看详细报告:');
    console.log('      npm run test:summary  # 查看错误总结');
    console.log('      # 然后在浏览器中打开 test-results/error-report.html');
    console.log();
    
    console.log('   3. 启动开发服务器:');
    console.log('      npm run dev  # 如果还没有运行');
    console.log();
    
    console.log('   4. 修复常见问题:');
    console.log('      • 添加缺失的图片文件到 public/images/ 目录');
    console.log('      • 检查图片文件名大小写是否匹配');
    console.log('      • 验证路由配置是否正确');
    
  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error);
  }
}

checkProjectStatus();
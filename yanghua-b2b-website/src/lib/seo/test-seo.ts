/**
 * SEO模块功能测试
 * 这个文件用于测试SEO分析模块的基本功能
 */

import { KeywordAnalyzer, KeywordType } from './index';

// 测试关键词配置
const testKeywords = [
  { keyword: 'flexible busbar', type: KeywordType.CORE, priority: 10, targetDensity: 2.5 },
  { keyword: 'copper busbar', type: KeywordType.CORE, priority: 9, targetDensity: 2.0 },
  { keyword: 'electrical busbar', type: KeywordType.CORE, priority: 8, targetDensity: 1.8 }
];

/**
 * 测试基本功能
 */
async function testBasicFunctionality() {
  console.log('=== SEO模块基本功能测试 ===');
  
  try {
    // 创建分析器实例
    const analyzer = new KeywordAnalyzer('https://example.com', testKeywords);
    console.log('✓ KeywordAnalyzer 实例创建成功');
    
    // 测试配置方法
    analyzer.setMaxPages(10);
    analyzer.setCrawlDelay(500);
    console.log('✓ 配置方法调用成功');
    
    console.log('✓ SEO模块基本配置测试完成');
    console.log('  - 关键词数量:', testKeywords.length);
    console.log('  - 基础URL: https://example.com');
    console.log('  - 最大页面数: 10');
    console.log('  - 爬取延迟: 500ms');
    
    // 测试关键词配置
    testKeywords.forEach((keyword, index) => {
      console.log(`  - 关键词 ${index + 1}: "${keyword.keyword}" (${keyword.type}, 优先级: ${keyword.priority})`);
    });
    
    console.log('\n=== 测试完成 ===');
    console.log('SEO模块基本配置功能正常工作！');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testBasicFunctionality();
}

export { testBasicFunctionality };
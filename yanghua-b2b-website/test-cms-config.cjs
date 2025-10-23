/**
 * CMS 配置切换测试脚本
 * 测试项目在 Strapi 和 WordPress 之间的配置切换功能
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔧 CMS 配置切换测试开始...');
console.log('='.repeat(50));

// 读取当前环境变量
const currentConfig = {
  CMS_TYPE: process.env.CMS_TYPE,
  NEXT_PUBLIC_CMS_TYPE: process.env.NEXT_PUBLIC_CMS_TYPE,
  ENABLE_WORDPRESS: process.env.ENABLE_WORDPRESS,
  ENABLE_STRAPI: process.env.ENABLE_STRAPI,
  
  // WordPress 配置
  WORDPRESS_BASE_URL: process.env.WORDPRESS_BASE_URL,
  NEXT_PUBLIC_WORDPRESS_BASE_URL: process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL,
  NEXT_PUBLIC_WORDPRESS_API_URL: process.env.NEXT_PUBLIC_WORDPRESS_API_URL,
  
  // Strapi 配置
  STRAPI_BASE_URL: process.env.STRAPI_BASE_URL,
  NEXT_PUBLIC_STRAPI_URL: process.env.NEXT_PUBLIC_STRAPI_URL,
  STRAPI_API_TOKEN: process.env.STRAPI_API_TOKEN ? '***已设置***' : undefined
};

console.log('📋 当前环境变量配置:');
console.log('='.repeat(30));

Object.entries(currentConfig).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  console.log(`${status} ${key}: ${value || '未设置'}`);
});

console.log('\n🔍 CMS 配置分析:');
console.log('='.repeat(30));

// 分析当前配置
const analysis = {
  currentCMS: currentConfig.CMS_TYPE || currentConfig.NEXT_PUBLIC_CMS_TYPE || '未设置',
  wordpressEnabled: currentConfig.ENABLE_WORDPRESS === 'true',
  strapiEnabled: currentConfig.ENABLE_STRAPI === 'true',
  wordpressConfigured: !!(currentConfig.WORDPRESS_BASE_URL && currentConfig.NEXT_PUBLIC_WORDPRESS_BASE_URL),
  strapiConfigured: !!(currentConfig.STRAPI_BASE_URL && currentConfig.NEXT_PUBLIC_STRAPI_URL)
};

console.log(`🎯 当前 CMS 类型: ${analysis.currentCMS}`);
console.log(`📝 WordPress 启用: ${analysis.wordpressEnabled ? '是' : '否'}`);
console.log(`📝 Strapi 启用: ${analysis.strapiEnabled ? '是' : '否'}`);
console.log(`⚙️  WordPress 配置完整: ${analysis.wordpressConfigured ? '是' : '否'}`);
console.log(`⚙️  Strapi 配置完整: ${analysis.strapiConfigured ? '是' : '否'}`);

// 配置验证
console.log('\n🧪 配置验证:');
console.log('='.repeat(30));

const validationResults = [];

// 验证 WordPress 配置
if (analysis.currentCMS === 'wordpress') {
  if (analysis.wordpressConfigured && analysis.wordpressEnabled) {
    validationResults.push({
      test: 'WordPress 配置验证',
      status: 'PASS',
      message: 'WordPress 配置完整且已启用'
    });
  } else {
    validationResults.push({
      test: 'WordPress 配置验证',
      status: 'FAIL',
      message: 'WordPress 配置不完整或未启用'
    });
  }
}

// 验证 Strapi 配置
if (analysis.currentCMS === 'strapi') {
  if (analysis.strapiConfigured && analysis.strapiEnabled) {
    validationResults.push({
      test: 'Strapi 配置验证',
      status: 'PASS',
      message: 'Strapi 配置完整且已启用'
    });
  } else {
    validationResults.push({
      test: 'Strapi 配置验证',
      status: 'FAIL',
      message: 'Strapi 配置不完整或未启用'
    });
  }
}

// 验证配置一致性
const cmsTypeConsistent = currentConfig.CMS_TYPE === currentConfig.NEXT_PUBLIC_CMS_TYPE;
validationResults.push({
  test: 'CMS 类型一致性',
  status: cmsTypeConsistent ? 'PASS' : 'FAIL',
  message: cmsTypeConsistent ? 'CMS_TYPE 和 NEXT_PUBLIC_CMS_TYPE 一致' : 'CMS_TYPE 和 NEXT_PUBLIC_CMS_TYPE 不一致'
});

// 验证 URL 配置
if (analysis.currentCMS === 'wordpress') {
  const wordpressUrlConsistent = currentConfig.WORDPRESS_BASE_URL === currentConfig.NEXT_PUBLIC_WORDPRESS_BASE_URL;
  validationResults.push({
    test: 'WordPress URL 一致性',
    status: wordpressUrlConsistent ? 'PASS' : 'FAIL',
    message: wordpressUrlConsistent ? 'WordPress URL 配置一致' : 'WordPress URL 配置不一致'
  });
}

// 显示验证结果
validationResults.forEach(result => {
  const icon = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${result.test}: ${result.message}`);
});

// 汇总结果
const passCount = validationResults.filter(r => r.status === 'PASS').length;
const failCount = validationResults.filter(r => r.status === 'FAIL').length;

console.log('\n📊 验证结果汇总:');
console.log('='.repeat(30));
console.log(`✅ 通过: ${passCount}`);
console.log(`❌ 失败: ${failCount}`);
console.log(`📈 总计: ${validationResults.length}`);

// 提供建议
console.log('\n💡 配置建议:');
console.log('='.repeat(30));

if (analysis.currentCMS === 'wordpress') {
  if (!analysis.wordpressConfigured) {
    console.log('⚠️  建议: 完善 WordPress 配置，确保设置了所有必需的环境变量');
  }
  if (!analysis.wordpressEnabled) {
    console.log('⚠️  建议: 设置 ENABLE_WORDPRESS=true 启用 WordPress');
  }
  if (analysis.strapiEnabled) {
    console.log('💡 建议: 当前使用 WordPress，可以设置 ENABLE_STRAPI=false 禁用 Strapi');
  }
} else if (analysis.currentCMS === 'strapi') {
  if (!analysis.strapiConfigured) {
    console.log('⚠️  建议: 完善 Strapi 配置，确保设置了所有必需的环境变量');
  }
  if (!analysis.strapiEnabled) {
    console.log('⚠️  建议: 设置 ENABLE_STRAPI=true 启用 Strapi');
  }
  if (analysis.wordpressEnabled) {
    console.log('💡 建议: 当前使用 Strapi，可以设置 ENABLE_WORDPRESS=false 禁用 WordPress');
  }
} else {
  console.log('⚠️  建议: 设置 CMS_TYPE 和 NEXT_PUBLIC_CMS_TYPE 为 "wordpress" 或 "strapi"');
}

// 保存测试结果
const testReport = {
  timestamp: new Date().toISOString(),
  currentConfig: analysis,
  environmentVariables: currentConfig,
  validationResults: validationResults,
  summary: {
    total: validationResults.length,
    passed: passCount,
    failed: failCount
  }
};

require('fs').writeFileSync(
  'cms-config-test-report.json',
  JSON.stringify(testReport, null, 2)
);

console.log('\n📄 配置测试报告已保存到: cms-config-test-report.json');

if (failCount === 0) {
  console.log('\n🎉 CMS 配置验证通过！');
} else {
  console.log('\n⚠️  CMS 配置存在问题，请检查上述建议。');
}
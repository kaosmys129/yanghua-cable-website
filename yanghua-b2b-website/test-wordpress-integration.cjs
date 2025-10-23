/**
 * WordPress REST API 集成测试脚本
 * 测试 Next.js 项目与 WordPress 的集成
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// WordPress API 配置
const WORDPRESS_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL || 'http://localhost:8080';
const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || `${WORDPRESS_BASE_URL}/wp-json/wp/v2`;

console.log('🔧 WordPress 集成测试开始...');
console.log(`📍 WordPress Base URL: ${WORDPRESS_BASE_URL}`);
console.log(`🔗 WordPress API URL: ${WORDPRESS_API_URL}`);

// 测试函数
async function testWordPressAPI() {
  const tests = [
    {
      name: '测试 WordPress 服务器连接',
      url: WORDPRESS_BASE_URL,
      method: 'HEAD'
    },
    {
      name: '测试 REST API 根端点',
      url: `${WORDPRESS_BASE_URL}/wp-json/wp/v2/`,
      method: 'GET'
    },
    {
      name: '测试文章端点',
      url: `${WORDPRESS_API_URL}/posts`,
      method: 'GET'
    },
    {
      name: '测试页面端点',
      url: `${WORDPRESS_API_URL}/pages`,
      method: 'GET'
    },
    {
      name: '测试分类端点',
      url: `${WORDPRESS_API_URL}/categories`,
      method: 'GET'
    },
    {
      name: '测试标签端点',
      url: `${WORDPRESS_API_URL}/tags`,
      method: 'GET'
    },
    {
      name: '测试媒体端点',
      url: `${WORDPRESS_API_URL}/media`,
      method: 'GET'
    }
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`\n🧪 ${test.name}...`);
      
      const config = {
        method: test.method,
        url: test.url,
        timeout: 5000,
        headers: {
          'User-Agent': 'Next.js WordPress Integration Test'
        }
      };

      const response = await axios(config);
      
      const result = {
        test: test.name,
        status: 'PASS',
        statusCode: response.status,
        contentType: response.headers['content-type'],
        dataLength: test.method === 'GET' ? JSON.stringify(response.data).length : 0
      };

      if (test.method === 'GET' && Array.isArray(response.data)) {
        result.itemCount = response.data.length;
      }

      results.push(result);
      console.log(`✅ ${test.name} - 状态码: ${response.status}`);
      
      if (test.method === 'GET' && response.data) {
        if (Array.isArray(response.data)) {
          console.log(`   📊 返回 ${response.data.length} 个项目`);
        } else if (typeof response.data === 'object') {
          console.log(`   📄 返回对象，包含 ${Object.keys(response.data).length} 个字段`);
        }
      }

    } catch (error) {
      const result = {
        test: test.name,
        status: 'FAIL',
        error: error.message,
        statusCode: error.response?.status || 'N/A'
      };

      results.push(result);
      console.log(`❌ ${test.name} - 错误: ${error.message}`);
      
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
      }
    }
  }

  return results;
}

// 测试特定文章获取
async function testSpecificPost() {
  try {
    console.log('\n🧪 测试获取特定文章...');
    
    // 先获取文章列表
    const postsResponse = await axios.get(`${WORDPRESS_API_URL}/posts?per_page=1`);
    
    if (postsResponse.data && postsResponse.data.length > 0) {
      const firstPost = postsResponse.data[0];
      console.log(`✅ 找到文章: "${firstPost.title.rendered}" (ID: ${firstPost.id})`);
      
      // 获取特定文章
      const postResponse = await axios.get(`${WORDPRESS_API_URL}/posts/${firstPost.id}`);
      console.log(`✅ 成功获取文章详情`);
      console.log(`   标题: ${postResponse.data.title.rendered}`);
      console.log(`   状态: ${postResponse.data.status}`);
      console.log(`   发布日期: ${postResponse.data.date}`);
      
      return {
        test: '获取特定文章',
        status: 'PASS',
        postId: firstPost.id,
        postTitle: firstPost.title.rendered
      };
    } else {
      console.log('⚠️  没有找到文章');
      return {
        test: '获取特定文章',
        status: 'SKIP',
        reason: '没有文章可测试'
      };
    }
  } catch (error) {
    console.log(`❌ 获取特定文章失败: ${error.message}`);
    return {
      test: '获取特定文章',
      status: 'FAIL',
      error: error.message
    };
  }
}

// 主测试函数
async function runIntegrationTest() {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 WordPress REST API 集成测试');
  console.log('='.repeat(50));

  try {
    // 基础 API 测试
    const apiResults = await testWordPressAPI();
    
    // 特定文章测试
    const postResult = await testSpecificPost();
    
    // 汇总结果
    const allResults = [...apiResults, postResult];
    const passCount = allResults.filter(r => r.status === 'PASS').length;
    const failCount = allResults.filter(r => r.status === 'FAIL').length;
    const skipCount = allResults.filter(r => r.status === 'SKIP').length;

    console.log('\n' + '='.repeat(50));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(50));
    console.log(`✅ 通过: ${passCount}`);
    console.log(`❌ 失败: ${failCount}`);
    console.log(`⏭️  跳过: ${skipCount}`);
    console.log(`📈 总计: ${allResults.length}`);

    if (failCount === 0) {
      console.log('\n🎉 所有测试通过！WordPress 集成正常工作。');
    } else {
      console.log('\n⚠️  部分测试失败，请检查 WordPress 配置。');
    }

    // 保存测试结果
    const testReport = {
      timestamp: new Date().toISOString(),
      wordpressUrl: WORDPRESS_BASE_URL,
      apiUrl: WORDPRESS_API_URL,
      summary: {
        total: allResults.length,
        passed: passCount,
        failed: failCount,
        skipped: skipCount
      },
      results: allResults
    };

    require('fs').writeFileSync(
      'wordpress-integration-test-report.json',
      JSON.stringify(testReport, null, 2)
    );

    console.log('\n📄 测试报告已保存到: wordpress-integration-test-report.json');

  } catch (error) {
    console.error('\n💥 测试过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runIntegrationTest().catch(console.error);
}

module.exports = {
  testWordPressAPI,
  testSpecificPost,
  runIntegrationTest
};
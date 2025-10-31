#!/usr/bin/env node

/**
 * Strapi连接测试脚本
 * 用于验证Strapi实例的连接和API令牌的有效性
 */

const axios = require('axios');

// 获取环境变量
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

if (!STRAPI_URL || !STRAPI_TOKEN) {
  console.error('❌ 缺少必要的环境变量');
  console.log('请设置以下环境变量：');
  console.log('  export STRAPI_URL="https://your-strapi-instance.com"');
  console.log('  export STRAPI_TOKEN="your-api-token-here"');
  process.exit(1);
}

console.log(`正在测试连接到: ${STRAPI_URL}`);

// 创建axios客户端
const client = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    'Authorization': `Bearer ${STRAPI_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

async function testConnection() {
  try {
    // 测试基本连接
    console.log('📡 测试基本连接...');
    const response = await client.get('/api/articles', {
      params: { pagination: { pageSize: 1 } }
    });
    
    console.log('✅ 连接成功！');
    console.log(`📊 响应状态: ${response.status}`);
    console.log(`📋 文章总数: ${response.data?.meta?.pagination?.total || '未知'}`);
    
    // 测试权限
    console.log('\n🔑 测试API权限...');
    
    // 尝试获取内容类型
    try {
      const contentTypeResponse = await client.get('/api/articles');
      console.log('✅ 读取权限: 正常');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('⚠️  读取权限: 受限');
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 连接测试完成！');
    console.log('现在可以安全运行上传脚本了。');
    
  } catch (error) {
    console.error('\n❌ 连接测试失败');
    
    if (error.code === 'ENOTFOUND') {
      console.error('错误: 无法找到Strapi服务器，请检查URL是否正确');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('错误: 连接被拒绝，请检查服务器是否运行');
    } else if (error.response?.status === 401) {
      console.error('错误: API令牌无效或已过期');
    } else if (error.response?.status === 403) {
      console.error('错误: API权限不足，请检查令牌权限');
    } else if (error.response?.status === 404) {
      console.error('错误: API端点不存在，请检查Strapi版本');
    } else {
      console.error('错误详情:', error.message);
    }
    
    console.log('\n🔧 故障排除建议：');
    console.log('1. 检查 STRAPI_URL 是否正确');
    console.log('2. 检查 STRAPI_TOKEN 是否有效');
    console.log('3. 确保Strapi服务器正在运行');
    console.log('4. 检查网络连接');
    
    process.exit(1);
  }
}

// 运行测试
testConnection();
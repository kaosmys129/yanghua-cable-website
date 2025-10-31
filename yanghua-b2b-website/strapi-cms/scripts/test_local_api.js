#!/usr/bin/env node

/**
 * 本地 Strapi API 测试脚本
 * 测试不同的访问方式和权限配置
 */

const axios = require('axios');

const LOCAL_URL = 'http://localhost:1337';

async function testEndpoint(url, description, headers = {}) {
  try {
    console.log(`\n🔍 测试: ${description}`);
    console.log(`📍 URL: ${url}`);
    
    const response = await axios.get(url, { 
      headers,
      timeout: 5000,
      validateStatus: () => true // 接受所有状态码
    });
    
    console.log(`✅ 状态码: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`📊 响应数据:`);
      if (response.data?.data) {
        console.log(`   - 数据类型: ${Array.isArray(response.data.data) ? 'Array' : typeof response.data.data}`);
        console.log(`   - 数据长度: ${response.data.data.length || 'N/A'}`);
        console.log(`   - Meta: ${JSON.stringify(response.data.meta, null, 2)}`);
      } else {
        console.log(`   - 响应: ${JSON.stringify(response.data, null, 2)}`);
      }
    } else {
      console.log(`❌ 错误响应: ${JSON.stringify(response.data, null, 2)}`);
    }
    
    return response;
    
  } catch (error) {
    console.error(`❌ 请求失败: ${error.message}`);
    if (error.response) {
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   响应: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

async function main() {
  console.log('🚀 开始测试本地 Strapi API\n');
  
  // 测试基本连接
  await testEndpoint(`${LOCAL_URL}`, '基本连接测试');
  
  // 测试管理面板
  await testEndpoint(`${LOCAL_URL}/admin`, '管理面板访问');
  
  // 测试 API 根路径
  await testEndpoint(`${LOCAL_URL}/api`, 'API 根路径');
  
  // 测试 articles 端点（不同方式）
  await testEndpoint(`${LOCAL_URL}/api/articles`, 'Articles API (无参数)');
  
  await testEndpoint(`${LOCAL_URL}/api/articles?pagination[pageSize]=1`, 'Articles API (带分页)');
  
  await testEndpoint(`${LOCAL_URL}/api/articles?populate=*`, 'Articles API (带 populate)');
  
  await testEndpoint(`${LOCAL_URL}/api/articles?publicationState=live`, 'Articles API (仅已发布)');
  
  await testEndpoint(`${LOCAL_URL}/api/articles?publicationState=preview`, 'Articles API (包含草稿)');
  
  // 测试其他内容类型
  await testEndpoint(`${LOCAL_URL}/api/authors`, 'Authors API');
  await testEndpoint(`${LOCAL_URL}/api/categories`, 'Categories API');
  await testEndpoint(`${LOCAL_URL}/api/abouts`, 'About API');
  await testEndpoint(`${LOCAL_URL}/api/globals`, 'Global API');
  
  console.log('\n🏁 测试完成');
}

main().catch(console.error);
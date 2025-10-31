#!/usr/bin/env node

/**
 * Strapi 数据结构检查脚本
 * 用于详细检查本地和云端的数据结构和内容
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ 
  path: path.join(__dirname, '..', '.env.local'), 
  override: true 
});

// 配置
const LOCAL_STRAPI_URL = 'http://localhost:1337';
const CLOUD_STRAPI_URL = process.env.STRAPI_BASE_URL || 'https://fruitful-presence-02d7be759c.strapiapp.com';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error('❌ 错误: STRAPI_API_TOKEN 未设置，请检查 .env.local 文件');
  process.exit(1);
}

// 创建客户端
const localClient = axios.create({
  baseURL: `${LOCAL_STRAPI_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

const cloudClient = axios.create({
  baseURL: `${CLOUD_STRAPI_URL}/api`,
  headers: {
    'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

async function inspectEndpoint(client, endpoint, clientName) {
  try {
    console.log(`\n🔍 检查 ${clientName} 的 ${endpoint} 端点...`);
    
    const response = await client.get(`/${endpoint}`, {
      params: {
        'pagination[pageSize]': 3,
        'populate': '*'
      }
    });
    
    console.log(`✅ ${clientName} ${endpoint} 响应成功`);
    console.log(`📊 状态码: ${response.status}`);
    console.log(`📄 数据结构:`);
    
    if (response.data) {
      console.log(`   - data 类型: ${Array.isArray(response.data.data) ? 'Array' : typeof response.data.data}`);
      console.log(`   - data 长度: ${response.data.data?.length || 'N/A'}`);
      console.log(`   - meta 信息: ${JSON.stringify(response.data.meta, null, 2)}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log(`   - 第一条记录结构:`);
        const firstItem = response.data.data[0];
        console.log(`     ID: ${firstItem.id}`);
        console.log(`     Attributes 键: ${Object.keys(firstItem.attributes || {}).join(', ')}`);
        
        if (firstItem.attributes) {
          console.log(`     - title: ${firstItem.attributes.title}`);
          console.log(`     - slug: ${firstItem.attributes.slug}`);
          console.log(`     - publishedAt: ${firstItem.attributes.publishedAt}`);
          console.log(`     - createdAt: ${firstItem.attributes.createdAt}`);
          console.log(`     - updatedAt: ${firstItem.attributes.updatedAt}`);
        }
      }
    }
    
    return response.data;
    
  } catch (error) {
    console.error(`❌ ${clientName} ${endpoint} 检查失败:`, error.message);
    if (error.response) {
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   响应: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

async function checkContentTypes(client, clientName) {
  try {
    console.log(`\n📋 检查 ${clientName} 的内容类型...`);
    
    // 尝试获取内容类型信息
    const endpoints = ['articles', 'posts', 'content-types'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await client.get(`/${endpoint}`, {
          params: { 'pagination[pageSize]': 1 }
        });
        console.log(`✅ ${clientName} 有 ${endpoint} 端点`);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`❌ ${clientName} 没有 ${endpoint} 端点`);
        } else {
          console.log(`⚠️  ${clientName} ${endpoint} 端点错误: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ 检查 ${clientName} 内容类型失败:`, error.message);
  }
}

async function inspectLocalDatabase() {
  try {
    console.log('\n💾 检查本地数据库...');
    
    const dbPath = path.join(__dirname, '..', '.tmp', 'data.db');
    const stats = await fs.stat(dbPath);
    console.log(`📁 数据库文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`📅 最后修改时间: ${stats.mtime.toLocaleString('zh-CN')}`);
    
  } catch (error) {
    console.error('❌ 检查本地数据库失败:', error.message);
  }
}

async function main() {
  console.log('🔍 开始检查 Strapi 数据结构\n');
  
  // 检查本地数据库
  await inspectLocalDatabase();
  
  // 检查内容类型
  await checkContentTypes(localClient, '本地');
  await checkContentTypes(cloudClient, '云端');
  
  // 检查 articles 端点
  const localData = await inspectEndpoint(localClient, 'articles', '本地');
  const cloudData = await inspectEndpoint(cloudClient, 'articles', '云端');
  
  // 生成总结
  console.log('\n📊 检查总结:');
  console.log('=====================================');
  
  if (localData) {
    console.log(`本地文章数量: ${localData.meta?.pagination?.total || localData.data?.length || 0}`);
  } else {
    console.log('本地: 无法获取文章数据');
  }
  
  if (cloudData) {
    console.log(`云端文章数量: ${cloudData.meta?.pagination?.total || cloudData.data?.length || 0}`);
  } else {
    console.log('云端: 无法获取文章数据');
  }
  
  console.log('=====================================');
  
  // 保存详细数据
  const inspectionData = {
    timestamp: new Date().toISOString(),
    local: {
      url: LOCAL_STRAPI_URL,
      data: localData,
      available: !!localData
    },
    cloud: {
      url: CLOUD_STRAPI_URL,
      data: cloudData,
      available: !!cloudData
    }
  };
  
  const reportPath = path.join(__dirname, '..', 'data', 'data_structure_inspection.json');
  await fs.writeFile(reportPath, JSON.stringify(inspectionData, null, 2));
  console.log(`\n📄 详细检查报告已保存到: ${reportPath}`);
}

main().catch(console.error);
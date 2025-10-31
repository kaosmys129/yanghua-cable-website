#!/usr/bin/env node

/**
 * 获取 Strapi Cloud 完整数据脚本
 * 使用 populate 参数获取完整的文章数据
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config({ 
  path: path.join(__dirname, '..', '.env.local'), 
  override: true 
});

const CLOUD_BASE_URL = 'https://fruitful-presence-02d7be759c.strapiapp.com';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error('❌ 错误: STRAPI_API_TOKEN 未设置，请检查 .env.local 文件');
  process.exit(1);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    console.log(`📡 请求: ${url}`);
    
    const options = {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            error: 'JSON 解析失败'
          });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function getCloudArticles() {
  console.log('🌐 获取云端文章数据...\n');
  
  const endpoints = [
    // 基本文章数据
    '/api/articles',
    
    // 使用 populate 参数获取关联数据
    '/api/articles?populate=*',
    
    // 获取深层关联数据
    '/api/articles?populate[author]=*&populate[category]=*&populate[cover]=*',
    
    // 获取所有字段和关联
    '/api/articles?populate[0]=author&populate[1]=category&populate[2]=cover&populate[3]=blocks',
    
    // 尝试获取单篇文章的详细信息（如果有的话）
    '/api/articles/1?populate=*',
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest(`${CLOUD_BASE_URL}${endpoint}`);
      
      console.log(`✅ ${endpoint}`);
      console.log(`   状态码: ${result.status}`);
      
      if (result.status === 200 && result.data) {
        if (result.data.data) {
          console.log(`   文章数量: ${Array.isArray(result.data.data) ? result.data.data.length : 1}`);
          
          // 检查第一篇文章的数据结构
          const firstArticle = Array.isArray(result.data.data) ? result.data.data[0] : result.data.data;
          if (firstArticle) {
            console.log(`   第一篇文章 ID: ${firstArticle.id}`);
            console.log(`   属性字段数量: ${firstArticle.attributes ? Object.keys(firstArticle.attributes).length : 0}`);
            
            if (firstArticle.attributes) {
              console.log(`   属性字段: ${Object.keys(firstArticle.attributes).join(', ')}`);
              
              // 检查是否有标题
              if (firstArticle.attributes.title) {
                console.log(`   标题: "${firstArticle.attributes.title}"`);
              }
            }
          }
        }
        
        results[endpoint] = result.data;
      } else {
        console.log(`   ❌ 错误: ${result.error || '未知错误'}`);
        results[endpoint] = { error: result.error || '请求失败', status: result.status };
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`);
      results[endpoint] = { error: error.message };
      console.log('');
    }
  }
  
  return results;
}

async function getOtherContentTypes() {
  console.log('📚 获取其他内容类型数据...\n');
  
  const contentTypes = ['authors', 'categories', 'globals', 'abouts'];
  const results = {};
  
  for (const contentType of contentTypes) {
    try {
      const result = await makeRequest(`${CLOUD_BASE_URL}/api/${contentType}?populate=*`);
      
      console.log(`✅ /api/${contentType}?populate=*`);
      console.log(`   状态码: ${result.status}`);
      
      if (result.status === 200 && result.data && result.data.data) {
        console.log(`   数据数量: ${Array.isArray(result.data.data) ? result.data.data.length : 1}`);
        results[contentType] = result.data;
      } else {
        console.log(`   ❌ 错误或无数据`);
        results[contentType] = { error: '无数据或请求失败', status: result.status };
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`);
      results[contentType] = { error: error.message };
      console.log('');
    }
  }
  
  return results;
}

async function main() {
  console.log('🚀 开始获取 Strapi Cloud 详细数据\n');
  
  try {
    // 获取文章数据
    const articlesData = await getCloudArticles();
    
    // 获取其他内容类型数据
    const otherData = await getOtherContentTypes();
    
    // 合并所有数据
    const allData = {
      timestamp: new Date().toISOString(),
      articles: articlesData,
      other_content_types: otherData
    };
    
    // 保存详细数据
    const filename = 'cloud_data_detailed.json';
    fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
    
    console.log('📊 数据获取总结:');
    console.log('================');
    
    // 找到最佳的文章数据
    let bestArticleData = null;
    let bestEndpoint = null;
    
    for (const [endpoint, data] of Object.entries(articlesData)) {
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const firstArticle = data.data[0];
        if (firstArticle.attributes && Object.keys(firstArticle.attributes).length > 0) {
          if (!bestArticleData || Object.keys(firstArticle.attributes).length > Object.keys(bestArticleData.attributes).length) {
            bestArticleData = firstArticle;
            bestEndpoint = endpoint;
          }
        }
      }
    }
    
    if (bestArticleData) {
      console.log(`✅ 最佳文章数据来源: ${bestEndpoint}`);
      console.log(`   文章总数: ${articlesData[bestEndpoint].data.length}`);
      console.log(`   属性字段: ${Object.keys(bestArticleData.attributes).join(', ')}`);
      
      if (bestArticleData.attributes.title) {
        console.log(`   示例标题: "${bestArticleData.attributes.title}"`);
      }
    } else {
      console.log('❌ 未找到有效的文章数据');
    }
    
    console.log(`\n💾 详细数据已保存到: ${filename}`);
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

main();
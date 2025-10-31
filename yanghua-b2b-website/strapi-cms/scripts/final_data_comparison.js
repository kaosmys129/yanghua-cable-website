#!/usr/bin/env node

/**
 * 最终数据比较脚本
 * 比较本地 Strapi 和云端 Strapi 的数据差异
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config({ 
  path: path.join(__dirname, '..', '.env.local'), 
  override: true 
});

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

async function fetchData(client, endpoint, clientName) {
  try {
    console.log(`📡 正在从 ${clientName} 获取 ${endpoint} 数据...`);
    
    const response = await client.get(`/${endpoint}?populate=*&pagination[pageSize]=100`);
    
    if (response.data && response.data.data) {
      console.log(`✅ ${clientName} ${endpoint}: ${response.data.data.length} 条记录`);
      return response.data.data;
    } else {
      console.log(`⚠️  ${clientName} ${endpoint}: 无数据`);
      return [];
    }
  } catch (error) {
    console.log(`❌ ${clientName} ${endpoint} 获取失败: ${error.message}`);
    return [];
  }
}

async function compareArticles() {
  console.log('🔍 开始比较文章数据...\n');
  
  // 获取本地和云端数据
  const localArticles = await fetchData(localClient, 'articles', '本地');
  const cloudArticles = await fetchData(cloudClient, 'articles', '云端');
  
  console.log('\n📊 数据统计:');
  console.log(`本地文章数量: ${localArticles.length}`);
  console.log(`云端文章数量: ${cloudArticles.length}`);
  
  // 创建比较结果
  const comparison = {
    timestamp: new Date().toISOString(),
    summary: {
      local_count: localArticles.length,
      cloud_count: cloudArticles.length,
      difference: cloudArticles.length - localArticles.length
    },
    local_articles: localArticles,
    cloud_articles: cloudArticles,
    analysis: {
      only_in_cloud: [],
      only_in_local: [],
      common_articles: []
    }
  };
  
  // 分析差异
  const localSlugs = new Set(localArticles.map(article => article.slug));
  const cloudSlugs = new Set(cloudArticles.map(article => article.slug));
  
  // 仅在云端的文章
  comparison.analysis.only_in_cloud = cloudArticles.filter(article => 
    !localSlugs.has(article.slug)
  );
  
  // 仅在本地的文章
  comparison.analysis.only_in_local = localArticles.filter(article => 
    !cloudSlugs.has(article.slug)
  );
  
  // 共同的文章
  comparison.analysis.common_articles = cloudArticles.filter(article => 
    localSlugs.has(article.slug)
  );
  
  console.log('\n🔍 差异分析:');
  console.log(`仅在云端: ${comparison.analysis.only_in_cloud.length} 篇`);
  console.log(`仅在本地: ${comparison.analysis.only_in_local.length} 篇`);
  console.log(`共同文章: ${comparison.analysis.common_articles.length} 篇`);
  
  if (comparison.analysis.only_in_cloud.length > 0) {
    console.log('\n📝 仅在云端的文章:');
    comparison.analysis.only_in_cloud.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title || article.slug} (ID: ${article.id})`);
    });
  }
  
  if (comparison.analysis.only_in_local.length > 0) {
    console.log('\n📝 仅在本地的文章:');
    comparison.analysis.only_in_local.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title || article.slug} (ID: ${article.id})`);
    });
  }
  
  return comparison;
}

async function compareOtherContentTypes() {
  console.log('\n🔍 比较其他内容类型...\n');
  
  const contentTypes = ['authors', 'categories'];
  const results = {};
  
  for (const contentType of contentTypes) {
    const localData = await fetchData(localClient, contentType, '本地');
    const cloudData = await fetchData(cloudClient, contentType, '云端');
    
    results[contentType] = {
      local_count: localData.length,
      cloud_count: cloudData.length,
      local_data: localData,
      cloud_data: cloudData
    };
  }
  
  return results;
}

function generateMarkdownReport(comparison, otherData) {
  const report = `# Strapi 数据比较报告

## 生成时间
${new Date(comparison.timestamp).toLocaleString('zh-CN')}

## 数据概览

### 文章数据
- **本地文章数量**: ${comparison.summary.local_count}
- **云端文章数量**: ${comparison.summary.cloud_count}
- **差异**: ${comparison.summary.difference > 0 ? '+' : ''}${comparison.summary.difference}

### 其他内容类型
${Object.entries(otherData).map(([type, data]) => 
  `- **${type}**: 本地 ${data.local_count}, 云端 ${data.cloud_count}`
).join('\n')}

## 详细分析

### 仅在云端的文章 (${comparison.analysis.only_in_cloud.length} 篇)
${comparison.analysis.only_in_cloud.length === 0 ? '无' : 
  comparison.analysis.only_in_cloud.map((article, index) => 
    `${index + 1}. **${article.title || 'Untitled'}**\n   - ID: ${article.id}\n   - Slug: ${article.slug}\n   - 创建时间: ${new Date(article.createdAt).toLocaleString('zh-CN')}`
  ).join('\n\n')
}

### 仅在本地的文章 (${comparison.analysis.only_in_local.length} 篇)
${comparison.analysis.only_in_local.length === 0 ? '无' : 
  comparison.analysis.only_in_local.map((article, index) => 
    `${index + 1}. **${article.title || 'Untitled'}**\n   - ID: ${article.id}\n   - Slug: ${article.slug}\n   - 创建时间: ${new Date(article.createdAt).toLocaleString('zh-CN')}`
  ).join('\n\n')
}

### 共同文章 (${comparison.analysis.common_articles.length} 篇)
${comparison.analysis.common_articles.length === 0 ? '无' : 
  `存在 ${comparison.analysis.common_articles.length} 篇相同的文章（基于 slug 匹配）`
}

## 建议操作

${comparison.summary.difference > 0 ? 
  `### 数据同步建议
由于云端有 ${comparison.summary.difference} 篇额外的文章，建议：

1. **备份本地数据**：在同步前确保本地数据已备份
2. **从云端导入数据**：将云端的文章数据导入到本地
3. **验证数据完整性**：导入后验证所有数据是否正确

### 导入步骤
1. 使用 Strapi 的导入/导出功能
2. 或者编写脚本从云端 API 获取数据并导入本地
3. 检查图片和媒体文件是否需要单独处理` :
  
  comparison.summary.difference < 0 ?
  `### 数据同步建议
本地有额外的数据，建议：

1. **检查本地额外数据**：确认这些数据是否需要保留
2. **同步到云端**：如果需要，将本地数据同步到云端` :
  
  `### 数据状态
本地和云端的数据数量一致，但建议检查具体内容是否完全相同。`
}

## 技术信息
- **本地 Strapi URL**: ${LOCAL_STRAPI_URL}
- **云端 Strapi URL**: ${CLOUD_STRAPI_URL}
- **API 认证**: ${STRAPI_API_TOKEN ? '已配置' : '未配置'}
`;

  return report;
}

async function main() {
  console.log('🚀 开始 Strapi 数据比较分析\n');
  
  try {
    // 比较文章数据
    const articleComparison = await compareArticles();
    
    // 比较其他内容类型
    const otherComparison = await compareOtherContentTypes();
    
    // 生成报告
    const markdownReport = generateMarkdownReport(articleComparison, otherComparison);
    
    // 保存结果
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonFilename = `data_comparison_${timestamp}.json`;
    const mdFilename = `data_comparison_report_${timestamp}.md`;
    
    // 保存 JSON 数据
    const fullData = {
      articles: articleComparison,
      other_content_types: otherComparison
    };
    
    fs.writeFileSync(jsonFilename, JSON.stringify(fullData, null, 2));
    fs.writeFileSync(mdFilename, markdownReport);
    
    console.log('\n✅ 比较完成！');
    console.log(`📄 详细数据: ${jsonFilename}`);
    console.log(`📋 报告文件: ${mdFilename}`);
    
    // 显示关键信息
    console.log('\n🎯 关键发现:');
    if (articleComparison.summary.difference > 0) {
      console.log(`⚠️  云端比本地多 ${articleComparison.summary.difference} 篇文章`);
      console.log('💡 建议从云端同步数据到本地');
    } else if (articleComparison.summary.difference < 0) {
      console.log(`⚠️  本地比云端多 ${Math.abs(articleComparison.summary.difference)} 篇文章`);
      console.log('💡 建议检查本地额外数据');
    } else {
      console.log('✅ 本地和云端文章数量一致');
    }
    
  } catch (error) {
    console.error('❌ 比较过程中发生错误:', error);
    process.exit(1);
  }
}

main();
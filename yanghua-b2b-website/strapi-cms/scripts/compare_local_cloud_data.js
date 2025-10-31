#!/usr/bin/env node

/**
 * 本地 Strapi 与 Strapi Cloud 数据比较脚本
 * 用于检查两个环境之间的数据差异
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

async function fetchAllData(client, endpoint, clientName) {
  try {
    console.log(`📡 正在从 ${clientName} 获取 ${endpoint} 数据...`);
    
    let allData = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await client.get(`/${endpoint}`, {
        params: {
          'pagination[page]': page,
          'pagination[pageSize]': 100,
          'populate': '*'
        }
      });
      
      const data = response.data.data || [];
      allData = allData.concat(data);
      
      const pagination = response.data.meta?.pagination;
      hasMore = pagination && page < pagination.pageCount;
      page++;
      
      console.log(`   📄 已获取 ${allData.length} 条记录 (第 ${page - 1} 页)`);
    }
    
    console.log(`✅ ${clientName} ${endpoint} 数据获取完成: ${allData.length} 条记录`);
    return allData;
    
  } catch (error) {
    console.error(`❌ 获取 ${clientName} ${endpoint} 数据失败:`, error.message);
    if (error.response) {
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   响应: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return [];
  }
}

async function compareData() {
  console.log('🔍 开始比较本地 Strapi 与 Strapi Cloud 数据差异\n');
  
  const comparison = {
    timestamp: new Date().toISOString(),
    local: {
      url: LOCAL_STRAPI_URL,
      articles: [],
      contentTypes: []
    },
    cloud: {
      url: CLOUD_STRAPI_URL,
      articles: [],
      contentTypes: []
    },
    differences: {
      articles: {
        localOnly: [],
        cloudOnly: [],
        different: []
      },
      summary: {}
    }
  };
  
  try {
    // 1. 获取文章数据
    console.log('📚 比较文章数据...\n');
    
    const [localArticles, cloudArticles] = await Promise.all([
      fetchAllData(localClient, 'articles', '本地'),
      fetchAllData(cloudClient, 'articles', '云端')
    ]);
    
    comparison.local.articles = localArticles;
    comparison.cloud.articles = cloudArticles;
    
    // 2. 比较文章
    console.log('\n🔍 分析文章差异...');
    
    const localArticleMap = new Map();
    const cloudArticleMap = new Map();
    
    // 建立映射 (使用 slug 作为唯一标识)
    localArticles.forEach(article => {
      const key = article.attributes?.slug || article.id;
      localArticleMap.set(key, article);
    });
    
    cloudArticles.forEach(article => {
      const key = article.attributes?.slug || article.id;
      cloudArticleMap.set(key, article);
    });
    
    // 找出差异
    for (const [key, localArticle] of localArticleMap) {
      if (!cloudArticleMap.has(key)) {
        comparison.differences.articles.localOnly.push({
          id: localArticle.id,
          slug: key,
          title: localArticle.attributes?.title,
          publishedAt: localArticle.attributes?.publishedAt
        });
      } else {
        const cloudArticle = cloudArticleMap.get(key);
        // 比较内容是否相同
        if (JSON.stringify(localArticle.attributes) !== JSON.stringify(cloudArticle.attributes)) {
          comparison.differences.articles.different.push({
            slug: key,
            local: {
              id: localArticle.id,
              title: localArticle.attributes?.title,
              updatedAt: localArticle.attributes?.updatedAt
            },
            cloud: {
              id: cloudArticle.id,
              title: cloudArticle.attributes?.title,
              updatedAt: cloudArticle.attributes?.updatedAt
            }
          });
        }
      }
    }
    
    for (const [key, cloudArticle] of cloudArticleMap) {
      if (!localArticleMap.has(key)) {
        comparison.differences.articles.cloudOnly.push({
          id: cloudArticle.id,
          slug: key,
          title: cloudArticle.attributes?.title,
          publishedAt: cloudArticle.attributes?.publishedAt
        });
      }
    }
    
    // 3. 生成摘要
    comparison.differences.summary = {
      local: {
        totalArticles: localArticles.length,
        publishedArticles: localArticles.filter(a => a.attributes?.publishedAt).length
      },
      cloud: {
        totalArticles: cloudArticles.length,
        publishedArticles: cloudArticles.filter(a => a.attributes?.publishedAt).length
      },
      differences: {
        localOnlyCount: comparison.differences.articles.localOnly.length,
        cloudOnlyCount: comparison.differences.articles.cloudOnly.length,
        differentCount: comparison.differences.articles.different.length
      }
    };
    
    // 4. 输出结果
    console.log('\n📊 数据比较结果:');
    console.log('=====================================');
    console.log(`本地文章总数: ${comparison.differences.summary.local.totalArticles}`);
    console.log(`云端文章总数: ${comparison.differences.summary.cloud.totalArticles}`);
    console.log(`仅存在于本地: ${comparison.differences.summary.differences.localOnlyCount} 篇`);
    console.log(`仅存在于云端: ${comparison.differences.summary.differences.cloudOnlyCount} 篇`);
    console.log(`内容有差异: ${comparison.differences.summary.differences.differentCount} 篇`);
    console.log('=====================================\n');
    
    if (comparison.differences.articles.localOnly.length > 0) {
      console.log('📝 仅存在于本地的文章:');
      comparison.differences.articles.localOnly.forEach(article => {
        console.log(`  - ${article.title} (${article.slug})`);
      });
      console.log('');
    }
    
    if (comparison.differences.articles.cloudOnly.length > 0) {
      console.log('☁️  仅存在于云端的文章:');
      comparison.differences.articles.cloudOnly.forEach(article => {
        console.log(`  - ${article.title} (${article.slug})`);
      });
      console.log('');
    }
    
    if (comparison.differences.articles.different.length > 0) {
      console.log('🔄 内容有差异的文章:');
      comparison.differences.articles.different.forEach(article => {
        console.log(`  - ${article.slug}`);
        console.log(`    本地: ${article.local.title} (更新: ${article.local.updatedAt})`);
        console.log(`    云端: ${article.cloud.title} (更新: ${article.cloud.updatedAt})`);
      });
      console.log('');
    }
    
    // 5. 保存详细报告
    const reportPath = path.join(__dirname, '..', 'data', 'data_comparison_report.json');
    await fs.writeFile(reportPath, JSON.stringify(comparison, null, 2));
    console.log(`📄 详细报告已保存到: ${reportPath}`);
    
    // 6. 生成 Markdown 报告
    const markdownReport = generateMarkdownReport(comparison);
    const markdownPath = path.join(__dirname, '..', 'data', 'data_comparison_report.md');
    await fs.writeFile(markdownPath, markdownReport);
    console.log(`📋 Markdown 报告已保存到: ${markdownPath}`);
    
  } catch (error) {
    console.error('❌ 数据比较过程中发生错误:', error.message);
    process.exit(1);
  }
}

function generateMarkdownReport(comparison) {
  const { summary, articles } = comparison.differences;
  
  return `# Strapi 数据比较报告

## 概览

**生成时间**: ${new Date(comparison.timestamp).toLocaleString('zh-CN')}

**本地环境**: ${comparison.local.url}
**云端环境**: ${comparison.cloud.url}

## 数据统计

| 环境 | 文章总数 | 已发布文章 |
|------|----------|------------|
| 本地 | ${summary.local.totalArticles} | ${summary.local.publishedArticles} |
| 云端 | ${summary.cloud.totalArticles} | ${summary.cloud.publishedArticles} |

## 差异分析

- **仅存在于本地**: ${summary.differences.localOnlyCount} 篇文章
- **仅存在于云端**: ${summary.differences.cloudOnlyCount} 篇文章  
- **内容有差异**: ${summary.differences.differentCount} 篇文章

${articles.localOnly.length > 0 ? `
## 仅存在于本地的文章

${articles.localOnly.map(article => `- **${article.title}** (${article.slug})`).join('\n')}
` : ''}

${articles.cloudOnly.length > 0 ? `
## 仅存在于云端的文章

${articles.cloudOnly.map(article => `- **${article.title}** (${article.slug})`).join('\n')}
` : ''}

${articles.different.length > 0 ? `
## 内容有差异的文章

${articles.different.map(article => `
### ${article.slug}
- **本地**: ${article.local.title} (更新: ${article.local.updatedAt})
- **云端**: ${article.cloud.title} (更新: ${article.cloud.updatedAt})
`).join('\n')}
` : ''}

## 建议

${summary.differences.localOnlyCount > 0 ? '- 考虑将本地独有的文章同步到云端\n' : ''}
${summary.differences.cloudOnlyCount > 0 ? '- 考虑将云端独有的文章同步到本地\n' : ''}
${summary.differences.differentCount > 0 ? '- 检查内容差异的文章，确定哪个版本是最新的\n' : ''}
${summary.differences.localOnlyCount === 0 && summary.differences.cloudOnlyCount === 0 && summary.differences.differentCount === 0 ? '- 本地和云端数据完全同步 ✅\n' : ''}
`;
}

// 运行比较
compareData();
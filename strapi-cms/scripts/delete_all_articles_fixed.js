const axios = require('axios');
const path = require('path');

// 加载环境变量
require('dotenv').config({ 
  path: path.join(__dirname, '..', '.env.local'), 
  override: true 
});

const STRAPI_URL = process.env.STRAPI_BASE_URL || 'https://fruitful-presence-02d7be759c.strapiapp.com';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error('Error: STRAPI_API_TOKEN is not defined. Please check your .env.local file.');
  process.exit(1);
}

const strapi = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function deleteAllArticles() {
  try {
    console.log('🔄 获取所有文章...');
    
    // 获取所有文章（使用大的分页限制）
    const response = await strapi.get('/articles?pagination[pageSize]=1000');
    const articles = response.data.data;
    
    console.log(`📊 找到 ${articles.length} 篇文章`);
    
    if (articles.length === 0) {
      console.log('✅ 没有文章需要删除');
      return;
    }
    
    let deletedCount = 0;
    let failedCount = 0;
    
    console.log('🗑️ 开始删除文章...');
    
    for (const article of articles) {
      try {
        console.log(`正在删除: ${article.title} (DocumentID: ${article.documentId})`);
        
        // 使用documentId而不是id进行删除
        await strapi.delete(`/articles/${article.documentId}`);
        
        deletedCount++;
        console.log(`✅ 已删除: ${article.title}`);
        
      } catch (deleteError) {
        failedCount++;
        console.error(`❌ 删除失败: ${article.title}`);
        console.error(`   错误: ${deleteError.message}`);
        
        // 如果是404错误，可能文章已经被删除了
        if (deleteError.response && deleteError.response.status === 404) {
          console.log(`   (文章可能已经被删除)`);
        }
      }
    }
    
    console.log('\n📊 删除完成统计:');
    console.log(`✅ 成功删除: ${deletedCount} 篇`);
    console.log(`❌ 删除失败: ${failedCount} 篇`);
    
    // 验证删除结果
    console.log('\n🔍 验证删除结果...');
    const verifyResponse = await strapi.get('/articles?pagination[pageSize]=1');
    const remainingCount = verifyResponse.data.meta.pagination.total;
    
    console.log(`📊 剩余文章数量: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('🎉 所有文章已成功删除！');
    } else {
      console.log(`⚠️ 仍有 ${remainingCount} 篇文章未删除`);
    }
    
  } catch (error) {
    console.error('❌ 删除过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    process.exit(1);
  }
}

// 运行删除脚本
deleteAllArticles();
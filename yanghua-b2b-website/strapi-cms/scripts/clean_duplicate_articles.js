require('dotenv').config({ 
  path: require('path').join(__dirname, '..', '.env.local'), 
  override: true 
});
const axios = require('axios');

const STRAPI_URL = process.env.STRAPI_BASE_URL || 'https://fruitful-presence-02d7be759c.strapiapp.com';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error('Error: STRAPI_API_TOKEN is not defined. Please check your .env.local file.');
  process.exit(1);
}

// 创建 axios 实例
const strapiApi = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function cleanDuplicateArticles() {
  try {
    console.log('开始清理重复文章...');
    
    // 获取所有文章
    const response = await strapiApi.get('/articles?populate=*&pagination[pageSize]=1000');
    const articles = response.data.data;
    
    console.log(`找到 ${articles.length} 篇文章`);
    
    // 按标题分组文章
    const articlesByTitle = {};
    
    articles.forEach(article => {
      const title = article.title;
      if (!articlesByTitle[title]) {
        articlesByTitle[title] = [];
      }
      articlesByTitle[title].push(article);
    });
    
    // 找出重复的文章组
    const duplicateGroups = Object.entries(articlesByTitle)
      .filter(([title, articles]) => articles.length > 1);
    
    console.log(`找到 ${duplicateGroups.length} 组重复文章`);
    
    let deletedCount = 0;
    
    // 对每组重复文章，保留最新的，删除其他的
    for (const [title, duplicates] of duplicateGroups) {
      console.log(`\n处理重复文章: "${title}" (${duplicates.length} 个副本)`);
      
      // 按创建时间排序，保留最新的
      duplicates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      const keepArticle = duplicates[0];
      const toDelete = duplicates.slice(1);
      
      console.log(`保留文章 ID: ${keepArticle.id} (创建时间: ${keepArticle.createdAt})`);
      
      // 删除其他副本
      for (const article of toDelete) {
        try {
          await strapiApi.delete(`/articles/${article.id}`);
          console.log(`删除文章 ID: ${article.id} (创建时间: ${article.createdAt})`);
          deletedCount++;
        } catch (error) {
          console.error(`删除文章 ${article.id} 失败:`, error.message);
        }
      }
    }
    
    console.log(`\n清理完成！`);
    console.log(`总共删除了 ${deletedCount} 篇重复文章`);
    
    // 验证清理结果
    const finalResponse = await strapiApi.get('/articles?populate=*&pagination[pageSize]=1000');
    const finalArticles = finalResponse.data.data;
    console.log(`清理后剩余文章数量: ${finalArticles.length}`);
    
    // 检查是否还有重复
    const finalTitles = finalArticles.map(a => a.title);
    const uniqueTitles = [...new Set(finalTitles)];
    
    if (finalTitles.length === uniqueTitles.length) {
      console.log('✅ 所有重复文章已清理完成，没有发现重复标题');
    } else {
      console.log('⚠️  仍然存在重复标题，可能需要手动检查');
    }
    
  } catch (error) {
    console.error('清理过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行清理脚本
cleanDuplicateArticles();
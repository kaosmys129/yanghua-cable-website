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

async function cleanDuplicateArticles() {
  try {
    console.log('🔄 获取所有文章...');
    
    // 获取所有文章
    const response = await strapi.get('/articles?pagination[pageSize]=1000');
    const articles = response.data.data;
    
    console.log(`📊 找到 ${articles.length} 篇文章`);
    
    if (articles.length === 0) {
      console.log('✅ 没有文章需要处理');
      return;
    }
    
    // 按标题分组文章
    const articlesByTitle = {};
    
    articles.forEach(article => {
      const title = article.title;
      if (!articlesByTitle[title]) {
        articlesByTitle[title] = [];
      }
      articlesByTitle[title].push(article);
    });
    
    // 找出重复的文章
    const duplicateGroups = [];
    const uniqueTitles = Object.keys(articlesByTitle);
    
    uniqueTitles.forEach(title => {
      if (articlesByTitle[title].length > 1) {
        duplicateGroups.push({
          title: title,
          articles: articlesByTitle[title]
        });
      }
    });
    
    console.log(`📊 发现 ${duplicateGroups.length} 组重复标题`);
    console.log(`📊 唯一标题数量: ${uniqueTitles.length}`);
    
    if (duplicateGroups.length === 0) {
      console.log('✅ 没有重复文章需要清理');
      return;
    }
    
    let deletedCount = 0;
    let failedCount = 0;
    
    console.log('🗑️ 开始清理重复文章...');
    
    for (const group of duplicateGroups) {
      console.log(`\n处理重复标题: "${group.title}" (${group.articles.length} 篇)`);
      
      // 按创建时间排序，保留最早的文章
      const sortedArticles = group.articles.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      const keepArticle = sortedArticles[0];
      const deleteArticles = sortedArticles.slice(1);
      
      console.log(`  保留: ${keepArticle.title} (DocumentID: ${keepArticle.documentId}, 创建于: ${keepArticle.createdAt})`);
      
      // 删除重复的文章（使用documentId）
      for (const article of deleteArticles) {
        try {
          console.log(`  正在删除: DocumentID ${article.documentId} (创建于: ${article.createdAt})`);
          
          await strapi.delete(`/articles/${article.documentId}`);
          
          deletedCount++;
          console.log(`  ✅ 已删除重复文章`);
          
        } catch (deleteError) {
          failedCount++;
          console.error(`  ❌ 删除失败: ${deleteError.message}`);
          
          if (deleteError.response) {
            console.error(`     状态码: ${deleteError.response.status}`);
            console.error(`     响应: ${JSON.stringify(deleteError.response.data)}`);
          }
        }
      }
    }
    
    console.log('\n📊 清理完成统计:');
    console.log(`✅ 成功删除重复文章: ${deletedCount} 篇`);
    console.log(`❌ 删除失败: ${failedCount} 篇`);
    
    // 验证清理结果
    console.log('\n🔍 验证清理结果...');
    const verifyResponse = await strapi.get('/articles?pagination[pageSize]=1000');
    const remainingArticles = verifyResponse.data.data;
    
    // 重新检查重复情况
    const remainingByTitle = {};
    remainingArticles.forEach(article => {
      const title = article.title;
      if (!remainingByTitle[title]) {
        remainingByTitle[title] = [];
      }
      remainingByTitle[title].push(article);
    });
    
    const remainingDuplicates = Object.keys(remainingByTitle).filter(
      title => remainingByTitle[title].length > 1
    );
    
    console.log(`📊 清理后文章总数: ${remainingArticles.length}`);
    console.log(`📊 清理后唯一标题数量: ${Object.keys(remainingByTitle).length}`);
    console.log(`📊 剩余重复标题数量: ${remainingDuplicates.length}`);
    
    if (remainingDuplicates.length === 0) {
      console.log('🎉 所有重复文章已成功清理！');
    } else {
      console.log(`⚠️ 仍有 ${remainingDuplicates.length} 组重复标题需要手动检查`);
      remainingDuplicates.forEach(title => {
        console.log(`  - "${title}" (${remainingByTitle[title].length} 篇)`);
      });
    }
    
  } catch (error) {
    console.error('❌ 清理过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    process.exit(1);
  }
}

// 运行清理脚本
cleanDuplicateArticles();
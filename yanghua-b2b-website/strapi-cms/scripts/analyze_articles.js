const fs = require('fs');
const path = require('path');

// 读取原始数据
const dataPath = path.join(__dirname, '../data/strapi_articles_data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

console.log('=== Strapi文章数据分析报告 ===');
console.log(`总文章数: ${data.data.length}`);
console.log(`分页信息: ${JSON.stringify(data.meta)}`);

// 分析每篇文章的结构
const articles = data.data;
const analysis = {
  totalArticles: articles.length,
  hasLocaleField: 0,
  missingLocaleField: 0,
  coverImages: 0,
  blocksComponents: 0,
  imageUrls: [],
  validationErrors: []
};

articles.forEach((article, index) => {
  console.log(`\n--- 文章 ${index + 1} ---`);
  console.log(`标题: ${article.title}`);
  console.log(`ID: ${article.id}`);
  console.log(`DocumentID: ${article.documentId}`);
  
  // 检查locale字段
  if (article.locale) {
    analysis.hasLocaleField++;
    console.log(`Locale: ${article.locale}`);
  } else {
    analysis.missingLocaleField++;
    console.log('Locale: 缺失');
  }
  
  // 检查cover图片
  if (article.cover) {
    analysis.coverImages++;
    console.log(`Cover图片: ${article.cover.name}`);
    console.log(`Cover URL: ${article.cover.url}`);
    
    // 收集图片URL
    if (article.cover.url) {
      analysis.imageUrls.push({
        type: 'cover',
        articleId: article.id,
        url: article.cover.url
      });
    }
  }
  
  // 检查blocks组件
  if (article.blocks && Array.isArray(article.blocks)) {
    analysis.blocksComponents += article.blocks.length;
    console.log(`Blocks组件数: ${article.blocks.length}`);
    
    article.blocks.forEach((block, blockIndex) => {
      console.log(`  Block ${blockIndex + 1}: ${block.__component}`);
      
      // 检查shared.media组件中的图片
      if (block.__component === 'shared.media' && block.file) {
        console.log(`    Media文件: ${block.file.name}`);
        console.log(`    Media URL: ${block.file.url}`);
        
        if (block.file.url) {
          analysis.imageUrls.push({
            type: 'block-media',
            articleId: article.id,
            blockIndex: blockIndex,
            url: block.file.url
          });
        }
      }
    });
  }
  
  // 验证必需字段
  const requiredFields = ['title', 'description', 'slug'];
  const missingFields = requiredFields.filter(field => !article[field]);
  
  if (missingFields.length > 0) {
    analysis.validationErrors.push({
      articleId: article.id,
      articleTitle: article.title,
      missingFields: missingFields
    });
  }
});

// 输出分析总结
console.log('\n=== 分析总结 ===');
console.log(`总文章数: ${analysis.totalArticles}`);
console.log(`包含locale字段: ${analysis.hasLocaleField}`);
console.log(`缺失locale字段: ${analysis.missingLocaleField}`);
console.log(`包含cover图片: ${analysis.coverImages}`);
console.log(`总blocks组件数: ${analysis.blocksComponents}`);
console.log(`发现图片URL总数: ${analysis.imageUrls.length}`);
console.log(`验证错误数: ${analysis.validationErrors.length}`);

if (analysis.validationErrors.length > 0) {
  console.log('\n=== 验证错误详情 ===');
  analysis.validationErrors.forEach(error => {
    console.log(`文章ID ${error.articleId}: "${error.articleTitle}" 缺失字段: ${error.missingFields.join(', ')}`);
  });
}

// 图片URL分析
console.log('\n=== 图片URL分析 ===');
const urlTypes = {};
analysis.imageUrls.forEach(item => {
  if (!urlTypes[item.type]) {
    urlTypes[item.type] = 0;
  }
  urlTypes[item.type]++;
});

Object.entries(urlTypes).forEach(([type, count]) => {
  console.log(`${type}: ${count}个`);
});

// 保存分析报告
const reportPath = path.join(__dirname, '../data/analysis_report.json');
fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
console.log(`\n分析报告已保存到: ${reportPath}`);

// 创建处理后的数据（添加locale字段）
const processedData = {
  ...data,
  data: articles.map(article => ({
    ...article,
    locale: article.locale || 'en'
  }))
};

const processedPath = path.join(__dirname, '../data/articles_with_locale.json');
fs.writeFileSync(processedPath, JSON.stringify(processedData, null, 2));
console.log(`处理后的数据已保存到: ${processedPath}`);
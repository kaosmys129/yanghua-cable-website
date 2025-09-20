const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 配置
const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL || 'https://your-strapi-cloud-instance.com';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || 'your-api-token';

// 读取处理后的数据
const dataPath = path.join(__dirname, '../data/processed_articles.json');
const validationLogPath = path.join(__dirname, '../data/image_validation_log.json');

console.log('开始验证图片资源...');
console.log(`目标服务器: ${STRAPI_BASE_URL}`);

async function checkImageUrl(url, description) {
  try {
    const response = await axios.head(url, {
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // 接受所有非5xx状态码
      }
    });

    return {
      url: url,
      description: description,
      accessible: response.status === 200,
      statusCode: response.status,
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length']
    };
  } catch (error) {
    return {
      url: url,
      description: description,
      accessible: false,
      error: error.message,
      errorType: error.code
    };
  }
}

async function validateArticleImages(article) {
  const results = {
    articleTitle: article.title,
    articleSlug: article.slug,
    coverImage: null,
    blockImages: [],
    totalImages: 0,
    accessibleImages: 0
  };

  console.log(`\n验证文章图片: ${article.title}`);

  // 检查封面图片
  if (article.cover && article.cover.formats) {
    console.log('  检查封面图片...');
    const coverUrl = article.cover.url;
    const coverResult = await checkImageUrl(coverUrl, '封面图片');
    results.coverImage = coverResult;
    results.totalImages++;
    if (coverResult.accessible) results.accessibleImages++;
    
    console.log(`    封面图片: ${coverResult.accessible ? '✅ 可访问' : '❌ 无法访问'}`);
    if (!coverResult.accessible) {
      console.log(`    错误: ${coverResult.statusCode || coverResult.error}`);
    }

    // 检查不同尺寸的图片
    for (const [format, formatData] of Object.entries(article.cover.formats)) {
      const formatResult = await checkImageUrl(formatData.url, `封面图片 (${format})`);
      results.blockImages.push(formatResult);
      results.totalImages++;
      if (formatResult.accessible) results.accessibleImages++;
      
      console.log(`    ${format} 尺寸: ${formatResult.accessible ? '✅ 可访问' : '❌ 无法访问'}`);
    }
  }

  // 检查blocks中的图片
  if (article.blocks && article.blocks.length > 0) {
    console.log('  检查blocks中的图片...');
    
    for (let i = 0; i < article.blocks.length; i++) {
      const block = article.blocks[i];
      
      if (block.__component === 'shared.media' && block.file) {
        const mediaUrl = block.file.url;
        const mediaResult = await checkImageUrl(mediaUrl, `Block ${i + 1} - 媒体文件`);
        results.blockImages.push(mediaResult);
        results.totalImages++;
        if (mediaResult.accessible) results.accessibleImages++;
        
        console.log(`    Block ${i + 1}: ${mediaResult.accessible ? '✅ 可访问' : '❌ 无法访问'}`);
        
        // 检查不同尺寸的图片
        if (block.file.formats) {
          for (const [format, formatData] of Object.entries(block.file.formats)) {
            const formatResult = await checkImageUrl(formatData.url, `Block ${i + 1} - ${format}`);
            results.blockImages.push(formatResult);
            results.totalImages++;
            if (formatResult.accessible) results.accessibleImages++;
          }
        }
      }
    }
  }

  results.accessibilityRate = results.totalImages > 0 ? (results.accessibleImages / results.totalImages * 100).toFixed(2) : 0;
  
  console.log(`  总计: ${results.totalImages} 张图片, ${results.accessibleImages} 张可访问 (${results.accessibilityRate}%)`);
  
  return results;
}

async function main() {
  try {
    // 读取数据
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('数据格式错误：缺少data数组');
    }

    const articles = data.data;
    console.log(`找到 ${articles.length} 篇文章需要验证`);

    // 验证结果记录
    const validationResults = {
      startTime: new Date().toISOString(),
      totalArticles: articles.length,
      totalImages: 0,
      accessibleImages: 0,
      articlesWithIssues: 0,
      results: []
    };

    // 逐个验证文章
    for (let i = 0; i < articles.length; i++) {
      const result = await validateArticleImages(articles[i]);
      validationResults.results.push(result);
      
      validationResults.totalImages += result.totalImages;
      validationResults.accessibleImages += result.accessibleImages;
      
      if (result.accessibleImages < result.totalImages) {
        validationResults.articlesWithIssues++;
      }

      // 每验证5篇文章后暂停1秒，避免服务器压力过大
      if ((i + 1) % 5 === 0 && i < articles.length - 1) {
        console.log(`\n⏸️  已验证 ${i + 1} 篇文章，暂停1秒...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    validationResults.endTime = new Date().toISOString();
    validationResults.duration = new Date(validationResults.endTime) - new Date(validationResults.startTime);
    validationResults.overallAccessibilityRate = validationResults.totalImages > 0 ? 
      (validationResults.accessibleImages / validationResults.totalImages * 100).toFixed(2) : 0;

    // 保存验证日志
    fs.writeFileSync(validationLogPath, JSON.stringify(validationResults, null, 2));

    console.log('\n========================================');
    console.log('图片验证完成！');
    console.log(`总计: ${validationResults.totalArticles} 篇文章`);
    console.log(`总图片数: ${validationResults.totalImages} 张`);
    console.log(`可访问图片: ${validationResults.accessibleImages} 张`);
    console.log(`整体可访问率: ${validationResults.overallAccessibilityRate}%`);
    console.log(`有问题的文章: ${validationResults.articlesWithIssues} 篇`);
    console.log(`用时: ${validationResults.duration} 毫秒`);
    console.log(`详细日志已保存到: ${validationLogPath}`);

    // 显示有问题的文章
    if (validationResults.articlesWithIssues > 0) {
      console.log('\n有图片访问问题的文章:');
      validationResults.results
        .filter(result => result.accessibleImages < result.totalImages)
        .forEach(result => {
          console.log(`  - ${result.articleTitle} (${result.articleSlug})`);
          console.log(`    ${result.accessibleImages}/${result.totalImages} 张图片可访问`);
          
          // 显示具体的失败图片
          const failedImages = [
            ...(result.coverImage && !result.coverImage.accessible ? [result.coverImage] : []),
            ...result.blockImages.filter(img => !img.accessible)
          ];
          
          failedImages.forEach(img => {
            console.log(`    ❌ ${img.description}: ${img.url}`);
            console.log(`       错误: ${img.statusCode || img.error}`);
          });
        });
    }

  } catch (error) {
    console.error('验证过程中出错:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('程序执行失败:', error);
  process.exit(1);
});
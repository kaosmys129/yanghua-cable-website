const fs = require('fs');
const path = require('path');

// 读取原始数据
const dataPath = path.join(__dirname, '../data/strapi_articles_data.json');
const outputPath = path.join(__dirname, '../data/processed_articles.json');

console.log('开始处理文章数据...');

try {
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(rawData);
  
  if (!data.data || !Array.isArray(data.data)) {
    throw new Error('数据格式错误：缺少data数组');
  }

  console.log(`找到 ${data.data.length} 篇文章`);

  // 处理每篇文章
  const processedArticles = data.data.map((article, index) => {
    console.log(`处理第 ${index + 1} 篇文章: ${article.title}`);
    
    // 验证必需字段
    const requiredFields = ['title', 'description', 'slug'];
    const missingFields = requiredFields.filter(field => !article[field]);
    
    if (missingFields.length > 0) {
      console.warn(`警告: 文章 "${article.title}" 缺少字段: ${missingFields.join(', ')}`);
    }

    // 处理cover图片字段
    let processedCover = null;
    if (article.cover) {
      processedCover = {
        id: article.cover.id,
        documentId: article.cover.documentId,
        name: article.cover.name,
        alternativeText: article.cover.alternativeText || article.title,
        caption: article.cover.caption || article.title,
        width: article.cover.width,
        height: article.cover.height,
        formats: article.cover.formats,
        url: article.cover.url || (article.cover.formats && article.cover.formats.large ? article.cover.formats.large.url : null),
        mime: article.cover.mime || 'image/jpeg',
        size: article.cover.size || 0
      };
      
      // 验证图片URL
      if (!processedCover.url) {
        console.warn(`警告: 文章 "${article.title}" 的cover图片缺少URL`);
      }
    }

    // 处理blocks内容中的图片
    let processedBlocks = [];
    if (article.blocks && Array.isArray(article.blocks)) {
      processedBlocks = article.blocks.map(block => {
        if (block.__component === 'shared.media' && block.file) {
          return {
            __component: block.__component,
            file: {
              id: block.file.id,
              documentId: block.file.documentId,
              name: block.file.name,
              alternativeText: block.file.alternativeText || block.file.name,
              caption: block.file.caption || block.file.name,
              width: block.file.width,
              height: block.file.height,
              formats: block.file.formats,
              url: block.file.url || (block.file.formats && block.file.formats.large ? block.file.formats.large.url : null),
              mime: block.file.mime || 'image/jpeg',
              size: block.file.size || 0
            }
          };
        }
        return block;
      });
    }

    // 构建处理后的文章对象
    const processedArticle = {
      title: article.title || '',
      description: article.description || '',
      slug: article.slug || '',
      locale: 'en', // 添加locale字段
      cover: processedCover,
      blocks: processedBlocks,
      // 保留原始时间戳
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      publishedAt: article.publishedAt
    };

    // 如果有author和category信息，也保留
    if (article.author) {
      processedArticle.author = article.author;
    }
    if (article.category) {
      processedArticle.category = article.category;
    }

    return processedArticle;
  });

  // 保存处理后的数据
  const processedData = {
    data: processedArticles,
    meta: {
      total: processedArticles.length,
      processedAt: new Date().toISOString(),
      summary: {
        totalArticles: processedArticles.length,
        articlesWithCover: processedArticles.filter(a => a.cover).length,
        articlesWithBlocks: processedArticles.filter(a => a.blocks && a.blocks.length > 0).length,
        allHaveLocale: processedArticles.every(a => a.locale === 'en')
      }
    }
  };

  fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
  
  console.log('\n数据处理完成！');
  console.log(`总计处理了 ${processedArticles.length} 篇文章`);
  console.log(`包含封面图片的文章: ${processedData.meta.summary.articlesWithCover} 篇`);
  console.log(`包含blocks内容的文章: ${processedData.meta.summary.articlesWithBlocks} 篇`);
  console.log(`所有文章都包含locale字段: ${processedData.meta.summary.allHaveLocale}`);
  console.log(`处理后的数据已保存到: ${outputPath}`);

  // 生成问题报告
  const reportPath = path.join(__dirname, '../data/processing_report.json');
  const report = {
    processingDate: new Date().toISOString(),
    totalArticles: processedArticles.length,
    issues: [],
    warnings: []
  };

  processedArticles.forEach((article, index) => {
    const originalArticle = data.data[index];
    
    // 检查问题
    if (!article.title) {
      report.issues.push(`文章ID ${originalArticle.id}: 标题为空`);
    }
    if (!article.description) {
      report.issues.push(`文章ID ${originalArticle.id}: 描述为空`);
    }
    if (!article.slug) {
      report.issues.push(`文章ID ${originalArticle.id}: slug为空`);
    }
    if (article.cover && !article.cover.url) {
      report.issues.push(`文章ID ${originalArticle.id}: cover图片URL无效`);
    }
    
    // 检查blocks中的图片问题
    if (article.blocks && article.blocks.length > 0) {
      article.blocks.forEach((block, blockIndex) => {
        if (block.__component === 'shared.media' && block.file && !block.file.url) {
          report.warnings.push(`文章ID ${originalArticle.id}, block ${blockIndex}: 媒体文件URL无效`);
        }
      });
    }
  });

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n处理报告已保存到: ${reportPath}`);
  
  if (report.issues.length > 0) {
    console.log(`发现 ${report.issues.length} 个问题:`);
    report.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (report.warnings.length > 0) {
    console.log(`发现 ${report.warnings.length} 个警告:`);
    report.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

} catch (error) {
  console.error('处理数据时出错:', error.message);
  process.exit(1);
}
const fs = require('fs');
const path = require('path');

// 读取处理后的文章数据
const processedDataPath = path.join(__dirname, '../data/processed_articles.json');
const processedData = JSON.parse(fs.readFileSync(processedDataPath, 'utf8'));
const processedArticles = processedData.data || processedData;

// 读取图片映射
const imageMappingPath = path.join(__dirname, '../data/image_mapping.json');
const imageMapping = JSON.parse(fs.readFileSync(imageMappingPath, 'utf8'));

// 转换函数
function transformArticleForStrapi(article) {
  const transformed = {
    title: article.title,
    description: article.description,
    slug: article.slug,
    locale: article.locale || 'zh-CN',
    // 处理cover字段
    cover: null,
    // 处理blocks字段
    blocks: [],
    // 处理author和category关联
    author: article.author ? { id: article.author.id } : null,
    category: article.category ? { id: article.category.id } : null
  };
  
  // 处理cover图片
  if (article.cover && imageMapping[article.id] && imageMapping[article.id].cover) {
    transformed.cover = {
      // 这里需要上传图片到Strapi后获取ID
      // 暂时使用本地文件名作为标识
      localFilename: imageMapping[article.id].cover.localFilename,
      originalUrl: imageMapping[article.id].cover.originalUrl
    };
  }
  
  // 处理blocks
  if (article.blocks && Array.isArray(article.blocks)) {
    transformed.blocks = article.blocks.map((block, index) => {
      if (block.__component === 'shared.rich-text') {
        return {
          __component: 'shared.rich-text',
          body: block.body
        };
      } else if (block.__component === 'shared.media') {
        const imageMap = imageMapping[article.id] && imageMapping[article.id].blocks[index];
        return {
          __component: 'shared.media',
          file: imageMap ? {
            localFilename: imageMap.localFilename,
            originalUrl: imageMap.originalUrl
          } : null
        };
      } else if (block.__component === 'shared.quote') {
        return {
          __component: 'shared.quote',
          title: block.title,
          body: block.body
        };
      }
      return block;
    });
  }
  
  return transformed;
}

// 创建批量上传格式
function createBatchUploadData(articles) {
  return articles.map(article => ({
    // 使用POST请求创建新文章
    method: 'POST',
    endpoint: '/api/articles',
    data: transformArticleForStrapi(article)
  }));
}

// 创建图片上传列表
function createImageUploadList(articles) {
  const imageUploads = [];
  
  articles.forEach(article => {
    // 添加cover图片
    if (article.cover && imageMapping[article.id] && imageMapping[article.id].cover) {
      imageUploads.push({
        type: 'cover',
        articleId: article.id,
        articleTitle: article.title,
        localFilename: imageMapping[article.id].cover.localFilename,
        originalUrl: imageMapping[article.id].cover.originalUrl
      });
    }
    
    // 添加blocks中的图片
    if (article.blocks && Array.isArray(article.blocks)) {
      article.blocks.forEach((block, index) => {
        if (block.__component === 'shared.media' && 
            imageMapping[article.id] && 
            imageMapping[article.id].blocks[index]) {
          imageUploads.push({
            type: 'block-media',
            articleId: article.id,
            articleTitle: article.title,
            blockIndex: index,
            localFilename: imageMapping[article.id].blocks[index].localFilename,
            originalUrl: imageMapping[article.id].blocks[index].originalUrl
          });
        }
      });
    }
  });
  
  return imageUploads;
}

// 主处理函数
function main() {
  console.log('=== 开始转换数据为Strapi格式 ===');
  
  // 转换文章数据
  const transformedArticles = processedArticles.map(transformArticleForStrapi);
  
  // 创建批量上传数据
  const batchUploadData = createBatchUploadData(processedArticles);
  
  // 创建图片上传列表
  const imageUploadList = createImageUploadList(processedArticles);
  
  // 保存转换后的数据
  const transformedPath = path.join(__dirname, '../data/transformed_articles.json');
  fs.writeFileSync(transformedPath, JSON.stringify(transformedArticles, null, 2));
  
  const batchUploadPath = path.join(__dirname, '../data/batch_upload_data.json');
  fs.writeFileSync(batchUploadPath, JSON.stringify(batchUploadData, null, 2));
  
  const imageUploadPath = path.join(__dirname, '../data/image_upload_list.json');
  fs.writeFileSync(imageUploadPath, JSON.stringify(imageUploadList, null, 2));
  
  // 输出统计信息
  console.log('\n=== 转换完成 ===');
  console.log(`文章总数: ${processedArticles.length}`);
  console.log(`转换后的文章数: ${transformedArticles.length}`);
  console.log(`批量上传任务数: ${batchUploadData.length}`);
  console.log(`需要上传的图片数: ${imageUploadList.length}`);
  
  console.log('\n=== 文件保存位置 ===');
  console.log(`转换后的文章数据: ${transformedPath}`);
  console.log(`批量上传数据: ${batchUploadPath}`);
  console.log(`图片上传列表: ${imageUploadPath}`);
  
  // 创建上传顺序建议
  const uploadGuide = {
    steps: [
      '1. 首先上传所有图片到Strapi媒体库',
      '2. 获取图片ID并更新文章数据中的图片引用',
      '3. 批量上传文章数据',
      '4. 验证上传结果'
    ],
    imageUploadCount: imageUploadList.length,
    articleUploadCount: batchUploadData.length,
    notes: [
      '图片需要先上传到Strapi媒体库获取ID',
      '文章数据中的图片引用需要替换为Strapi图片ID',
      '建议分批上传，每批10-20篇文章'
    ]
  };
  
  const uploadGuidePath = path.join(__dirname, '../data/upload_guide.json');
  fs.writeFileSync(uploadGuidePath, JSON.stringify(uploadGuide, null, 2));
  console.log(`上传指南: ${uploadGuidePath}`);
}

// 运行主函数
main();
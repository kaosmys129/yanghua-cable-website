const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');

// 强制使用.env.local中的配置
const STRAPI_URL = process.env.STRAPI_BASE_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || 'your_api_token_here';

// Strapi 客户端
const strapi = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * 下载图片到临时文件
 */
async function downloadImage(url, tempPath) {
  try {
    console.log(`📥 下载图片: ${url}`);
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const writer = require('fs').createWriteStream(tempPath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('上传图片失败详情:', error.response?.data || error.message);
    throw new Error(`上传图片失败: ${error.message}`);
  }
}

/**
 * 上传图片到 Strapi 媒体库
 */
async function uploadImageToStrapi(imagePath, fileName) {
  try {
    console.log(`📤 上传图片到 Strapi: ${fileName}`);
    
    const formData = new FormData();
    const fileBuffer = await fs.readFile(imagePath);
    
    formData.append('files', fileBuffer, {
      filename: fileName,
      contentType: 'image/jpeg'
    });
    
    console.log('上传请求详情:', {
      url: `${STRAPI_URL}/upload`,
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN.substring(0, 10)}...`,
        ...formData.getHeaders()
      }
    });
    
    const response = await strapi.post('/upload', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    // 清理临时文件
    await fs.unlink(imagePath);
    
    if (response.data && response.data.length > 0) {
      return { id: response.data[0].id };
    } else {
      throw new Error('上传响应格式错误');
    }
  } catch (error) {
    // 清理临时文件
    try {
      await fs.unlink(imagePath);
    } catch (unlinkError) {
      console.warn(`清理临时文件失败: ${unlinkError.message}`);
    }
    
    throw new Error(`上传图片失败: ${error.message}`);
  }
}

/**
 * 处理单个图片（下载并上传）
 */
async function processImage(imageUrl, index = 0) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    console.log(`⚠️  无效的图片URL: ${imageUrl}`);
    return null;
  }
  
  try {
    const tempDir = path.join(__dirname, '../temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const fileName = `image_${Date.now()}_${index}.jpg`;
    const tempPath = path.join(tempDir, fileName);
    
    await downloadImage(imageUrl, tempPath);
    const uploadedFile = await uploadImageToStrapi(tempPath, fileName);
    
    console.log(`✅ 图片处理完成: ${uploadedFile.id}`);
    return uploadedFile;
  } catch (error) {
    console.error(`❌ 处理图片失败: ${error.message}`);
    return null;
  }
}

/**
 * 清理文章数据，移除 Strapi 不允许的字段
 */
function cleanArticleData(article) {
  const cleaned = { ...article };
  
  // 移除 Strapi 不允许的字段
  const invalidFields = ['id', 'documentId', 'createdAt', 'updatedAt', 'publishedAt', 'locale'];
  invalidFields.forEach(field => {
    delete cleaned[field];
  });
  
  // 处理分类字段
  if (cleaned.category && typeof cleaned.category === 'object') {
    cleaned.category = cleaned.category.id;
  }
  
  // 处理作者字段
  if (cleaned.author && typeof cleaned.author === 'object') {
    cleaned.author = cleaned.author.id;
  }
  
  // 清理 cover 对象中的 id 字段
  if (cleaned.cover && typeof cleaned.cover === 'object') {
    delete cleaned.cover.id;
  }
  
  // 清理 blocks 中的 id 字段
  if (cleaned.blocks && Array.isArray(cleaned.blocks)) {
    cleaned.blocks = cleaned.blocks.map(block => {
      const cleanedBlock = { ...block };
      delete cleanedBlock.id;
      
      // 清理媒体文件对象中的 id 字段
      if (cleanedBlock.__component === 'shared.media' && cleanedBlock.file && typeof cleanedBlock.file === 'object') {
        delete cleanedBlock.file.id;
      }
      
      return cleanedBlock;
    });
  }
  
  return cleaned;
}

/**
 * 处理文章的图片
 */
async function processArticleImages(article) {
  const processedArticle = { ...article };
  
  // 处理封面图片
  if (processedArticle.cover && processedArticle.cover.url) {
    console.log('🖼️  处理封面图片...');
    const uploadedCover = await processImage(processedArticle.cover.url, 'cover');
    if (uploadedCover) {
      processedArticle.cover = uploadedCover;
    }
  }
  
  // 处理 blocks 中的媒体图片
  if (processedArticle.blocks && Array.isArray(processedArticle.blocks)) {
    console.log('🖼️  处理媒体区块图片...');
    
    for (let i = 0; i < processedArticle.blocks.length; i++) {
      const block = processedArticle.blocks[i];
      
      if (block.__component === 'shared.media' && block.file && block.file.url) {
        console.log(`   处理媒体区块 ${i + 1}...`);
        const uploadedFile = await processImage(block.file.url, `block_${i}`);
        if (uploadedFile) {
          processedArticle.blocks[i].file = uploadedFile;
        }
      }
    }
  }
  
  return processedArticle;
}

/**
 * 批量处理所有文章
 */
async function batchProcessArticles() {
  try {
    console.log('🚀 开始批量处理文章图片...');
    
    // 读取处理后的文章数据
    const dataPath = path.join(__dirname, '../data/processed_articles.json');
    const articlesData = JSON.parse(await fs.readFile(dataPath, 'utf8'));
    
    if (!articlesData.data || !Array.isArray(articlesData.data)) {
      throw new Error('文章数据格式错误');
    }
    
    const articles = articlesData.data;
    console.log(`📊 共找到 ${articles.length} 篇文章`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // 逐篇处理文章
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`\n📝 处理第 ${i + 1}/${articles.length} 篇文章: ${article.title}`);
      
      try {
        // 处理图片
        const articleWithImages = await processArticleImages(article);
        
        // 清理数据
        const cleanedData = cleanArticleData(articleWithImages);
        const uploadData = { data: cleanedData };
        
        // 检查文章是否已存在
        console.log('🔍 检查文章是否已存在...');
        const checkResponse = await strapi.get(`/api/articles?filters[slug][$eq]=${article.slug}`);
        
        let result;
        if (checkResponse.data.data && checkResponse.data.data.length > 0) {
          // 文章已存在，更新
          const existingArticle = checkResponse.data.data[0];
          console.log(`✅ 文章已存在 (ID: ${existingArticle.id})，正在更新...`);
          
          // 移除 documentId 字段
          const updateData = { ...uploadData };
          delete updateData.data.documentId;
          
          result = await strapi.put(`/api/articles/${existingArticle.documentId}`, updateData);
          console.log('✅ 文章更新成功');
        } else {
          // 文章不存在，创建
          console.log('🆕 创建新文章...');
          result = await strapi.post('/api/articles', uploadData);
          console.log('✅ 文章创建成功');
        }
        
        console.log(`📊 处理完成: ${result.data.data.title}`);
        successCount++;
        
      } catch (articleError) {
        console.error(`❌ 处理文章失败: ${articleError.message}`);
        console.error('错误详情:', articleError.response?.data || articleError.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 批量处理完成！');
    console.log(`✅ 成功: ${successCount} 篇`);
    console.log(`❌ 失败: ${errorCount} 篇`);
    
  } catch (error) {
    console.error('❌ 批量处理失败:', error.message);
    process.exit(1);
  }
}

// 运行批量处理
batchProcessArticles();
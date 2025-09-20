const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// 环境变量检查
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

if (!STRAPI_TOKEN) {
  console.error('❌ 请设置 STRAPI_TOKEN 环境变量');
  process.exit(1);
}

// 创建Strapi客户端
const strapiClient = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    'Authorization': `Bearer ${STRAPI_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// 创建上传客户端（用于文件上传）
const uploadClient = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    'Authorization': `Bearer ${STRAPI_TOKEN}`
  }
});

// 下载图片到临时文件
async function downloadImage(url, filename) {
  try {
    console.log(`  下载图片: ${url}`);
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, filename);
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`  下载图片失败: ${url}`, error.message);
    throw error;
  }
}

// 上传图片到Strapi媒体库
async function uploadImageToStrapi(filePath, fileName) {
  try {
    console.log(`  上传图片到Strapi: ${fileName}`);
    
    const formData = new FormData();
    formData.append('files', fs.createReadStream(filePath), {
      filename: fileName,
      contentType: 'image/jpeg'
    });
    
    const response = await uploadClient.post('/api/upload', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    // 清理临时文件
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // 只返回id字段，避免其他字段导致更新错误
    return {
      id: response.data[0].id
    };
  } catch (error) {
    console.error(`  上传图片到Strapi失败: ${fileName}`, error.message);
    throw error;
  }
}

// 处理图片上传
async function processImage(imageData) {
  if (!imageData || !imageData.url) {
    return null;
  }
  
  try {
    // 从URL中提取文件名
    const urlPath = new URL(imageData.url).pathname;
    const fileName = path.basename(urlPath) || 'image.jpg';
    
    // 下载图片
    const filePath = await downloadImage(imageData.url, fileName);
    
    // 上传到Strapi
    const uploadedFile = await uploadImageToStrapi(filePath, fileName);
    
    // 返回Strapi文件格式 - 只返回id，避免documentId导致更新错误
    return {
      id: uploadedFile.id
    };
  } catch (error) {
    console.error('  处理图片失败:', error.message);
    return null;
  }
}

// 清理数据函数 - 移除Strapi不接受的字段
function cleanArticleData(articleData) {
  const cleaned = { ...articleData };
  
  // 移除可能导致问题的字段
  const invalidFields = ['method', 'action', 'id', 'createdAt', 'updatedAt', 'publishedAt', 'documentId'];
  invalidFields.forEach(field => {
    if (cleaned[field] !== undefined) {
      console.log(`  移除字段: ${field}`);
      delete cleaned[field];
    }
  });

  // 清理cover对象中的id字段（如果cover是对象）
  if (cleaned.cover && typeof cleaned.cover === 'object') {
    if (cleaned.cover.id !== undefined) {
      console.log(`  移除cover对象中的id字段`);
      delete cleaned.cover.id;
    }
  }

  // 清理blocks中媒体文件对象的id字段
  if (cleaned.blocks && Array.isArray(cleaned.blocks)) {
    cleaned.blocks = cleaned.blocks.map(block => {
      // 清理媒体文件对象的id字段
      if (block.__component === 'shared.media' && block.file && typeof block.file === 'object') {
        if (block.file.id !== undefined) {
          console.log(`  移除blocks中媒体文件对象的id字段`);
          delete block.file.id;
        }
      }
      // 清理所有组件的id字段（Strapi不允许在更新时包含组件id）
      if (block.id !== undefined) {
        console.log(`  移除blocks中组件的id字段`);
        delete block.id;
      }
      return block;
    });
  }
  
  // 清理category字段 - 处理为关系引用
  if (cleaned.category) {
    console.log(`  清理category字段`);
    // 将category转换为关系引用格式
    if (typeof cleaned.category === 'object' && cleaned.category.name) {
      const categoryName = cleaned.category.name;
      const categoryMap = {
        'food': 3,
        'tech': 2,
        'news': 1,
        'nature': 4,
        'story': 5
      };
      cleaned.category = categoryMap[categoryName] || 1; // 默认使用news
    } else if (typeof cleaned.category === 'string') {
      const categoryMap = {
        'food': 3,
        'tech': 2,
        'news': 1,
        'nature': 4,
        'story': 5
      };
      cleaned.category = categoryMap[cleaned.category] || 1;
    } else {
      cleaned.category = 1; // 默认使用news
    }
    console.log(`  分类ID: ${cleaned.category}`);
  }

  // 清理author字段 - 处理为关系引用
  if (cleaned.author) {
    console.log(`  清理author字段`);
    // 将author转换为关系引用格式
    if (typeof cleaned.author === 'object' && cleaned.author.name) {
      const authorName = cleaned.author.name;
      if (authorName === 'David Doe') {
        cleaned.author = 1; // David Doe的ID
      } else if (authorName === 'Sarah Baker') {
        cleaned.author = 2; // Sarah Baker的ID
      } else {
        cleaned.author = 1; // 默认使用David Doe
      }
    } else if (typeof cleaned.author === 'string') {
      if (cleaned.author === 'David Doe') {
        cleaned.author = 1;
      } else if (cleaned.author === 'Sarah Baker') {
        cleaned.author = 2;
      } else {
        cleaned.author = 1;
      }
    } else {
      cleaned.author = 1; // 默认使用David Doe
    }
    console.log(`  作者ID: ${cleaned.author}`);
  }
  
  return cleaned;
}

// 处理文章数据中的图片
async function processArticleImages(articleData) {
  const processedData = { ...articleData };
  
  console.log('🖼️  处理文章图片...');
  
  // 处理封面图片
  if (processedData.cover) {
    console.log('  处理封面图片...');
    const coverFile = await processImage(processedData.cover);
    if (coverFile) {
      processedData.cover = coverFile;
      console.log('  封面图片处理完成');
    } else {
      delete processedData.cover;
      console.log('  封面图片处理失败，移除封面');
    }
  }
  
  // 处理blocks中的媒体图片
  if (processedData.blocks && Array.isArray(processedData.blocks)) {
    console.log('  处理内容区块中的媒体图片...');
    processedData.blocks = await Promise.all(
      processedData.blocks.map(async (block) => {
        if (block.__component === 'shared.media' && block.file) {
          console.log('  处理media组件中的图片...');
          const mediaFile = await processImage(block.file);
          if (mediaFile) {
            return {
              ...block,
              file: mediaFile
            };
          } else {
            // 如果图片处理失败，移除这个block
            return null;
          }
        }
        return block;
      })
    ).then(blocks => blocks.filter(block => block !== null)); // 移除处理失败的block
  }
  
  return processedData;
}

// 测试单篇文章上传
async function testSingleUpload() {
  try {
    console.log('🧪 开始测试单篇文章上传（含图片处理）...');
    
    // 读取处理后的文章数据
    const processedArticlesPath = path.join(__dirname, '../data/processed_articles.json');
    if (!fs.existsSync(processedArticlesPath)) {
      console.error('❌ 找不到处理后的文章数据文件');
      process.exit(1);
    }
    
    const articlesData = JSON.parse(fs.readFileSync(processedArticlesPath, 'utf8'));
    if (!articlesData.data || !Array.isArray(articlesData.data)) {
      console.error('❌ 文章数据格式错误');
      process.exit(1);
    }
    
    // 找到测试文章
    const testArticle = articlesData.data.find(article => 
      article.title && article.title.includes('Yanghua Insights')
    );
    
    if (!testArticle) {
      console.error('❌ 找不到测试文章');
      process.exit(1);
    }
    
    console.log(`📄 测试文章: ${testArticle.title}`);
    console.log(`🌍 语言: ${testArticle.locale || 'en'}`);
    
    // 处理文章中的图片
    const articleWithImages = await processArticleImages(testArticle);
    
    // 清理数据
    console.log('🧹 清理文章数据...');
    const cleanedData = cleanArticleData(articleWithImages);
    
    // 准备上传数据
    const uploadData = {
      data: cleanedData
    };
    
    // 检查文章是否已存在
    console.log('🔍 检查文章是否已存在...');
    const existingResponse = await strapiClient.get(`/api/articles?filters[slug][$eq]=${testArticle.slug}&populate=*`);
    
    let result;
    if (existingResponse.data.data && existingResponse.data.data.length > 0) {
      // 文章已存在，更新
      const existingArticle = existingResponse.data.data[0];
      console.log(`✅ 文章已存在，ID: ${existingArticle.id}, 将使用 documentId: ${existingArticle.documentId} 进行更新`);
      console.log('🔄 更新文章...');
      
      // 清理上传数据，移除documentId字段（更新时不需要）
      const updateData = { ...uploadData };
      delete updateData.documentId;
      
      // 调试：打印更新数据的关键字段
      console.log('📋 更新数据预览:');
      console.log('  data keys:', Object.keys(updateData.data));
      if (updateData.data.cover) {
        console.log('  cover对象:', JSON.stringify(updateData.data.cover, null, 2));
      }
      
      // 检查整个updateData结构
      console.log('  updateData keys:', Object.keys(updateData));
      console.log('  整个data对象:', JSON.stringify(updateData.data, null, 2));
      
      result = await strapiClient.put(`/api/articles/${existingArticle.id}`, updateData);
      console.log('✅ 文章更新成功');
    } else {
      // 文章不存在，创建
      console.log('🆕 创建新文章...');
      result = await strapiClient.post('/api/articles', uploadData);
      console.log('✅ 文章创建成功');
    }
    
    console.log(`📊 响应数据标题: ${result.data.data.title}`);
    console.log(`🔗 响应数据Slug: ${result.data.data.slug}`);
    
    // 验证图片是否正确关联
    try {
      const articleId = result.data.data.id;
      const verifyResponse = await strapiClient.get(`/api/articles/${articleId}?populate[cover]=true&populate[blocks][populate][media]=true`);
      
      console.log('🔍 验证图片关联...');
      const articleData = verifyResponse.data.data;
      
      if (articleData.cover) {
        console.log('✅ 封面图片已正确关联');
        console.log(`   图片ID: ${articleData.cover.id}`);
        console.log(`   图片URL: ${articleData.cover.url}`);
      } else {
        console.log('⚠️  封面图片未关联');
      }
      
      const mediaBlocks = articleData.blocks?.filter(block => block.__component === 'shared.media') || [];
      console.log(`📊 媒体区块数量: ${mediaBlocks.length}`);
      
      mediaBlocks.forEach((block, index) => {
        if (block.file) {
          console.log(`✅ 媒体区块 ${index + 1} 图片已正确关联`);
          console.log(`   图片ID: ${block.file.id}`);
          console.log(`   图片URL: ${block.file.url}`);
        } else {
          console.log(`⚠️  媒体区块 ${index + 1} 图片未关联`);
        }
      });
    } catch (verifyError) {
      console.log('⚠️  图片关联验证失败，但文章更新成功');
      console.log(`   验证错误: ${verifyError.message}`);
      if (verifyError.response?.data) {
        console.log(`   错误详情: ${JSON.stringify(verifyError.response.data)}`);
      }
    }
    
    console.log('🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
    process.exit(1);
  }
}

// 运行测试
testSingleUpload();
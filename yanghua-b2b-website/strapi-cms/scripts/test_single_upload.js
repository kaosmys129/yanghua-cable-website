const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
  
  // 清理cover字段中的documentId和id
   if (cleaned.cover && typeof cleaned.cover === 'object') {
     const cleanedCover = { ...cleaned.cover };
     if (cleanedCover.documentId) {
       console.log(`  移除cover中的documentId`);
       delete cleanedCover.documentId;
     }
     if (cleanedCover.id) {
       console.log(`  移除cover中的id`);
       delete cleanedCover.id;
     }
     // 只保留必要的cover字段
     const validCoverFields = ['name', 'alternativeText', 'caption', 'width', 'height', 'formats', 'url', 'mime', 'size'];
     Object.keys(cleanedCover).forEach(key => {
       if (!validCoverFields.includes(key)) {
         delete cleanedCover[key];
       }
     });
     cleaned.cover = cleanedCover;
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
   
   // 清理blocks字段
   if (cleaned.blocks && Array.isArray(cleaned.blocks)) {
     console.log(`  清理blocks字段`);
     cleaned.blocks = cleaned.blocks.map(block => {
       const cleanedBlock = { ...block };
       // 移除block中的id
       if (cleanedBlock.id) {
         console.log(`  移除block中的id`);
         delete cleanedBlock.id;
       }
       
       // 如果是media组件，清理file对象
       if (cleanedBlock.__component === 'shared.media' && cleanedBlock.file) {
         console.log(`  清理media组件中的file对象`);
         const cleanedFile = { ...cleanedBlock.file };
         if (cleanedFile.id) {
           console.log(`  移除file中的id`);
           delete cleanedFile.id;
         }
         if (cleanedFile.documentId) {
           console.log(`  移除file中的documentId`);
           delete cleanedFile.documentId;
         }
         cleanedBlock.file = cleanedFile;
       }
       
       return cleanedBlock;
     });
   }
  
  return cleaned;
}

// 测试单篇文章上传
async function testSingleUpload() {
  try {
    console.log('🧪 开始测试单篇文章上传...');
    
    // 读取处理后的文章数据
    const articlesPath = path.join(__dirname, '../data/processed_articles.json');
    const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
    
    if (!articlesData.data || articlesData.data.length === 0) {
      console.error('❌ 没有找到文章数据');
      return;
    }
    
    // 获取第一篇文章进行测试
    const testArticle = articlesData.data[0];
    console.log(`📄 测试文章: ${testArticle.title}`);
    console.log(`🔍 原始数据字段: ${Object.keys(testArticle).join(', ')}`);
    
    // 清理数据
    const cleanedData = cleanArticleData(testArticle);
    console.log(`🧹 清理后数据字段: ${Object.keys(cleanedData).join(', ')}`);
    
    // 准备上传数据
    const uploadData = {
      data: cleanedData
    };
    
    console.log('📤 开始上传测试文章...');
    
    // 检查文章是否已存在
    let existingArticle = null;
    try {
      const existingResponse = await strapiClient.get(`/api/articles?filters[slug][$eq]=${cleanedData.slug}`);
      if (existingResponse.data.data && existingResponse.data.data.length > 0) {
        existingArticle = existingResponse.data.data[0];
        console.log(`  文章已存在，documentId: ${existingArticle.documentId}`);
      }
    } catch (error) {
      console.log('  文章不存在，将创建新文章');
    }
    
    let response;
    if (existingArticle) {
      // 更新现有文章
      console.log('  更新现有文章...');
      response = await strapiClient.put(`/api/articles/${existingArticle.documentId}`, uploadData);
    } else {
      // 创建新文章
      console.log('  创建新文章...');
      response = await strapiClient.post('/api/articles', uploadData);
    }
    
    console.log('✅ 单篇文章上传测试成功！');
    console.log('📊 响应数据:', {
      id: response.data.data.id,
      title: response.data.data.title,
      slug: response.data.data.slug
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ 单篇文章上传测试失败');
    console.error('错误信息:', error.message);
    
    if (error.response) {
      console.error('错误详情:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      if (error.response?.data?.error?.details) {
        console.log('详细错误信息:', JSON.stringify(error.response.data.error.details, null, 2));
      }
    }
    
    return false;
  }
}

// 测试Strapi连接
async function testConnection() {
  try {
    console.log('🔗 测试Strapi连接...');
    const response = await strapiClient.get('/api/articles?pagination[pageSize]=1');
    console.log('✅ Strapi连接成功');
    console.log(`📊 文章总数: ${response.data.meta.pagination.total}`);
    return true;
  } catch (error) {
    console.error('❌ Strapi连接失败');
    console.error('错误信息:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🚀 开始Strapi上传测试\n');
  
  // 测试连接
  const connectionOk = await testConnection();
  if (!connectionOk) {
    process.exit(1);
  }
  
  console.log('');
  
  // 测试单篇文章上传
  const uploadOk = await testSingleUpload();
  if (!uploadOk) {
    process.exit(1);
  }
  
  console.log('\n🎉 所有测试通过！');
}

// 运行测试
if (require.main === module) {
  main().catch(error => {
    console.error('测试过程中出错:', error);
    process.exit(1);
  });
}

module.exports = { testSingleUpload, cleanArticleData };
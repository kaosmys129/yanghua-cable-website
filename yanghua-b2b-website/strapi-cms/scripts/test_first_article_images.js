const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');

// 加载环境变量
const dotenvResult = require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true });

if (dotenvResult.error) {
  console.error('Error loading .env.local file:', dotenvResult.error);
} else {
  console.log('Successfully loaded .env.local file. Parsed content:');
  console.log(dotenvResult.parsed);
}

// 调试环境变量
console.log('=== 环境变量加载调试 ===');
console.log('STRAPI_BASE_URL:', process.env.STRAPI_BASE_URL);
console.log('STRAPI_API_TOKEN:', process.env.STRAPI_API_TOKEN);
console.log('Token长度:', process.env.STRAPI_API_TOKEN ? process.env.STRAPI_API_TOKEN.length : 'undefined');

// 强制使用.env.local中的配置
const STRAPI_URL = process.env.STRAPI_BASE_URL || 'https://fruitful-presence-02d7be759c.strapiapp.com';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || 'b3b23985b036c7d4b071c4d260445c6a75c5491ec862e6231557ee9174e72aca9474e0eb1006b4295a9d7f41289f537156f460fa149941c5cc3be60bc404dd4040fcdf890f87c73c311efa2166153a3da61d29ffe9eeffa3cb4873058fe3cab6c52f8d1e22735b1a1798eaa0eaf7909e02771cb711b08bd05d168e2c0613ee5d';

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
    console.error('下载图片失败:', error.message);
    throw new Error(`下载图片失败: ${error.message}`);
  }
}

/**
 * 上传图片到 Strapi 媒体库
 */
async function uploadImageToStrapi(imagePath, fileName) {
  try {
    console.log(`📤 上传图片到 Strapi: ${fileName}`);
    console.log(`📤 上传URL: ${STRAPI_URL}/upload`);
    console.log(`📤 Authorization: Bearer ${STRAPI_API_TOKEN.substring(0, 20)}...`);
    
    const formData = new FormData();
    const imageBuffer = await fs.readFile(imagePath);
    
    formData.append('files', imageBuffer, {
      filename: fileName,
      contentType: 'image/jpeg'
    });

    const response = await strapi.post('/upload', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    console.log(`✅ 图片上传成功: ${fileName}`);
    return response.data[0];
  } catch (error) {
    console.error('❌ 上传图片失败详情:', error.response?.data || error.message);
    throw new Error(`上传图片失败: ${error.message}`);
  }
}

/**
 * 测试第一篇文章的图片处理
 */
async function testFirstArticleImages() {
  let createdArticleId = null; // 用于跟踪创建的文章ID，以便清理
  try {
    console.log('🚀 开始测试第一篇文章的图片处理（创建新文章）...\n');

    // 1. 获取一个有效的作者ID
    console.log('🔄 获取有效作者ID...');
    const authorsResponse = await strapi.get('/authors?pagination[limit]=1');
    if (!authorsResponse.data.data || authorsResponse.data.data.length === 0) {
      throw new Error('在Strapi中找不到任何作者。');
    }
    const validAuthorId = authorsResponse.data.data[0].id;
    console.log(`✅ 获取到有效作者ID: ${validAuthorId}\n`);

    // 2. 读取处理后的文章数据
    console.log('🔄 读取本地文章数据...');
    const articlesData = JSON.parse(
      await fs.readFile('/Users/peterpc/Documents/Documents/yanghua cable web/yanghua-b2b-website/yanghua-b2b-website/strapi-cms/data/transformed_articles.json', 'utf8')
    );
    const articleToCreate = articlesData[0]; // 使用第一篇文章

    if (!articleToCreate) {
      throw new Error('在 transformed_articles.json 中没有找到任何文章。');
    }

    console.log(`📄 准备创建的文章: ${articleToCreate.title}`);
    console.log(`🔗 Slug: ${articleToCreate.slug}\n`);
    
    const results = {
      cover: null,
      blocks: [],
      errors: []
    };
    
    // 2. 处理封面图片
    if (articleToCreate.cover && articleToCreate.cover.url) {
      console.log('🖼️  处理封面图片...');
      try {
        const tempDir = '/tmp/strapi_test_images';
        await fs.mkdir(tempDir, { recursive: true });
        
        const coverFileName = `cover_${path.basename(articleToCreate.cover.url) || 'cover.jpg'}`;
        const tempCoverPath = path.join(tempDir, coverFileName);
        
        await downloadImage(articleToCreate.cover.url, tempCoverPath);
        console.log(`✅ 封面图片下载成功: ${coverFileName}`);
        
        const uploadedCover = await uploadImageToStrapi(tempCoverPath, coverFileName);
        articleToCreate.cover = uploadedCover.id;
        console.log(`✅ 封面图片上传成功，ID: ${uploadedCover.id}\n`);
        
        await fs.unlink(tempCoverPath);
      } catch (error) {
        console.error(`❌ 封面图片处理失败: ${error.message}\n`);
        results.errors.push({ type: 'cover', error: error.message });
      }
    } else {
      results.errors.push({ type: 'cover', error: 'No cover image found' });
    }
    
    // 3. 处理blocks中的媒体图片
    console.log('🖼️  处理blocks中的媒体图片...');
    if (articleToCreate.blocks && Array.isArray(articleToCreate.blocks)) {
      for (let i = 0; i < articleToCreate.blocks.length; i++) {
        const block = articleToCreate.blocks[i];
        
        if (block.__component === 'shared.media' && block.file && block.file.url) {
          console.log(`📸 处理block ${i + 1} 媒体图片...`);
          try {
            const tempDir = '/tmp/strapi_test_images';
            await fs.mkdir(tempDir, { recursive: true });
            
            const mediaFileName = `block_${i + 1}_${path.basename(block.file.url) || 'media.jpg'}`;
            const tempMediaPath = path.join(tempDir, mediaFileName);
            
            await downloadImage(block.file.url, tempMediaPath);
            console.log(`✅ Block ${i + 1} 媒体图片下载成功: ${mediaFileName}`);
            
            const uploadedMedia = await uploadImageToStrapi(tempMediaPath, mediaFileName);
            articleToCreate.blocks[i].file = uploadedMedia.id;
            results.blocks.push({
              blockIndex: i,
              uploaded: uploadedMedia,
              success: true
            });
            console.log(`✅ Block ${i + 1} 媒体图片上传成功，ID: ${uploadedMedia.id}\n`);
            
            await fs.unlink(tempMediaPath);
          } catch (error) {
            console.error(`❌ Block ${i + 1} 媒体图片处理失败: ${error.message}\n`);
            results.errors.push({ type: 'block', blockIndex: i, error: error.message });
          }
        }
      }
    }

    // 4. 在 Strapi 中创建新文章
    try {
      console.log('🔄 在 Strapi 中创建新文章...');
      
      const createPayload = {
        data: {
          ...articleToCreate,
          author: validAuthorId, // 强制使用有效的作者ID
          // 确保 slug 是唯一的，可以添加时间戳
          slug: `${articleToCreate.slug}-${Date.now()}`,
          publishedAt: new Date().toISOString(), // 立即发布
        }
      };

      const response = await strapi.post('/articles', createPayload);
      createdArticleId = response.data.data.id; // 保存数据库ID用于清理
      const documentId = response.data.data.documentId;
      console.log(`✅ 文章创建成功! DB ID: ${createdArticleId}, Document ID: ${documentId}\n`);

      // 5. 循序渐进地验证文章
      console.log('🔄 循序渐进地验证文章...');

      // 步骤1: 基础获取 (不带populate)
      try {
        console.log('  (1/4) 基础获取...');
        const basicArticle = await strapi.get(`/articles/${documentId}`);
        console.log('    ✅ 基础获取成功! 返回数据结构:');
        console.log(JSON.stringify(basicArticle.data, null, 2));
        if (!basicArticle.data || !basicArticle.data.data) {
          throw new Error('基础获取失败，未返回文章数据。');
        }
      } catch (e) {
        console.error('    ❌ 基础获取失败:', e.message);
        results.errors.push({ type: 'refetch_basic', error: e.message });
        throw e; // 如果基础获取都失败，后续步骤无意义
      }

      // 步骤2: 填充封面
      try {
        console.log('  (2/4) 填充封面...');
        const withCover = await strapi.get(`/articles/${documentId}?populate=cover`);
        console.log('    ✅ 封面填充成功! 返回数据结构:');
        console.log(JSON.stringify(withCover.data, null, 2));
        if (!withCover.data || !withCover.data.data || !withCover.data.data.cover) {
          console.warn('    ⚠️ 封面填充警告: 未找到封面数据。');
        }
      } catch (e) {
        console.error('    ❌ 封面填充失败:', e.message);
        results.errors.push({ type: 'refetch_cover', error: e.message });
      }

      // 步骤3: 浅层填充Blocks
      try {
        console.log('  (3/4) 浅层填充Blocks...');
        const withBlocks = await strapi.get(`/articles/${documentId}?populate=blocks`);
        console.log('    ✅ Blocks浅层填充成功! 返回数据结构:');
        console.log(JSON.stringify(withBlocks.data, null, 2));
        if (!withBlocks.data || !withBlocks.data.data || !withBlocks.data.data.blocks) {
          console.warn('    ⚠️ Blocks浅层填充警告: 未找到Blocks数据。');
        }
      } catch (e) {
        console.error('    ❌ Blocks浅层填充失败:', e.message);
        results.errors.push({ type: 'refetch_blocks', error: e.message });
      }

      // 步骤4: 深度填充Blocks (最可能出错的地方)
      try {
        console.log('  (4/4) 深度填充Blocks...');
        const withDeepBlocks = await strapi.get(`/articles/${documentId}?populate[blocks][populate]=*`);
        console.log('    ✅ Blocks深度填充成功! 返回数据结构:');
        console.log(JSON.stringify(withDeepBlocks.data, null, 2));
        if (!withDeepBlocks.data || !withDeepBlocks.data.data || !withDeepBlocks.data.data.blocks) {
          console.warn('    ⚠️ Blocks深度填充警告: 未找到深度填充的Blocks数据。');
        }
      } catch (e) {
        console.error('    ❌ Blocks深度填充失败:', e.message);
        results.errors.push({ type: 'refetch_deep_blocks', error: e.message });
      }

    } catch (error) {
      console.error('❌ 创建或验证 Strapi 文章失败:', error.response?.data || error.message);
      results.errors.push({ type: 'article_create_or_verify', error: error.message });
    }
    
    // 6. 输出测试结果
    console.log('\n📊 测试结果汇总:');
    console.log('==================');
    console.log(`✅ 封面图片: ${results.cover ? '成功' : '无封面图片'}`);
    console.log(`✅ Blocks媒体图片: ${results.blocks.length} 张成功`);
    console.log(`❌ 错误: ${results.errors.length} 个`);
    
    if (results.errors.length > 0) {
      console.log('\n🔍 错误详情:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.type} - ${error.error}`);
      });
    }
    
    // 7. 保存测试报告
    const testReport = {
      testDate: new Date().toISOString(),
      articleTitle: articleToCreate.title,
      articleSlug: articleToCreate.slug,
      results: results,
      summary: {
        coverSuccess: !!results.cover,
        blocksSuccess: results.blocks.length,
        totalErrors: results.errors.length
      }
    };
    
    await fs.writeFile(
      '/Users/peterpc/Documents/Documents/yanghua cable web/yanghua-b2b-website/yanghua-b2b-website/strapi-cms/data/test_first_article_report.json',
      JSON.stringify(testReport, null, 2)
    );
    
    console.log('\n💾 测试报告已保存到: test_first_article_report.json');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  } finally {
    // 8. 清理创建的文章
    if (createdArticleId) {
      try {
        console.log(`🧹 清理测试数据：删除文章 ID: ${createdArticleId}`);
        await strapi.delete(`/articles/${createdArticleId}`);
        console.log('✅ 清理成功。');
      } catch (cleanupError) {
        console.error('❌ 清理失败:', cleanupError.response?.data || cleanupError.message);
      }
    }
  }
}

// 运行测试
testFirstArticleImages();
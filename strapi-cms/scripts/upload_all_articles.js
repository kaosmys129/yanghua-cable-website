const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');

// Load environment variables
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

// Strapi client
const strapi = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Download image to a temporary file
 */
async function downloadImage(url, tempPath) {
  try {
    console.log(`📥 Downloading image: ${url}`);
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
    console.error('Failed to download image:', error.message);
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Upload image to Strapi media library
 */
async function uploadImageToStrapi(imagePath, fileName) {
  try {
    console.log(`📤 Uploading image to Strapi: ${fileName}`);
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

    console.log(`✅ Image uploaded successfully: ${fileName}`);
    return response.data[0];
  } catch (error) {
    console.error('❌ Failed to upload image:', error.response?.data || error.message);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Process and upload all articles
 */
async function uploadAllArticles() {
  try {
    console.log('🚀 Starting to process and upload all articles...');

    // 1. Get a valid author ID
    console.log('🔄 Getting a valid author ID...');
    const authorsResponse = await strapi.get('/authors?pagination[limit]=1');
    if (!authorsResponse.data.data || authorsResponse.data.data.length === 0) {
      throw new Error('No authors found in Strapi.');
    }
    const validAuthorId = authorsResponse.data.data[0].id;
    console.log(`✅ Valid author ID obtained: ${validAuthorId}\n`);

    // 2. Read processed article data
    console.log('🔄 Reading local article data...');
    const articlesData = JSON.parse(
      await fs.readFile('/Users/peterpc/Documents/Documents/yanghua cable web/yanghua-b2b-website/strapi-cms/data/transformed_articles.json', 'utf8')
    );

    if (!articlesData || articlesData.length === 0) {
      throw new Error('No articles found in transformed_articles.json.');
    }

    const uploadResults = [];
    let skippedCount = 0;

    for (const article of articlesData) {
      console.log(`--- Processing article: ${article.title} ---`);
      const articleToCreate = JSON.parse(JSON.stringify(article)); // Deep copy
      const results = {
        title: article.title,
        slug: article.slug,
        cover_success: false,
        blocks_success: 0,
        errors: []
      };

      // 3. Set Category ID
      if (articleToCreate.category && articleToCreate.category.id) {
        console.log(`🔗 Assigning category ID: ${articleToCreate.category.id}`);
        articleToCreate.category = articleToCreate.category.id;
      } else {
        console.warn(`⚠️ Article "${article.title}" has no category ID. It will be created without a category.`);
        delete articleToCreate.category;
      }

      // 4. Process cover image
      if (articleToCreate.cover && articleToCreate.cover.url) {
        console.log('🖼️  Processing cover image...');
        try {
          const tempDir = '/tmp/strapi_upload_images';
          await fs.mkdir(tempDir, { recursive: true });
          
          const coverFileName = `cover_${path.basename(articleToCreate.cover.url) || 'cover.jpg'}`;
          const tempCoverPath = path.join(tempDir, coverFileName);
          
          await downloadImage(articleToCreate.cover.url, tempCoverPath);
          const uploadedCover = await uploadImageToStrapi(tempCoverPath, coverFileName);
          articleToCreate.cover = uploadedCover.id;
          results.cover_success = true;
          console.log(`✅ Cover image uploaded successfully, ID: ${uploadedCover.id}\n`);
          
          await fs.unlink(tempCoverPath);
        } catch (error) {
          console.error(`❌ Cover image processing failed: ${error.message}\n`);
          results.errors.push({ type: 'cover', error: error.message });
        }
      } else {
        results.errors.push({ type: 'cover', error: 'No cover image found' });
      }
      
      // 5. Process media images in blocks
      console.log('🖼️  Processing media images in blocks...');
      if (articleToCreate.blocks && Array.isArray(articleToCreate.blocks)) {
        for (let i = 0; i < articleToCreate.blocks.length; i++) {
          const block = articleToCreate.blocks[i];
          
          if (block.__component === 'shared.media' && block.file && block.file.url) {
            console.log(`📸 Processing block ${i + 1} media image...`);
            try {
              const tempDir = '/tmp/strapi_upload_images';
              await fs.mkdir(tempDir, { recursive: true });
              
              const mediaFileName = `block_${i + 1}_${path.basename(block.file.url) || 'media.jpg'}`;
              const tempMediaPath = path.join(tempDir, mediaFileName);
              
              await downloadImage(block.file.url, tempMediaPath);
              const uploadedMedia = await uploadImageToStrapi(tempMediaPath, mediaFileName);
              articleToCreate.blocks[i].file = uploadedMedia.id;
              results.blocks_success++;
              console.log(`✅ Block ${i + 1} media image uploaded successfully, ID: ${uploadedMedia.id}\n`);
              
              await fs.unlink(tempMediaPath);
            } catch (error) {
              console.error(`❌ Block ${i + 1} media image processing failed: ${error.message}\n`);
              results.errors.push({ type: 'block', blockIndex: i, error: error.message });
            }
          }
        }
      }

      // 6. Create new article in Strapi
      try {
        console.log('🔄 Creating new article in Strapi...');
        
        // 检查文章是否已存在（基于slug）
        try {
          const existingResponse = await strapi.get(`/articles?filters[slug][$eq]=${encodeURIComponent(articleToCreate.slug)}`);
          if (existingResponse.data.data.length > 0) {
            console.log(`⚠️  文章已存在，跳过: ${articleToCreate.title}`);
            console.log(`   现有文章DocumentID: ${existingResponse.data.data[0].documentId}`);
            skippedCount++;
            continue;
          }
        } catch (checkError) {
          console.log(`检查文章存在性时出错: ${checkError.message}`);
        }
        
        const createPayload = {
          data: {
            ...articleToCreate,
            author: validAuthorId,
            category: articleToCreate.category ? articleToCreate.category.id : null, // 正确设置category ID
            slug: articleToCreate.slug, // 移除时间戳
            publishedAt: new Date().toISOString(),
          }
        };

        const response = await strapi.post('/articles', createPayload);
        const createdArticleId = response.data.data.id;
        console.log(`✅ Article created successfully! DB ID: ${createdArticleId}\n`);
        results.strapi_id = createdArticleId;

      } catch (error) {
        console.error('❌ Failed to create or verify Strapi article:', JSON.stringify(error.response?.data, null, 2) || error.message);
        results.errors.push({ type: 'article_create', error: error.message, details: error.response?.data });
      }
      
      uploadResults.push(results);
    }

    // 7. Save upload report
    const uploadReport = {
      uploadDate: new Date().toISOString(),
      results: uploadResults,
      summary: {
        totalArticles: articlesData.length,
        successfulUploads: uploadResults.filter(r => r.strapi_id).length,
        failedUploads: uploadResults.filter(r => !r.strapi_id).length,
        skippedUploads: skippedCount,
      }
    };
    
    await fs.writeFile(
      '/Users/peterpc/Documents/Documents/yanghua cable web/yanghua-b2b-website/strapi-cms/data/upload_all_articles_report.json',
      JSON.stringify(uploadReport, null, 2)
    );
    
    console.log('\n💾 Upload report saved to: upload_all_articles_report.json');
    
  } catch (error) {
    console.error('❌ A fatal error occurred during the upload process:', error.message);
    process.exit(1);
  }
}

// Run the upload process
uploadAllArticles();
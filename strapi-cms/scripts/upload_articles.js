const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 配置
const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL || 'https://your-strapi-cloud-instance.com';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || 'your-api-token';

// 读取处理后的数据
const dataPath = path.join(__dirname, '../data/processed_articles.json');
const logPath = path.join(__dirname, '../data/upload_log.json');

console.log('开始上传文章数据到Strapi Cloud...');
console.log(`目标服务器: ${STRAPI_BASE_URL}`);

async function uploadArticle(article, index) {
  try {
    console.log(`\n上传第 ${index + 1} 篇文章: ${article.title}`);
    
    // 准备上传数据
    const uploadData = {
      data: {
        title: article.title,
        description: article.description,
        slug: article.slug,
        locale: article.locale,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        publishedAt: article.publishedAt
      }
    };

    // 处理cover图片
    if (article.cover) {
      uploadData.data.cover = article.cover;
    }

    // 处理blocks内容
    if (article.blocks && article.blocks.length > 0) {
      uploadData.data.blocks = article.blocks;
    }

    // 处理author和category
    if (article.author) {
      uploadData.data.author = article.author;
    }
    if (article.category) {
      uploadData.data.category = article.category;
    }

    // 发送POST请求
    const response = await axios.post(
      `${STRAPI_BASE_URL}/api/articles`,
      uploadData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`
        },
        timeout: 30000 // 30秒超时
      }
    );

    console.log(`✅ 文章 "${article.title}" 上传成功`);
    console.log(`   返回ID: ${response.data.data.id}`);
    console.log(`   DocumentID: ${response.data.data.documentId}`);
    
    return {
      success: true,
      articleTitle: article.title,
      articleSlug: article.slug,
      responseId: response.data.data.id,
      responseDocumentId: response.data.data.documentId,
      statusCode: response.status
    };

  } catch (error) {
    console.error(`❌ 文章 "${article.title}" 上传失败`);
    
    let errorDetails = {
      success: false,
      articleTitle: article.title,
      articleSlug: article.slug,
      error: error.message
    };

    if (error.response) {
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   错误信息: ${JSON.stringify(error.response.data)}`);
      
      errorDetails.statusCode = error.response.status;
      errorDetails.responseData = error.response.data;
    } else if (error.request) {
      console.error(`   请求超时或无响应`);
      errorDetails.errorType = 'network';
    } else {
      console.error(`   错误: ${error.message}`);
      errorDetails.errorType = 'unknown';
    }

    return errorDetails;
  }
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
    console.log(`找到 ${articles.length} 篇文章需要上传`);

    // 上传结果记录
    const uploadResults = {
      startTime: new Date().toISOString(),
      totalArticles: articles.length,
      successfulUploads: 0,
      failedUploads: 0,
      results: []
    };

    // 逐个上传文章
    for (let i = 0; i < articles.length; i++) {
      const result = await uploadArticle(articles[i], i);
      uploadResults.results.push(result);
      
      if (result.success) {
        uploadResults.successfulUploads++;
      } else {
        uploadResults.failedUploads++;
      }

      // 每上传5篇文章后暂停1秒，避免服务器压力过大
      if ((i + 1) % 5 === 0 && i < articles.length - 1) {
        console.log(`\n⏸️  已上传 ${i + 1} 篇文章，暂停1秒...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    uploadResults.endTime = new Date().toISOString();
    uploadResults.duration = new Date(uploadResults.endTime) - new Date(uploadResults.startTime);

    // 保存上传日志
    fs.writeFileSync(logPath, JSON.stringify(uploadResults, null, 2));

    console.log('\n========================================');
    console.log('上传完成！');
    console.log(`总计: ${uploadResults.totalArticles} 篇文章`);
    console.log(`成功: ${uploadResults.successfulUploads} 篇`);
    console.log(`失败: ${uploadResults.failedUploads} 篇`);
    console.log(`用时: ${uploadResults.duration} 毫秒`);
    console.log(`详细日志已保存到: ${logPath}`);

    // 如果有失败的文章，显示失败详情
    if (uploadResults.failedUploads > 0) {
      console.log('\n失败的文章详情:');
      uploadResults.results
        .filter(result => !result.success)
        .forEach(result => {
          console.log(`  - ${result.articleTitle} (${result.articleSlug})`);
          console.log(`    错误: ${result.error}`);
          if (result.statusCode) {
            console.log(`    状态码: ${result.statusCode}`);
          }
        });
    }

  } catch (error) {
    console.error('上传过程中出错:', error.message);
    process.exit(1);
  }
}

// 检查环境变量
if (!STRAPI_BASE_URL || STRAPI_BASE_URL === 'https://your-strapi-cloud-instance.com') {
  console.error('错误: 请设置 STRAPI_BASE_URL 环境变量');
  console.error('示例: export STRAPI_BASE_URL=https://your-strapi-instance.com');
  process.exit(1);
}

if (!STRAPI_API_TOKEN || STRAPI_API_TOKEN === 'your-api-token') {
  console.error('错误: 请设置 STRAPI_API_TOKEN 环境变量');
  console.error('示例: export STRAPI_API_TOKEN=your-api-token');
  process.exit(1);
}

// 运行主函数
main().catch(error => {
  console.error('程序执行失败:', error);
  process.exit(1);
});
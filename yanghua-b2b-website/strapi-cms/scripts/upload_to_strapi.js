const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 配置
const STRAPI_URL = process.env.STRAPI_URL || 'https://your-strapi-instance.com';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const BATCH_SIZE = 10;

// 文件路径
const BATCH_UPLOAD_DATA_PATH = path.join(__dirname, '../data/batch_upload_data.json');
const UPLOAD_RESULTS_PATH = path.join(__dirname, '../data/upload_results.json');

console.log('开始上传文章数据到Strapi Cloud...');
console.log(`目标服务器: ${STRAPI_URL}`);

// 创建Strapi客户端
const strapiClient = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    'Authorization': `Bearer ${STRAPI_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// 上传单篇文章
async function uploadArticle(articleData) {
  try {
    console.log(`正在上传文章: ${articleData.title}`);
    
    // 检查文章是否已存在
    let existingArticle = null;
    try {
      const existingResponse = await strapiClient.get(`/api/articles`, {
        params: {
          filters: {
            slug: {
              $eq: articleData.slug
            }
          }
        }
      });
      
      if (existingResponse.data.data && existingResponse.data.data.length > 0) {
        existingArticle = existingResponse.data.data[0];
        console.log(`  文章已存在，ID: ${existingArticle.id}`);
      }
    } catch (error) {
      // 文章不存在，继续创建
      console.log(`  文章不存在，将创建新文章`);
    }

    // 准备上传数据
    const uploadData = {
      data: articleData
    };

    if (existingArticle) {
      // 更新现有文章
      const updateResponse = await strapiClient.put(`/api/articles/${existingArticle.id}`, uploadData);
      console.log(`  ✅ 文章更新成功`);
      
      return {
        success: true,
        action: 'updated',
        articleId: existingArticle.id,
        slug: articleData.slug,
        title: articleData.title
      };
    } else {
      // 创建新文章
      const createResponse = await strapiClient.post('/api/articles', uploadData);
      console.log(`  ✅ 文章创建成功，ID: ${createResponse.data.data.id}`);
      
      return {
        success: true,
        action: 'created',
        articleId: createResponse.data.data.id,
        slug: articleData.slug,
        title: articleData.title
      };
    }

  } catch (error) {
    console.error(`  ❌ 上传失败: ${error.message}`);
    
    if (error.response) {
      console.error(`  错误详情:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    return {
      success: false,
      action: 'failed',
      slug: articleData.slug,
      title: articleData.title,
      error: error.message,
      errorDetails: error.response ? error.response.data : null
    };
  }
}

// 批量上传文章
async function uploadArticles(articles) {
  const uploadResults = {
    startTime: new Date().toISOString(),
    totalArticles: articles.length,
    successfulUploads: 0,
    failedUploads: 0,
    createdArticles: 0,
    updatedArticles: 0,
    results: []
  };

  console.log(`\n开始批量上传 ${articles.length} 篇文章...`);

  // 逐个上传文章
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n[${i + 1}/${articles.length}] 处理文章...`);
    
    const result = await uploadArticle(article);
    uploadResults.results.push(result);
    
    if (result.success) {
      uploadResults.successfulUploads++;
      if (result.action === 'created') {
        uploadResults.createdArticles++;
      } else if (result.action === 'updated') {
        uploadResults.updatedArticles++;
      }
    } else {
      uploadResults.failedUploads++;
    }

    // 每上传5篇文章后暂停2秒，避免服务器压力过大
    if ((i + 1) % 5 === 0 && i < articles.length - 1) {
      console.log(`\n⏸️  已上传 ${i + 1} 篇文章，暂停2秒...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  uploadResults.endTime = new Date().toISOString();
  uploadResults.duration = new Date(uploadResults.endTime) - new Date(uploadResults.startTime);

  return uploadResults;
}

// 验证上传结果
async function verifyUploads(uploadResults) {
  console.log('\n开始验证上传结果...');
  
  const verificationResults = {
    startTime: new Date().toISOString(),
    totalVerified: 0,
    verifiedSuccessfully: 0,
    verificationFailed: 0,
    results: []
  };

  // 只验证成功上传的文章
  const successfulUploads = uploadResults.results.filter(result => result.success);
  
  for (const uploadResult of successfulUploads) {
    try {
      console.log(`验证文章: ${uploadResult.title}`);
      
      const response = await strapiClient.get(`/api/articles/${uploadResult.articleId}`, {
        params: {
          populate: 'cover,blocks,author,category,tags'
        }
      });

      const article = response.data.data;
      
      const verification = {
        articleId: uploadResult.articleId,
        slug: uploadResult.slug,
        title: uploadResult.title,
        verified: true,
        details: {
          title: article.attributes.title,
          slug: article.attributes.slug,
          description: article.attributes.description,
          locale: article.attributes.locale,
          hasCover: !!article.attributes.cover?.data,
          blocksCount: article.attributes.blocks?.length || 0,
          hasAuthor: !!article.attributes.author?.data,
          hasCategory: !!article.attributes.category?.data,
          tagsCount: article.attributes.tags?.data?.length || 0
        }
      };

      verificationResults.results.push(verification);
      verificationResults.verifiedSuccessfully++;
      verificationResults.totalVerified++;
      
      console.log(`  ✅ 验证成功`);
      console.log(`    标题: ${verification.details.title}`);
      console.log(`    封面图片: ${verification.details.hasCover ? '有' : '无'}`);
      console.log(`    Blocks数量: ${verification.details.blocksCount}`);
      console.log(`    标签数量: ${verification.details.tagsCount}`);

    } catch (error) {
      console.error(`  ❌ 验证失败: ${error.message}`);
      
      verificationResults.results.push({
        articleId: uploadResult.articleId,
        slug: uploadResult.slug,
        title: uploadResult.title,
        verified: false,
        error: error.message
      });
      
      verificationResults.verificationFailed++;
      verificationResults.totalVerified++;
    }
  }

  verificationResults.endTime = new Date().toISOString();
  verificationResults.duration = new Date(verificationResults.endTime) - new Date(verificationResults.startTime);

  return verificationResults;
}

// 批量上传文章
async function batchUploadArticles(articles) {
  const results = [];
  
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    console.log(`上传第 ${i + 1} - ${Math.min(i + BATCH_SIZE, articles.length)} 篇文章...`);
    
    const batchResults = await Promise.all(
      batch.map(article => uploadArticle(article))
    );
    
    results.push(...batchResults);
    
    // 每批之间稍作延迟，避免服务器压力过大
    if (i + BATCH_SIZE < articles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// 验证上传结果
function validateUploadResults(results) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: (successful.length / results.length * 100).toFixed(2) + '%',
    failedDetails: failed.map(f => ({
      title: f.title || 'Unknown',
      slug: f.slug || 'Unknown',
      error: f.error
    }))
  };
}

// 生成上传建议
function generateRecommendations(uploadResults) {
  const recommendations = [];
  
  if (uploadResults.failedUploads > 0) {
    recommendations.push('部分文章上传失败，建议检查错误日志并重新上传失败的文章。');
  }
  
  if (uploadResults.updatedArticles > 0) {
    recommendations.push('检测到已有文章被更新，建议确认更新内容是否正确。');
  }
  
  if (uploadResults.createdArticles === uploadResults.totalArticles) {
    recommendations.push('所有文章均为新创建，建议后续定期备份数据。');
  }
  
  if (uploadResults.successfulUploads === uploadResults.totalArticles) {
    recommendations.push('所有文章上传成功，数据同步完成。');
  }
  
  return recommendations;
}

// 主函数
async function main() {
  try {
    // 检查环境变量
    if (!STRAPI_TOKEN || STRAPI_TOKEN === 'your-api-token') {
      throw new Error('请设置 STRAPI_TOKEN 环境变量');
    }
    
    if (!STRAPI_URL || STRAPI_URL === 'https://your-strapi-instance.com') {
      throw new Error('请设置 STRAPI_URL 环境变量');
    }

    // 读取处理后的数据
    console.log('读取处理后的数据...');
    const rawData = fs.readFileSync(BATCH_UPLOAD_DATA_PATH, 'utf8');
    const data = JSON.parse(rawData);
    
    if (!Array.isArray(data)) {
      throw new Error('数据格式错误：需要数组格式');
    }

    const articles = data;
    console.log(`找到 ${articles.length} 篇文章需要上传`);

    // 批量上传文章
    const uploadResults = await uploadArticles(articles);
    
    // 验证上传结果
    const verificationResults = await verifyUploads(uploadResults);

    // 合并结果
    const finalResults = {
      uploadResults,
      verificationResults,
      summary: {
        totalArticles: uploadResults.totalArticles,
        successfulUploads: uploadResults.successfulUploads,
        failedUploads: uploadResults.failedUploads,
        createdArticles: uploadResults.createdArticles,
        updatedArticles: uploadResults.updatedArticles,
        overallSuccessRate: ((uploadResults.successfulUploads / uploadResults.totalArticles) * 100).toFixed(2) + '%'
      }
    };

    // 生成上传建议
    const recommendations = generateRecommendations(uploadResults);
    finalResults.recommendations = recommendations;

    // 保存上传日志
    fs.writeFileSync(UPLOAD_RESULTS_PATH, JSON.stringify(finalResults, null, 2));

    // 生成上传报告
    const uploadReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalArticles: finalResults.summary.totalArticles,
        successfulUploads: finalResults.summary.successfulUploads,
        failedUploads: finalResults.summary.failedUploads,
        createdArticles: finalResults.summary.createdArticles,
        updatedArticles: finalResults.summary.updatedArticles,
        overallSuccessRate: finalResults.summary.overallSuccessRate
      },
      failedArticles: uploadResults.results.filter(r => !r.success).map(fail => ({
        title: fail.title || 'Unknown',
        slug: fail.slug || 'Unknown',
        error: fail.error
      })),
      recommendations: recommendations
    };

    const uploadReportPath = path.join(__dirname, '../data/upload_report.json');
    fs.writeFileSync(uploadReportPath, JSON.stringify(uploadReport, null, 2));

    console.log('\n========================================');
    console.log('数据上传完成！');
    console.log(`总计: ${finalResults.summary.totalArticles} 篇文章`);
    console.log(`成功上传: ${finalResults.summary.successfulUploads} 篇`);
    console.log(`上传失败: ${finalResults.summary.failedUploads} 篇`);
    console.log(`整体成功率: ${finalResults.summary.overallSuccessRate}`);
    console.log(`详细日志已保存到: ${UPLOAD_RESULTS_PATH}`);
    console.log(`上传报告已保存到: ${uploadReportPath}`);

    // 显示建议
    if (recommendations.length > 0) {
      console.log('\n建议:');
      recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    // 显示失败的文章
    if (uploadResults.failedUploads > 0) {
      console.log('\n上传失败的文章:');
      uploadResults.results.filter(r => !r.success).forEach(fail => {
        console.log(`  - ${fail.title || 'Unknown'} (${fail.slug || 'Unknown'})`);
        console.log(`    错误: ${fail.error}`);
      });
    }

  } catch (error) {
    console.error('上传过程中出错:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('程序执行失败:', error);
  process.exit(1);
});
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// 读取分析报告
const reportPath = path.join(__dirname, '../data/analysis_report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// 创建图片目录
const imagesDir = path.join(__dirname, '../data/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// 图片处理结果
const imageResults = {
  totalImages: report.imageUrls.length,
  downloaded: 0,
  failed: 0,
  skipped: 0,
  results: []
};

// 下载图片函数
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const file = fs.createWriteStream(filename);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve({ success: true, size: response.headers['content-length'] });
        });
      } else {
        file.destroy();
        fs.unlinkSync(filename);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.destroy();
      if (fs.existsSync(filename)) {
        fs.unlinkSync(filename);
      }
      reject(err);
    });
  });
}

// 获取文件名
function getFilenameFromUrl(url, articleId, type, blockIndex) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  const originalName = path.basename(pathname);
  
  // 创建新的文件名
  const extension = path.extname(originalName) || '.jpg';
  const timestamp = Date.now();
  
  if (type === 'cover') {
    return `cover_${articleId}_${timestamp}${extension}`;
  } else {
    return `block_${articleId}_${blockIndex}_${timestamp}${extension}`;
  }
}

// 处理所有图片
async function processAllImages() {
  console.log('=== 开始处理图片 ===');
  console.log(`总图片数: ${imageResults.totalImages}`);
  
  for (let i = 0; i < report.imageUrls.length; i++) {
    const imageInfo = report.imageUrls[i];
    console.log(`\n处理图片 ${i + 1}/${imageResults.totalImages}`);
    console.log(`URL: ${imageInfo.url}`);
    console.log(`类型: ${imageInfo.type}, 文章ID: ${imageInfo.articleId}`);
    
    try {
      // 检查URL是否有效
      if (!imageInfo.url || !imageInfo.url.startsWith('http')) {
        console.log('跳过: 无效的URL');
        imageResults.skipped++;
        imageResults.results.push({
          ...imageInfo,
          status: 'skipped',
          reason: 'Invalid URL'
        });
        continue;
      }
      
      // 生成文件名
      const filename = getFilenameFromUrl(
        imageInfo.url,
        imageInfo.articleId,
        imageInfo.type,
        imageInfo.blockIndex
      );
      const filepath = path.join(imagesDir, filename);
      
      // 检查文件是否已存在
      if (fs.existsSync(filepath)) {
        console.log('跳过: 文件已存在');
        imageResults.skipped++;
        imageResults.results.push({
          ...imageInfo,
          status: 'skipped',
          reason: 'File already exists',
          filename: filename
        });
        continue;
      }
      
      // 下载图片
      console.log('下载中...');
      const result = await downloadImage(imageInfo.url, filepath);
      
      console.log(`成功: 文件大小 ${result.size} bytes`);
      imageResults.downloaded++;
      imageResults.results.push({
        ...imageInfo,
        status: 'downloaded',
        filename: filename,
        size: result.size
      });
      
    } catch (error) {
      console.log(`失败: ${error.message}`);
      imageResults.failed++;
      imageResults.results.push({
        ...imageInfo,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // 输出总结
  console.log('\n=== 图片处理完成 ===');
  console.log(`总图片数: ${imageResults.totalImages}`);
  console.log(`下载成功: ${imageResults.downloaded}`);
  console.log(`下载失败: ${imageResults.failed}`);
  console.log(`跳过: ${imageResults.skipped}`);
  
  // 保存结果
  const resultsPath = path.join(__dirname, '../data/image_processing_results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(imageResults, null, 2));
  console.log(`\n处理结果已保存到: ${resultsPath}`);
  
  // 创建图片映射文件
  const imageMapping = {};
  imageResults.results.forEach(result => {
    if (result.status === 'downloaded') {
      if (!imageMapping[result.articleId]) {
        imageMapping[result.articleId] = {
          cover: null,
          blocks: {}
        };
      }
      
      if (result.type === 'cover') {
        imageMapping[result.articleId].cover = {
          originalUrl: result.url,
          localFilename: result.filename
        };
      } else if (result.type === 'block-media') {
        imageMapping[result.articleId].blocks[result.blockIndex] = {
          originalUrl: result.url,
          localFilename: result.filename
        };
      }
    }
  });
  
  const mappingPath = path.join(__dirname, '../data/image_mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(imageMapping, null, 2));
  console.log(`图片映射文件已保存到: ${mappingPath}`);
}

// 运行处理
processAllImages().catch(console.error);
const Strapi = require('strapi-sdk-js');
const fs = require('fs');
const path = require('path');

// 配置Strapi连接
const strapi = new Strapi({ url: 'http://localhost:1337' });

async function testArticleAPI() {
  try {
    console.log('正在测试Strapi Articles API...');
    
    // 获取所有文章 - 先尝试简单的populate
    const articles = await strapi.find('articles', {
      populate: '*'
    });
    
    console.log('API调用成功！');
    console.log(`获取到 ${articles.data?.length || 0} 篇文章`);
    
    // 保存完整数据到JSON文件
    const outputPath = path.join(__dirname, 'src', 'lib', 'final full article API result.json');
    fs.writeFileSync(outputPath, JSON.stringify(articles, null, 2), 'utf8');
    
    console.log(`完整文章数据已保存到: ${outputPath}`);
    
    // 显示第一篇文章的结构
    if (articles.data && articles.data.length > 0) {
      console.log('\n第一篇文章的数据结构:');
      console.log(JSON.stringify(articles.data[0], null, 2));
    }
    
  } catch (error) {
    console.error('API调用失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
testArticleAPI();
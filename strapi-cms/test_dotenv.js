const path = require('path');
const fs = require('fs');

// 清除所有环境变量缓存
delete process.env.STRAPI_API_TOKEN;
delete process.env.STRAPI_BASE_URL;

console.log('=== 测试dotenv加载 ===');

// 检查.env.local文件是否存在
const envLocalPath = path.join(__dirname, '.env.local');
console.log('.env.local文件存在:', fs.existsSync(envLocalPath));

if (fs.existsSync(envLocalPath)) {
  console.log('.env.local文件内容:');
  const content = fs.readFileSync(envLocalPath, 'utf8');
  console.log(content);
  
  // 手动解析STRAPI_API_TOKEN
  const lines = content.split('\n');
  const tokenLine = lines.find(line => line.startsWith('STRAPI_API_TOKEN='));
  if (tokenLine) {
    const token = tokenLine.split('=')[1];
    console.log('手动解析的Token:', token);
    console.log('手动解析的Token长度:', token.length);
  }
}

// 加载dotenv
require('dotenv').config({ path: envLocalPath });

console.log('\n=== dotenv加载后 ===');
console.log('STRAPI_BASE_URL:', process.env.STRAPI_BASE_URL);
console.log('STRAPI_API_TOKEN:', process.env.STRAPI_API_TOKEN);
console.log('Token长度:', process.env.STRAPI_API_TOKEN ? process.env.STRAPI_API_TOKEN.length : 'undefined');
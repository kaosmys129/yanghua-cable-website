const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

console.log('=== 环境变量调试 ===');
console.log('STRAPI_BASE_URL:', process.env.STRAPI_BASE_URL);
console.log('STRAPI_API_TOKEN:', process.env.STRAPI_API_TOKEN);
console.log('Token长度:', process.env.STRAPI_API_TOKEN ? process.env.STRAPI_API_TOKEN.length : 'undefined');

// 检查文件是否存在
const fs = require('fs');
const envPath = path.join(__dirname, '.env.local');
console.log('文件存在:', fs.existsSync(envPath));
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('文件内容预览:');
  console.log(content.substring(0, 200));
}
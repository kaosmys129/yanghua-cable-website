#!/usr/bin/env node

/**
 * Strapi Cloud 配置检查脚本
 * 检查当前项目在 Strapi Cloud 上的配置信息
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查 Strapi Cloud 配置信息...\n');

// 1. 检查项目基本信息
function checkProjectInfo() {
  console.log('📋 项目基本信息:');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log(`   项目名称: ${packageJson.name}`);
    console.log(`   版本: ${packageJson.version}`);
    
    if (packageJson.strapi) {
      console.log(`   Strapi UUID: ${packageJson.strapi.uuid}`);
      console.log(`   Install ID: ${packageJson.strapi.installId}`);
    }
    
    // 检查 Strapi Cloud 插件
    const hasCloudPlugin = packageJson.dependencies && packageJson.dependencies['@strapi/plugin-cloud'];
    console.log(`   Strapi Cloud 插件: ${hasCloudPlugin ? '✅ 已安装 (' + hasCloudPlugin + ')' : '❌ 未安装'}`);
  }
  console.log('');
}

// 2. 检查当前目录结构
function checkDirectoryStructure() {
  console.log('📁 当前目录结构:');
  
  const currentDir = process.cwd();
  console.log(`   当前工作目录: ${currentDir}`);
  
  // 检查是否在正确的 Strapi 项目目录
  const strapiConfigExists = fs.existsSync(path.join(currentDir, 'config'));
  const packageJsonExists = fs.existsSync(path.join(currentDir, 'package.json'));
  const srcExists = fs.existsSync(path.join(currentDir, 'src'));
  
  console.log(`   config/ 目录: ${strapiConfigExists ? '✅ 存在' : '❌ 不存在'}`);
  console.log(`   package.json: ${packageJsonExists ? '✅ 存在' : '❌ 不存在'}`);
  console.log(`   src/ 目录: ${srcExists ? '✅ 存在' : '❌ 不存在'}`);
  
  // 显示相对于项目根目录的路径
  const projectRoot = path.resolve(__dirname, '../../..');
  const relativePath = path.relative(projectRoot, currentDir);
  console.log(`   相对于项目根目录: ${relativePath}`);
  console.log('');
}

// 3. 检查环境变量配置
function checkEnvironmentConfig() {
  console.log('🔧 环境变量配置:');
  
  // 检查 .env 文件
  const envFiles = ['.env', '.env.local', '.env.production'];
  
  envFiles.forEach(envFile => {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`   ${envFile}: ✅ 存在`);
      
      // 读取并显示相关配置（不显示敏感信息）
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        if (line.includes('STRAPI_') || line.includes('HOST') || line.includes('PORT')) {
          // 隐藏敏感信息
          if (line.includes('TOKEN') || line.includes('SECRET') || line.includes('KEY')) {
            const [key] = line.split('=');
            console.log(`     ${key}=***`);
          } else {
            console.log(`     ${line}`);
          }
        }
      });
    } else {
      console.log(`   ${envFile}: ❌ 不存在`);
    }
  });
  console.log('');
}

// 4. 检查 Strapi Cloud 连接配置
function checkCloudConnection() {
  console.log('☁️  Strapi Cloud 连接配置:');
  
  // 从环境变量或配置中获取 Cloud URL
  const cloudUrl = process.env.STRAPI_BASE_URL || process.env.STRAPI_API_URL || 'https://fruitful-presence-02d7be759c.strapiapp.com';
  console.log(`   Cloud URL: ${cloudUrl}`);
  
  // 解析 URL 获取项目信息
  try {
    const url = new URL(cloudUrl);
    const subdomain = url.hostname.split('.')[0];
    console.log(`   项目子域名: ${subdomain}`);
    console.log(`   完整域名: ${url.hostname}`);
  } catch (error) {
    console.log(`   URL 解析错误: ${error.message}`);
  }
  console.log('');
}

// 5. 检查部署相关配置
function checkDeploymentConfig() {
  console.log('🚀 部署配置信息:');
  
  // 检查 package.json 中的脚本
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.scripts) {
      const deployScript = packageJson.scripts.deploy;
      const buildScript = packageJson.scripts.build;
      
      console.log(`   部署脚本: ${deployScript || '未配置'}`);
      console.log(`   构建脚本: ${buildScript || '未配置'}`);
    }
  }
  
  // 检查是否有 Strapi Cloud 相关配置文件
  const configFiles = ['strapi.config.js', 'strapi.config.ts', '.strapirc'];
  configFiles.forEach(configFile => {
    const configPath = path.join(process.cwd(), configFile);
    console.log(`   ${configFile}: ${fs.existsSync(configPath) ? '✅ 存在' : '❌ 不存在'}`);
  });
  console.log('');
}

// 6. 显示推荐的 Root Directory 设置
function showRootDirectoryRecommendations() {
  console.log('💡 Root Directory 设置建议:');
  console.log('');
  console.log('   基于当前项目结构，推荐的 Strapi Cloud Root Directory 设置:');
  console.log('');
  console.log('   🎯 推荐设置: yanghua-b2b-website/strapi-cms');
  console.log('');
  console.log('   📝 说明:');
  console.log('   - 这是相对于 Git 仓库根目录的路径');
  console.log('   - Strapi Cloud 会在这个目录下查找 package.json');
  console.log('   - 确保该目录包含完整的 Strapi 项目文件');
  console.log('');
  console.log('   🔧 在 Strapi Cloud 控制台中设置:');
  console.log('   1. 登录 Strapi Cloud 控制台');
  console.log('   2. 选择您的项目');
  console.log('   3. 进入 Settings → General');
  console.log('   4. 在 "Root Directory" 字段中输入: yanghua-b2b-website/strapi-cms');
  console.log('   5. 保存并重新部署');
  console.log('');
}

// 主函数
async function main() {
  try {
    checkProjectInfo();
    checkDirectoryStructure();
    checkEnvironmentConfig();
    checkCloudConnection();
    checkDeploymentConfig();
    showRootDirectoryRecommendations();
    
    console.log('✅ 配置检查完成!');
    console.log('');
    console.log('如需更多帮助，请查看:');
    console.log('- Strapi Cloud 文档: https://docs.strapi.io/cloud');
    console.log('- 项目集成文档: STRAPI_CLOUD_INTEGRATION.md');
    
  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  checkProjectInfo,
  checkDirectoryStructure,
  checkEnvironmentConfig,
  checkCloudConnection,
  checkDeploymentConfig,
  showRootDirectoryRecommendations
};
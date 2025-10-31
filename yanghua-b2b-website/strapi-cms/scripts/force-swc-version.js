#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 强制修复 SWC 版本兼容性...');

// 强制安装兼容的 SWC 版本
try {
  console.log('📦 强制安装 SWC 1.7.36...');
  execSync('npm install @swc/core@1.7.36 --force --no-save', { stdio: 'inherit' });
  
  // 查找并替换 Strapi 内部的 SWC 版本
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  const strapiPath = path.join(nodeModulesPath, '@strapi', 'strapi', 'node_modules', '@swc', 'core');
  
  if (fs.existsSync(strapiPath)) {
    console.log('🔄 替换 Strapi 内部的 SWC 版本...');
    
    // 删除 Strapi 内部的 SWC
    execSync(`rm -rf "${strapiPath}"`, { stdio: 'inherit' });
    
    // 创建符号链接到正确的版本
    const correctSwcPath = path.join(nodeModulesPath, '@swc', 'core');
    if (fs.existsSync(correctSwcPath)) {
      execSync(`ln -sf "${correctSwcPath}" "${strapiPath}"`, { stdio: 'inherit' });
      console.log('✅ SWC 版本替换成功');
    }
  }
  
  // 检查 @vitejs/plugin-react-swc 中的 SWC
  const vitejsSwcPath = path.join(nodeModulesPath, '@vitejs', 'plugin-react-swc', 'node_modules', '@swc', 'core');
  if (fs.existsSync(vitejsSwcPath)) {
    console.log('🔄 替换 Vite React SWC 插件中的 SWC 版本...');
    execSync(`rm -rf "${vitejsSwcPath}"`, { stdio: 'inherit' });
    
    const correctSwcPath = path.join(nodeModulesPath, '@swc', 'core');
    if (fs.existsSync(correctSwcPath)) {
      execSync(`ln -sf "${correctSwcPath}" "${vitejsSwcPath}"`, { stdio: 'inherit' });
      console.log('✅ Vite SWC 版本替换成功');
    }
  }
  
  console.log('🎉 SWC 版本修复完成！');
  
} catch (error) {
  console.error('❌ SWC 版本修复失败:', error.message);
  process.exit(1);
}
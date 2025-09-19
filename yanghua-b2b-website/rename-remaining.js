const fs = require('fs');
const path = require('path');

// 剩余需要重命名的文件映射
const REMAINING_RENAME_MAP = {
  // 组件文件 - 从kebab-case改为PascalCase
  'src/components/blocks/media.tsx': 'src/components/blocks/Media.tsx',
  'src/components/blocks/quote.tsx': 'src/components/blocks/Quote.tsx',
  'src/components/blocks/slider.tsx': 'src/components/blocks/Slider.tsx',
  'src/components/custom/strapi-image.tsx': 'src/components/custom/StrapiImage.tsx',
  'src/components/theme-provider.tsx': 'src/components/ThemeProvider.tsx',
  'src/components/ui/animated-hero.tsx': 'src/components/ui/AnimatedHero.tsx',
  'src/components/ui/badge.tsx': 'src/components/ui/Badge.tsx',
  'src/components/ui/card.tsx': 'src/components/ui/Card.tsx',
  'src/components/ui/progress.tsx': 'src/components/ui/Progress.tsx',
  'src/components/ui/tabs.tsx': 'src/components/ui/Tabs.tsx',
  'src/components/ui/toast.tsx': 'src/components/ui/Toast.tsx',
  
  // 页面文件
  'src/app/[locale]/projects/ProjectsPageError.tsx': 'src/app/[locale]/projects/projects-page-error.tsx',
  'src/app/[locale]/projects/ProjectsPageFallback.tsx': 'src/app/[locale]/projects/projects-page-fallback.tsx',
  
  // 工具文件
  'public/english/convert-news.js': 'public/english/convert-news.js', // 已经符合规范
  'test-api.js': 'test-api.js' // 已经符合规范
};

// 搜索文件中的导入引用
function findImportReferences(targetFile) {
  const references = [];
  const baseName = path.basename(targetFile, path.extname(targetFile));
  
  function searchInFile(searchPath) {
    try {
      const content = fs.readFileSync(searchPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // 匹配import语句
        if (line.includes('import') && line.includes(baseName)) {
          references.push({
            file: searchPath,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    } catch (error) {
      // 忽略读取错误
    }
  }
  
  // 递归搜索所有相关文件
  function scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
            searchInFile(fullPath);
          }
        }
      }
    } catch (error) {
      // 忽略扫描错误
    }
  }
  
  scanDirectory(process.cwd());
  return references;
}

// 更新导入引用
function updateImportReferences(references, oldPath, newPath) {
  const oldBaseName = path.basename(oldPath, path.extname(oldPath));
  const newBaseName = path.basename(newPath, path.extname(newPath));
  
  references.forEach(ref => {
    try {
      const content = fs.readFileSync(ref.file, 'utf8');
      
      // 更新导入路径
      let updatedContent = content;
      
      // 处理各种导入格式
      updatedContent = updatedContent.replace(
        new RegExp(`(['"])[^'"]*${oldBaseName}(['"])`, 'g'),
        (match, quote1, quote2) => {
          return match.replace(oldBaseName, newBaseName);
        }
      );
      
      if (updatedContent !== content) {
        fs.writeFileSync(ref.file, updatedContent, 'utf8');
        console.log(`✅ 更新导入引用: ${ref.file}`);
      }
    } catch (error) {
      console.error(`❌ 更新引用失败 ${ref.file}: ${error.message}`);
    }
  });
}

// 执行重命名
function renameFile(oldPath, newPath) {
  try {
    // 确保目标目录存在
    const targetDir = path.dirname(newPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // 重命名文件
    fs.renameSync(oldPath, newPath);
    console.log(`✅ 重命名文件: ${oldPath} -> ${newPath}`);
    return true;
  } catch (error) {
    console.error(`❌ 重命名失败 ${oldPath}: ${error.message}`);
    return false;
  }
}

// 主执行函数
function executeRemainingRename() {
  console.log('🚀 开始处理剩余文件重命名...\n');
  
  const renamedFiles = [];
  const failedRenames = [];
  
  for (const [oldPath, newPath] of Object.entries(REMAINING_RENAME_MAP)) {
    console.log(`\n📝 处理文件: ${oldPath}`);
    
    // 检查源文件是否存在
    if (!fs.existsSync(oldPath)) {
      console.log(`⚠️  源文件不存在，跳过: ${oldPath}`);
      continue;
    }
    
    // 检查目标文件是否已存在
    if (fs.existsSync(newPath)) {
      console.log(`⚠️  目标文件已存在，跳过: ${newPath}`);
      continue;
    }
    
    // 如果新旧路径相同，跳过
    if (oldPath === newPath) {
      console.log(`⚠️  文件已符合规范，跳过: ${oldPath}`);
      continue;
    }
    
    // 查找导入引用
    console.log('🔍 搜索导入引用...');
    const references = findImportReferences(oldPath);
    console.log(`找到 ${references.length} 个引用`);
    
    // 执行重命名
    if (renameFile(oldPath, newPath)) {
      renamedFiles.push({ oldPath, newPath });
      
      // 更新导入引用
      if (references.length > 0) {
        console.log('🔄 更新导入引用...');
        updateImportReferences(references, oldPath, newPath);
      }
    } else {
      failedRenames.push({ oldPath, newPath });
    }
  }
  
  // 生成报告
  console.log('\n=== 剩余重命名完成报告 ===');
  console.log(`✅ 成功重命名: ${renamedFiles.length} 个文件`);
  console.log(`❌ 失败重命名: ${failedRenames.length} 个文件`);
  
  if (renamedFiles.length > 0) {
    console.log('\n成功重命名的文件:');
    renamedFiles.forEach(({ oldPath, newPath }) => {
      console.log(`  ${oldPath} -> ${newPath}`);
    });
  }
  
  if (failedRenames.length > 0) {
    console.log('\n失败的重命名:');
    failedRenames.forEach(({ oldPath, newPath }) => {
      console.log(`  ${oldPath} -> ${newPath}`);
    });
  }
}

// 运行重命名
if (require.main === module) {
  executeRemainingRename();
}

module.exports = { executeRemainingRename };
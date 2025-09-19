const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 重命名映射
const RENAME_MAP = {
  // Hooks文件
  'src/hooks/use-mobile.tsx': 'src/hooks/useMobile.tsx',
  'src/hooks/use-toast.ts': 'src/hooks/useToast.ts',
  
  // 组件文件
  'src/components/block-renderer.tsx': 'src/components/BlockRenderer.tsx',
  'src/components/blocks/media.tsx': 'src/components/blocks/Media.tsx',
  'src/components/blocks/quote.tsx': 'src/components/blocks/Quote.tsx',
  'src/components/blocks/rich-text.tsx': 'src/components/blocks/RichText.tsx',
  'src/components/custom/footer.tsx': 'src/components/custom/Footer.tsx',
  'src/components/custom/header.tsx': 'src/components/custom/Header.tsx',
  'src/components/custom/hero.tsx': 'src/components/custom/Hero.tsx',
  'src/components/custom/language-switcher.tsx': 'src/components/custom/LanguageSwitcher.tsx',
  'src/components/custom/logo.tsx': 'src/components/custom/Logo.tsx',
  'src/components/custom/navbar.tsx': 'src/components/custom/Navbar.tsx',
  'src/components/custom/page-header.tsx': 'src/components/custom/PageHeader.tsx',
  'src/components/custom/project-card.tsx': 'src/components/custom/ProjectCard.tsx',
  'src/components/custom/project-grid.tsx': 'src/components/custom/ProjectGrid.tsx',
  'src/components/ui/badge.tsx': 'src/components/ui/Badge.tsx',
  'src/components/ui/card.tsx': 'src/components/ui/Card.tsx',
  'src/components/ui/equipment-card.tsx': 'src/components/ui/EquipmentCard.tsx',
  'src/components/ui/flexible_busbar_comparison.tsx': 'src/components/ui/FlexibleBusbarComparison.tsx',
  'src/components/ui/infinite-slider.tsx': 'src/components/ui/InfiniteSlider.tsx',
  'src/components/ui/progress.tsx': 'src/components/ui/Progress.tsx',
  'src/components/ui/sticky-scroll-reveal.tsx': 'src/components/ui/StickyScrollReveal.tsx',
  'src/components/ui/tabs.tsx': 'src/components/ui/Tabs.tsx',
  'src/components/ui/toast.tsx': 'src/components/ui/Toast.tsx',
  
  // 工具文件
  'src/lib/errorLogger.ts': 'src/lib/error-logger.ts',
  'public/english/convertNews.js': 'public/english/convert-news.js'
};

// 搜索文件中的导入引用
function findImportReferences(filePath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const references = [];
  
  function searchInFile(searchPath) {
    try {
      const content = fs.readFileSync(searchPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // 匹配import语句
        const importMatch = line.match(/import.*from\s+['"]([^'"]+)['"]/g);
        if (importMatch) {
          importMatch.forEach(match => {
            const pathMatch = match.match(/from\s+['"]([^'"]+)['"]/);;
            if (pathMatch) {
              const importPath = pathMatch[1];
              // 检查是否引用了目标文件
              if (importPath.includes(filePath.replace(/\.(tsx?|jsx?)$/, '')) ||
                  importPath === filePath ||
                  importPath === './' + path.basename(filePath, path.extname(filePath))) {
                references.push({
                  file: searchPath,
                  line: index + 1,
                  content: line.trim(),
                  importPath
                });
              }
            }
          });
        }
      });
    } catch (error) {
      console.warn(`无法读取文件 ${searchPath}: ${error.message}`);
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
          if (extensions.includes(ext)) {
            searchInFile(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`无法扫描目录 ${dirPath}: ${error.message}`);
    }
  }
  
  scanDirectory(process.cwd());
  return references;
}

// 更新导入引用
function updateImportReferences(references, oldPath, newPath) {
  const updatedFiles = new Set();
  
  references.forEach(ref => {
    try {
      const content = fs.readFileSync(ref.file, 'utf8');
      const oldBaseName = path.basename(oldPath, path.extname(oldPath));
      const newBaseName = path.basename(newPath, path.extname(newPath));
      
      // 更新导入路径
      let updatedContent = content;
      
      // 处理相对路径导入
      const relativeOldPath = path.relative(path.dirname(ref.file), oldPath).replace(/\.(tsx?|jsx?)$/, '');
      const relativeNewPath = path.relative(path.dirname(ref.file), newPath).replace(/\.(tsx?|jsx?)$/, '');
      
      // 替换导入路径
      updatedContent = updatedContent.replace(
        new RegExp(`from\\s+['"]([^'"]*${oldBaseName}[^'"]*)['"]`, 'g'),
        (match, importPath) => {
          let newImportPath = importPath.replace(oldBaseName, newBaseName);
          return match.replace(importPath, newImportPath);
        }
      );
      
      if (updatedContent !== content) {
        fs.writeFileSync(ref.file, updatedContent, 'utf8');
        updatedFiles.add(ref.file);
        console.log(`✅ 更新导入引用: ${ref.file}`);
      }
    } catch (error) {
      console.error(`❌ 更新引用失败 ${ref.file}: ${error.message}`);
    }
  });
  
  return Array.from(updatedFiles);
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

// 测试编译
function testCompilation() {
  try {
    console.log('🔍 测试TypeScript编译...');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ TypeScript编译通过');
    return true;
  } catch (error) {
    console.error('❌ TypeScript编译失败:');
    console.error(error.stdout?.toString() || error.message);
    return false;
  }
}

// 主执行函数
function executeRename() {
  console.log('🚀 开始批量重命名文件...\n');
  
  const renamedFiles = [];
  const failedRenames = [];
  
  // 按优先级排序：hooks -> components -> utils
  const sortedEntries = Object.entries(RENAME_MAP).sort((a, b) => {
    const getPriority = (path) => {
      if (path.includes('/hooks/')) return 1;
      if (path.includes('/components/')) return 2;
      return 3;
    };
    return getPriority(a[0]) - getPriority(b[0]);
  });
  
  for (const [oldPath, newPath] of sortedEntries) {
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
        const updatedFiles = updateImportReferences(references, oldPath, newPath);
        console.log(`更新了 ${updatedFiles.length} 个文件的导入`);
      }
      
      // 测试编译
      if (!testCompilation()) {
        console.log('⚠️  编译失败，但继续处理下一个文件');
      }
    } else {
      failedRenames.push({ oldPath, newPath });
    }
  }
  
  // 生成报告
  console.log('\n=== 重命名完成报告 ===');
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
  
  // 最终编译测试
  console.log('\n🔍 执行最终编译测试...');
  if (testCompilation()) {
    console.log('🎉 所有重命名完成，编译通过！');
  } else {
    console.log('⚠️  重命名完成，但存在编译错误，请手动检查');
  }
}

// 运行重命名
if (require.main === module) {
  executeRename();
}

module.exports = { executeRename, findImportReferences, updateImportReferences, renameFile };
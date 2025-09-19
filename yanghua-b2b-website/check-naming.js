const fs = require('fs');
const path = require('path');

// 文件命名规范配置
const NAMING_CONVENTIONS = {
  components: {
    pattern: /^[A-Z][a-zA-Z0-9]*\.tsx?$/,
    description: 'PascalCase for React components'
  },
  pages: {
    pattern: /^[a-z][a-z0-9-]*(\.tsx?|\/page\.tsx?|\/layout\.tsx?|\/loading\.tsx?|\/error\.tsx?|\/not-found\.tsx?)$/,
    description: 'kebab-case for pages and Next.js special files'
  },
  api: {
    pattern: /^[a-z][a-z0-9-]*(\/route\.ts|\.ts)$/,
    description: 'kebab-case for API routes'
  },
  utils: {
    pattern: /^[a-z][a-z0-9-]*\.ts$/,
    description: 'kebab-case for utility files'
  },
  hooks: {
    pattern: /^use[A-Z][a-zA-Z0-9]*\.ts$/,
    description: 'camelCase starting with "use" for React hooks'
  },
  types: {
    pattern: /^[a-z][a-z0-9-]*\.types?\.ts$/,
    description: 'kebab-case with .types.ts suffix'
  },
  constants: {
    pattern: /^[a-z][a-z0-9-]*\.constants?\.ts$/,
    description: 'kebab-case with .constants.ts suffix'
  },
  config: {
    pattern: /^[a-z][a-z0-9-]*\.config\.ts$/,
    description: 'kebab-case with .config.ts suffix'
  }
};

// 检测文件类型
function detectFileType(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  if (relativePath.includes('/components/')) return 'components';
  if (relativePath.includes('/pages/') || relativePath.includes('/app/')) return 'pages';
  if (relativePath.includes('/api/')) return 'api';
  if (relativePath.includes('/lib/') || relativePath.includes('/utils/')) return 'utils';
  if (path.basename(filePath).startsWith('use')) return 'hooks';
  if (filePath.includes('.types.') || filePath.includes('.type.')) return 'types';
  if (filePath.includes('.constants.') || filePath.includes('.constant.')) return 'constants';
  if (filePath.includes('.config.')) return 'config';
  
  return 'utils'; // 默认类型
}

// 递归扫描目录
function scanDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function scan(currentPath) {
    try {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // 跳过特定目录
          if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
            scan(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`无法扫描目录 ${currentPath}: ${error.message}`);
    }
  }
  
  scan(dirPath);
  return files;
}

// 检查命名规范
function checkNamingConventions(rootPath = process.cwd()) {
  const files = scanDirectory(rootPath);
  const issues = [];
  const stats = {
    total: files.length,
    compliant: 0,
    nonCompliant: 0,
    byType: {}
  };
  
  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const fileType = detectFileType(filePath);
    const convention = NAMING_CONVENTIONS[fileType];
    
    // 统计
    if (!stats.byType[fileType]) {
      stats.byType[fileType] = { total: 0, compliant: 0, nonCompliant: 0 };
    }
    stats.byType[fileType].total++;
    
    if (convention && !convention.pattern.test(fileName)) {
      issues.push({
        file: path.relative(rootPath, filePath),
        type: fileType,
        issue: `文件名不符合${convention.description}规范`,
        suggestion: generateSuggestion(fileName, fileType)
      });
      stats.nonCompliant++;
      stats.byType[fileType].nonCompliant++;
    } else {
      stats.compliant++;
      stats.byType[fileType].compliant++;
    }
  }
  
  return { issues, stats };
}

// 生成建议
function generateSuggestion(fileName, fileType) {
  const baseName = path.parse(fileName).name;
  const ext = path.parse(fileName).ext;
  
  switch (fileType) {
    case 'components':
      return toPascalCase(baseName) + ext;
    case 'hooks':
      return baseName.startsWith('use') ? 
        'use' + toPascalCase(baseName.slice(3)) + ext :
        'use' + toPascalCase(baseName) + ext;
    default:
      return toKebabCase(baseName) + ext;
  }
}

// 转换为PascalCase
function toPascalCase(str) {
  return str.replace(/(?:^|[_-])([a-z])/g, (_, char) => char.toUpperCase());
}

// 转换为kebab-case
function toKebabCase(str) {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

// 生成报告
function generateNamingReport(rootPath = process.cwd()) {
  const { issues, stats } = checkNamingConventions(rootPath);
  
  let report = '\n=== 文件命名规范检查报告 ===\n\n';
  
  // 统计信息
  report += `总文件数: ${stats.total}\n`;
  report += `符合规范: ${stats.compliant} (${((stats.compliant / stats.total) * 100).toFixed(1)}%)\n`;
  report += `不符合规范: ${stats.nonCompliant} (${((stats.nonCompliant / stats.total) * 100).toFixed(1)}%)\n\n`;
  
  // 按类型统计
  report += '按文件类型统计:\n';
  for (const [type, typeStat] of Object.entries(stats.byType)) {
    const compliance = ((typeStat.compliant / typeStat.total) * 100).toFixed(1);
    report += `  ${type}: ${typeStat.compliant}/${typeStat.total} (${compliance}%)\n`;
  }
  
  // 问题详情
  if (issues.length > 0) {
    report += '\n问题详情:\n';
    issues.forEach((issue, index) => {
      report += `${index + 1}. ${issue.file}\n`;
      report += `   类型: ${issue.type}\n`;
      report += `   问题: ${issue.issue}\n`;
      report += `   建议: ${issue.suggestion}\n\n`;
    });
  } else {
    report += '\n🎉 所有文件都符合命名规范！\n';
  }
  
  return report;
}

// 运行检查
console.log(generateNamingReport());
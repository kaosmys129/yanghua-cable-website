/**
 * 文件命名规范检查和统一工具
 * 确保项目中的文件命名符合最佳实践
 */

import fs from 'fs';
import path from 'path';

// 命名规范配置
const NAMING_CONVENTIONS = {
  // React组件文件
  components: {
    pattern: /^[A-Z][a-zA-Z0-9]*\.(tsx|jsx)$/,
    description: 'React组件应使用PascalCase命名，如 Button.tsx',
    examples: ['Button.tsx', 'UserProfile.jsx', 'ProductCard.tsx']
  },
  
  // 页面文件
  pages: {
    pattern: /^(page|layout|loading|error|not-found|global-error)\.(tsx|jsx|ts|js)$|^[a-z][a-z0-9-]*\.(tsx|jsx)$/,
    description: '页面文件应使用kebab-case或Next.js特殊文件名',
    examples: ['page.tsx', 'layout.tsx', 'about-us.tsx', 'product-detail.tsx']
  },
  
  // 工具函数文件
  utils: {
    pattern: /^[a-z][a-z0-9-]*\.(ts|js)$/,
    description: '工具函数文件应使用kebab-case命名',
    examples: ['string-utils.ts', 'date-formatter.js', 'api-client.ts']
  },
  
  // Hook文件
  hooks: {
    pattern: /^use[A-Z][a-zA-Z0-9]*\.(ts|js)$/,
    description: 'Hook文件应以use开头，使用camelCase',
    examples: ['useAuth.ts', 'useLocalStorage.js', 'useProductData.ts']
  },
  
  // 类型定义文件
  types: {
    pattern: /^[a-z][a-z0-9-]*\.(types|d)\.ts$/,
    description: '类型文件应使用kebab-case，以.types.ts或.d.ts结尾',
    examples: ['user.types.ts', 'api.types.ts', 'global.d.ts']
  },
  
  // 样式文件
  styles: {
    pattern: /^[a-z][a-z0-9-]*\.(css|scss|sass|module\.css|module\.scss)$/,
    description: '样式文件应使用kebab-case命名',
    examples: ['globals.css', 'button.module.css', 'main-layout.scss']
  },
  
  // 配置文件
  config: {
    pattern: /^[a-z][a-z0-9-]*\.(config|conf)\.(ts|js|json)$|^\.[a-z][a-z0-9-]*rc(\.(ts|js|json))?$/,
    description: '配置文件应使用kebab-case，包含config或以点开头',
    examples: ['next.config.js', '.eslintrc.json', 'tailwind.config.ts']
  },
  
  // 测试文件
  tests: {
    pattern: /^[a-z][a-z0-9-]*\.(test|spec)\.(ts|js|tsx|jsx)$/,
    description: '测试文件应使用kebab-case，包含test或spec',
    examples: ['button.test.tsx', 'api-client.spec.ts', 'user-utils.test.js']
  },
  
  // 静态资源
  assets: {
    pattern: /^[a-z0-9][a-z0-9-_]*\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|mp4|mp3|woff|woff2|ttf|eot)$/,
    description: '静态资源应使用kebab-case或snake_case',
    examples: ['logo.png', 'hero-banner.jpg', 'product_image.webp']
  }
};

// 目录命名规范
const DIRECTORY_CONVENTIONS = {
  // 组件目录
  components: {
    pattern: /^[a-z][a-z0-9-]*$/,
    description: '组件目录应使用kebab-case',
    examples: ['button', 'user-profile', 'product-card']
  },
  
  // 页面目录
  pages: {
    pattern: /^[a-z][a-z0-9-]*$|^\([a-z][a-z0-9-]*\)$|^\[[a-z][a-z0-9-]*\]$/,
    description: '页面目录应使用kebab-case，支持Next.js动态路由',
    examples: ['about', 'product-detail', '(auth)', '[slug]']
  },
  
  // 通用目录
  general: {
    pattern: /^[a-z][a-z0-9-]*$/,
    description: '目录应使用kebab-case命名',
    examples: ['utils', 'lib', 'hooks', 'types', 'styles']
  }
};

interface NamingIssue {
  path: string;
  type: 'file' | 'directory';
  category: string;
  issue: string;
  suggestion: string;
}

interface NamingReport {
  totalFiles: number;
  totalDirectories: number;
  issues: NamingIssue[];
  compliantFiles: number;
  compliantDirectories: number;
}

/**
 * 检测文件类型和对应的命名规范
 */
function detectFileCategory(filePath: string): string | null {
  const fileName = path.basename(filePath);
  const dirName = path.dirname(filePath);
  
  // 根据文件扩展名和路径判断类型
  if (fileName.match(/\.(tsx|jsx)$/) && dirName.includes('components')) {
    return 'components';
  }
  
  if (fileName.match(/\.(tsx|jsx)$/) && (dirName.includes('app') || dirName.includes('pages'))) {
    return 'pages';
  }
  
  if (fileName.startsWith('use') && fileName.match(/\.(ts|js)$/)) {
    return 'hooks';
  }
  
  if (fileName.match(/\.(types|d)\.ts$/)) {
    return 'types';
  }
  
  if (fileName.match(/\.(test|spec)\.(ts|js|tsx|jsx)$/)) {
    return 'tests';
  }
  
  if (fileName.match(/\.(css|scss|sass|module\.(css|scss))$/)) {
    return 'styles';
  }
  
  if (fileName.match(/\.(config|conf)\.(ts|js|json)$/) || fileName.match(/^\.[a-z]/)) {
    return 'config';
  }
  
  if (fileName.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|mp4|mp3|woff|woff2|ttf|eot)$/)) {
    return 'assets';
  }
  
  if (fileName.match(/\.(ts|js)$/) && dirName.includes('utils')) {
    return 'utils';
  }
  
  return null;
}

/**
 * 检测目录类型
 */
function detectDirectoryCategory(dirPath: string): string {
  const dirName = path.basename(dirPath);
  
  if (dirName === 'components' || dirPath.includes('/components/')) {
    return 'components';
  }
  
  if (dirName === 'app' || dirName === 'pages' || dirPath.includes('/app/') || dirPath.includes('/pages/')) {
    return 'pages';
  }
  
  return 'general';
}

/**
 * 生成建议的文件名
 */
function suggestFileName(fileName: string, category: string): string {
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext);
  
  switch (category) {
    case 'components':
      // 转换为PascalCase
      return baseName
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('') + ext;
    
    case 'hooks':
      // 确保以use开头，使用camelCase
      const hookName = baseName.startsWith('use') ? baseName : `use${baseName}`;
      return hookName
        .split(/[-_\s]+/)
        .map((word, index) => 
          index === 0 ? word.toLowerCase() : 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('') + ext;
    
    default:
      // 转换为kebab-case
      return baseName
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/[_\s]+/g, '-')
        .replace(/^-+|-+$/g, '') + ext;
  }
}

/**
 * 生成建议的目录名
 */
function suggestDirectoryName(dirName: string): string {
  return dirName
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 递归扫描目录
 */
function scanDirectory(dirPath: string, issues: NamingIssue[] = []): void {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      // 跳过隐藏文件和特殊目录
      if (item.startsWith('.') && !item.match(/^\.[a-z][a-z0-9-]*rc/)) {
        return;
      }
      
      // 跳过node_modules等目录
      if (['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
        return;
      }
      
      if (stat.isDirectory()) {
        // 检查目录命名
        const category = detectDirectoryCategory(itemPath);
        const convention = DIRECTORY_CONVENTIONS[category as keyof typeof DIRECTORY_CONVENTIONS];
        
        if (convention && !convention.pattern.test(item)) {
          issues.push({
            path: itemPath,
            type: 'directory',
            category,
            issue: `目录名不符合${category}命名规范`,
            suggestion: `建议改为: ${suggestDirectoryName(item)}`
          });
        }
        
        // 递归扫描子目录
        scanDirectory(itemPath, issues);
      } else {
        // 检查文件命名
        const category = detectFileCategory(itemPath);
        
        if (category) {
          const convention = NAMING_CONVENTIONS[category as keyof typeof NAMING_CONVENTIONS];
          
          if (!convention.pattern.test(item)) {
            issues.push({
              path: itemPath,
              type: 'file',
              category,
              issue: `文件名不符合${category}命名规范`,
              suggestion: `建议改为: ${suggestFileName(item, category)}`
            });
          }
        }
      }
    });
  } catch (error) {
    console.error(`扫描目录失败: ${dirPath}`, error);
  }
}

/**
 * 统计文件和目录数量
 */
function countItems(dirPath: string): { files: number; directories: number } {
  let files = 0;
  let directories = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      
      // 跳过特殊目录
      if (['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
        return;
      }
      
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        directories++;
        const subCounts = countItems(itemPath);
        files += subCounts.files;
        directories += subCounts.directories;
      } else {
        files++;
      }
    });
  } catch (error) {
    console.error(`统计失败: ${dirPath}`, error);
  }
  
  return { files, directories };
}

/**
 * 执行命名规范检查
 */
export function checkNamingConventions(projectPath: string = process.cwd()): NamingReport {
  const issues: NamingIssue[] = [];
  
  // 扫描项目目录
  scanDirectory(projectPath, issues);
  
  // 统计总数
  const counts = countItems(projectPath);
  
  return {
    totalFiles: counts.files,
    totalDirectories: counts.directories,
    issues,
    compliantFiles: counts.files - issues.filter(i => i.type === 'file').length,
    compliantDirectories: counts.directories - issues.filter(i => i.type === 'directory').length
  };
}

/**
 * 生成命名规范报告
 */
export function generateNamingReport(projectPath: string = process.cwd()): string {
  const report = checkNamingConventions(projectPath);
  
  let output = '\n=== 文件命名规范检查报告 ===\n';
  output += `检查路径: ${projectPath}\n`;
  output += `检查时间: ${new Date().toISOString()}\n\n`;
  
  // 统计信息
  output += '📊 统计信息:\n';
  output += `  总文件数: ${report.totalFiles}\n`;
  output += `  总目录数: ${report.totalDirectories}\n`;
  output += `  符合规范的文件: ${report.compliantFiles} (${((report.compliantFiles / report.totalFiles) * 100).toFixed(1)}%)\n`;
  output += `  符合规范的目录: ${report.compliantDirectories} (${((report.compliantDirectories / report.totalDirectories) * 100).toFixed(1)}%)\n\n`;
  
  if (report.issues.length === 0) {
    output += '✅ 所有文件和目录都符合命名规范！\n';
  } else {
    output += `❌ 发现 ${report.issues.length} 个命名问题:\n\n`;
    
    // 按类型分组显示问题
    const fileIssues = report.issues.filter(i => i.type === 'file');
    const dirIssues = report.issues.filter(i => i.type === 'directory');
    
    if (fileIssues.length > 0) {
      output += '📄 文件命名问题:\n';
      fileIssues.forEach((issue, index) => {
        output += `  ${index + 1}. ${issue.path}\n`;
        output += `     问题: ${issue.issue}\n`;
        output += `     建议: ${issue.suggestion}\n\n`;
      });
    }
    
    if (dirIssues.length > 0) {
      output += '📁 目录命名问题:\n';
      dirIssues.forEach((issue, index) => {
        output += `  ${index + 1}. ${issue.path}\n`;
        output += `     问题: ${issue.issue}\n`;
        output += `     建议: ${issue.suggestion}\n\n`;
      });
    }
  }
  
  // 命名规范说明
  output += '\n📋 命名规范说明:\n';
  Object.entries(NAMING_CONVENTIONS).forEach(([category, convention]) => {
    output += `\n${category}:\n`;
    output += `  规则: ${convention.description}\n`;
    output += `  示例: ${convention.examples.join(', ')}\n`;
  });
  
  return output;
}

/**
 * 获取命名规范配置
 */
export function getNamingConventions() {
  return {
    files: NAMING_CONVENTIONS,
    directories: DIRECTORY_CONVENTIONS
  };
}

/**
 * 验证单个文件名
 */
export function validateFileName(fileName: string, category?: string): {
  isValid: boolean;
  suggestion?: string;
  rule?: string;
} {
  const detectedCategory = category || detectFileCategory(fileName);
  
  if (!detectedCategory) {
    return { isValid: true };
  }
  
  const convention = NAMING_CONVENTIONS[detectedCategory as keyof typeof NAMING_CONVENTIONS];
  const isValid = convention.pattern.test(fileName);
  
  return {
    isValid,
    suggestion: isValid ? undefined : suggestFileName(fileName, detectedCategory),
    rule: convention.description
  };
}

/**
 * 验证单个目录名
 */
export function validateDirectoryName(dirName: string, category: string = 'general'): {
  isValid: boolean;
  suggestion?: string;
  rule?: string;
} {
  const convention = DIRECTORY_CONVENTIONS[category as keyof typeof DIRECTORY_CONVENTIONS];
  const isValid = convention.pattern.test(dirName);
  
  return {
    isValid,
    suggestion: isValid ? undefined : suggestDirectoryName(dirName),
    rule: convention.description
  };
}
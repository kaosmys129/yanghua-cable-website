/**
 * 路径配置和别名管理工具
 * 统一管理项目中的路径映射和资源路径
 */

import path from 'path';

// 路径别名配置
export const PATH_ALIASES = {
  '@': './src',
  '@/components': './src/components',
  '@/lib': './src/lib',
  '@/utils': './src/utils',
  '@/hooks': './src/hooks',
  '@/types': './src/types',
  '@/styles': './src/styles',
  '@/public': './public',
  '@/assets': './src/assets',
  '@/data': './src/data',
  '@/config': './src/config'
} as const;

// 静态资源路径配置
export const ASSET_PATHS = {
  images: '/images',
  icons: '/icons',
  documents: '/documents',
  videos: '/videos',
  fonts: '/fonts',
  logos: '/images/logos',
  products: '/images/products',
  news: '/images/news',
  banners: '/images/banners'
} as const;

// API路径配置
export const API_PATHS = {
  base: '/api',
  auth: '/api/auth',
  users: '/api/users',
  products: '/api/products',
  categories: '/api/categories',
  news: '/api/news',
  contact: '/api/contact',
  health: '/api/health',
  upload: '/api/upload',
  search: '/api/search'
} as const;

// 页面路径配置
export const PAGE_PATHS = {
  home: '/',
  about: '/about',
  products: '/products',
  news: '/news',
  contact: '/contact',
  login: '/login',
  register: '/register',
  profile: '/profile',
  admin: '/admin',
  search: '/search'
} as const;

// 多语言路径前缀
export const LOCALE_PREFIXES = {
  en: '/en',
  es: '/es'
} as const;

/**
 * 构建资源URL
 */
export function buildAssetUrl(category: keyof typeof ASSET_PATHS, filename: string): string {
  const basePath = ASSET_PATHS[category];
  return `${basePath}/${filename}`;
}

/**
 * 构建API URL
 */
export function buildApiUrl(endpoint: keyof typeof API_PATHS, path?: string): string {
  const basePath = API_PATHS[endpoint];
  return path ? `${basePath}/${path}` : basePath;
}

/**
 * 构建页面URL
 */
export function buildPageUrl(page: keyof typeof PAGE_PATHS, locale?: string): string {
  const basePath = PAGE_PATHS[page];
  if (locale && locale !== 'en') {
    const localePrefix = LOCALE_PREFIXES[locale as keyof typeof LOCALE_PREFIXES];
    return localePrefix ? `${localePrefix}${basePath}` : basePath;
  }
  return basePath;
}

/**
 * 验证路径是否存在
 */
export function validatePath(filePath: string): boolean {
  try {
    const fs = require('fs');
    return fs.existsSync(filePath);
  } catch (error) {
    console.error('路径验证失败:', error);
    return false;
  }
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * 检查文件类型
 */
export function getFileType(filename: string): 'image' | 'video' | 'document' | 'audio' | 'unknown' {
  const ext = getFileExtension(filename);
  
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
  const documentExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf'];
  const audioExts = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.wma'];
  
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (documentExts.includes(ext)) return 'document';
  if (audioExts.includes(ext)) return 'audio';
  
  return 'unknown';
}

/**
 * 生成安全的文件名
 */
export function sanitizeFilename(filename: string): string {
  // 移除或替换不安全的字符
  return filename
    .replace(/[^a-zA-Z0-9.-_]/g, '_') // 替换特殊字符为下划线
    .replace(/_{2,}/g, '_') // 合并多个下划线
    .replace(/^_+|_+$/g, '') // 移除开头和结尾的下划线
    .toLowerCase();
}

/**
 * 构建缩略图路径
 */
export function buildThumbnailUrl(originalUrl: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const sizeMap = {
    small: '150x150',
    medium: '300x300',
    large: '600x600'
  };
  
  const ext = getFileExtension(originalUrl);
  const baseName = originalUrl.replace(ext, '');
  
  return `${baseName}_${sizeMap[size]}${ext}`;
}

/**
 * 检查URL是否为外部链接
 */
export function isExternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return urlObj.hostname !== currentDomain;
  } catch {
    // 如果不是有效的URL，假设是内部路径
    return false;
  }
}

/**
 * 构建面包屑导航路径
 */
export function buildBreadcrumbs(pathname: string, locale?: string): Array<{ name: string; url: string }> {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: Array<{ name: string; url: string }> = [];
  
  // 添加首页
  breadcrumbs.push({
    name: 'Home',
    url: buildPageUrl('home', locale)
  });
  
  // 构建路径段
  let currentPath = '';
  segments.forEach((segment, index) => {
    // 跳过语言前缀
    if (index === 0 && Object.values(LOCALE_PREFIXES).some(prefix => prefix === `/${segment}`)) {
      return;
    }
    
    currentPath += `/${segment}`;
    
    // 格式化段名称
    const name = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      name,
      url: locale && locale !== 'en' ? `/${locale}${currentPath}` : currentPath
    });
  });
  
  return breadcrumbs;
}

/**
 * 路径规范化工具
 */
export class PathNormalizer {
  private static instance: PathNormalizer;
  
  static getInstance(): PathNormalizer {
    if (!PathNormalizer.instance) {
      PathNormalizer.instance = new PathNormalizer();
    }
    return PathNormalizer.instance;
  }
  
  /**
   * 规范化路径分隔符
   */
  normalizeSeparators(path: string): string {
    return path.replace(/\\/g, '/');
  }
  
  /**
   * 移除重复的斜杠
   */
  removeDuplicateSlashes(path: string): string {
    return path.replace(/\/+/g, '/');
  }
  
  /**
   * 确保路径以斜杠开头
   */
  ensureLeadingSlash(path: string): string {
    return path.startsWith('/') ? path : `/${path}`;
  }
  
  /**
   * 移除尾部斜杠
   */
  removeTrailingSlash(path: string): string {
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  }
  
  /**
   * 完整的路径规范化
   */
  normalize(path: string): string {
    let normalized = this.normalizeSeparators(path);
    normalized = this.removeDuplicateSlashes(normalized);
    normalized = this.ensureLeadingSlash(normalized);
    normalized = this.removeTrailingSlash(normalized);
    return normalized;
  }
}

/**
 * 获取路径规范化器实例
 */
export const pathNormalizer = PathNormalizer.getInstance();

/**
 * 验证静态资源路径
 */
export function validateAssetPaths(): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  
  // 检查关键静态资源目录
  const criticalPaths = [
    'public/images',
    'public/icons',
    'public/fonts',
    'src/components',
    'src/lib',
    'src/utils'
  ];
  
  criticalPaths.forEach(pathToCheck => {
    if (validatePath(pathToCheck)) {
      valid.push(pathToCheck);
    } else {
      invalid.push(pathToCheck);
    }
  });
  
  return { valid, invalid };
}

/**
 * 生成路径配置报告
 */
export function generatePathReport(): string {
  const { valid, invalid } = validateAssetPaths();
  
  let report = '\n=== 路径配置检查报告 ===\n';
  report += `检查时间: ${new Date().toISOString()}\n\n`;
  
  if (valid.length > 0) {
    report += '✅ 有效路径:\n';
    valid.forEach(path => {
      report += `  - ${path}\n`;
    });
    report += '\n';
  }
  
  if (invalid.length > 0) {
    report += '❌ 无效路径:\n';
    invalid.forEach(path => {
      report += `  - ${path}\n`;
    });
    report += '\n';
  }
  
  report += `总计: ${valid.length + invalid.length} 个路径检查完成\n`;
  report += `有效: ${valid.length}, 无效: ${invalid.length}\n`;
  
  return report;
}
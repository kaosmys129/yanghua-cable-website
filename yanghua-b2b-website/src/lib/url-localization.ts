/**
 * 多语言URL本地化配置
 * 定义不同语言版本的URL路径映射关系
 */

import { Locale } from './i18n';

// 页面路径的多语言映射
export const LOCALIZED_PATHS: Record<string, Record<Locale, string>> = {
  // 主要页面
  home: {
    en: '/',
    es: '/'
  },
  about: {
    en: '/about',
    es: '/acerca-de'
  },
  products: {
    en: '/products',
    es: '/productos'
  },
  solutions: {
    en: '/solutions',
    es: '/soluciones'
  },
  services: {
    en: '/services',
    es: '/servicios'
  },
  projects: {
    en: '/projects',
    es: '/proyectos'
  },
  contact: {
    en: '/contact',
    es: '/contacto'
  },
  articles: {
    en: '/articles',
    es: '/articulos'
  },
  partners: {
    en: '/partners',
    es: '/socios'
  },
  
  // 产品相关页面
  'products-category': {
    en: '/products/category',
    es: '/productos/categoria'
  },
  
  // 解决方案相关页面
  'solutions-detail': {
    en: '/solutions',
    es: '/soluciones'
  },
  
  // 项目相关页面
  'projects-detail': {
    en: '/projects',
    es: '/proyectos'
  },
  
  // 文章相关页面
  'articles-detail': {
    en: '/articles',
    es: '/articulos'
  }
};

// 反向映射：从本地化路径到页面键
export const PATH_TO_KEY: Record<Locale, Record<string, string>> = {
  en: {},
  es: {}
};

// 初始化反向映射
Object.entries(LOCALIZED_PATHS).forEach(([key, paths]) => {
  Object.entries(paths).forEach(([locale, path]) => {
    PATH_TO_KEY[locale as Locale][path] = key;
  });
});

/**
 * 获取本地化路径
 * @param pageKey 页面键名
 * @param locale 语言代码
 * @param params 动态参数（如ID、slug等）
 * @returns 本地化的路径
 */
export function getLocalizedPath(
  pageKey: string, 
  locale: Locale, 
  params?: Record<string, string>
): string {
  const basePath = LOCALIZED_PATHS[pageKey]?.[locale] || LOCALIZED_PATHS[pageKey]?.en || `/${pageKey}`;
  
  if (!params) {
    return basePath;
  }
  
  // 处理动态参数
  let path = basePath;
  Object.entries(params).forEach(([key, value]) => {
    path += `/${value}`;
  });
  
  return path;
}

/**
 * 获取页面键名从路径
 * @param path 路径
 * @param locale 语言代码
 * @returns 页面键名
 */
export function getPageKeyFromPath(path: string, locale: Locale): string | null {
  // 移除语言前缀
  const cleanPath = path.replace(`/${locale}`, '') || '/';
  
  // 查找精确匹配
  const exactMatch = PATH_TO_KEY[locale][cleanPath];
  if (exactMatch) {
    return exactMatch;
  }
  
  // 查找部分匹配（用于动态路由）
  for (const [localizedPath, key] of Object.entries(PATH_TO_KEY[locale])) {
    if (cleanPath.startsWith(localizedPath) && localizedPath !== '/') {
      return key;
    }
  }
  
  return null;
}

/**
 * 构建完整的本地化URL
 * @param pageKey 页面键名
 * @param locale 语言代码
 * @param params 动态参数
 * @param baseUrl 基础URL（可选）
 * @returns 完整的本地化URL
 */
export function buildLocalizedUrl(
  pageKey: string,
  locale: Locale,
  params?: Record<string, string>,
  baseUrl?: string
): string {
  const localizedPath = getLocalizedPath(pageKey, locale, params);
  const fullPath = `/${locale}${localizedPath === '/' ? '' : localizedPath}`;
  
  return baseUrl ? `${baseUrl}${fullPath}` : fullPath;
}

/**
 * 转换URL到不同语言版本
 * @param currentUrl 当前URL
 * @param currentLocale 当前语言
 * @param targetLocale 目标语言
 * @returns 目标语言的URL
 */
export function translateUrl(
  currentUrl: string,
  currentLocale: Locale,
  targetLocale: Locale
): string {
  // 移除基础URL和语言前缀
  const path = currentUrl.replace(/^https?:\/\/[^\/]+/, '').replace(`/${currentLocale}`, '') || '/';
  
  // 获取页面键名
  const pageKey = getPageKeyFromPath(`/${currentLocale}${path}`, currentLocale);
  
  if (!pageKey) {
    // 如果找不到映射，使用简单的语言代码替换
    return currentUrl.replace(`/${currentLocale}`, `/${targetLocale}`);
  }
  
  // 提取动态参数
  const basePath = LOCALIZED_PATHS[pageKey][currentLocale];
  const params: Record<string, string> = {};
  
  if (basePath && path !== basePath) {
    const pathParts = path.replace(basePath, '').split('/').filter(Boolean);
    pathParts.forEach((part, index) => {
      params[`param${index}`] = part;
    });
  }
  
  // 构建目标语言URL
  const baseUrl = currentUrl.match(/^https?:\/\/[^\/]+/)?.[0] || '';
  return buildLocalizedUrl(pageKey, targetLocale, params, baseUrl);
}

/**
 * 验证本地化路径配置
 * @returns 验证结果
 */
export function validateLocalizedPaths(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 检查每个页面是否都有所有语言的映射
  Object.entries(LOCALIZED_PATHS).forEach(([key, paths]) => {
    const locales = Object.keys(paths) as Locale[];
    const supportedLocales: Locale[] = ['en', 'es'];
    
    supportedLocales.forEach(locale => {
      if (!paths[locale]) {
        errors.push(`Missing ${locale} path for page: ${key}`);
      }
    });
    
    // 检查路径冲突
    const pathValues = Object.values(paths);
    const duplicates = pathValues.filter((path, index) => pathValues.indexOf(path) !== index);
    if (duplicates.length > 0) {
      warnings.push(`Duplicate paths found for page ${key}: ${duplicates.join(', ')}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 生成本地化路径报告
 * @returns 路径配置报告
 */
export function generatePathReport(): string {
  const validation = validateLocalizedPaths();
  const totalPages = Object.keys(LOCALIZED_PATHS).length;
  const totalPaths = Object.values(LOCALIZED_PATHS).reduce(
    (sum, paths) => sum + Object.keys(paths).length, 
    0
  );
  
  return `
# 多语言URL本地化配置报告

## 配置概览
- 总页面数: ${totalPages}
- 总路径数: ${totalPaths}
- 支持语言: en, es

## 验证结果
- 配置有效性: ${validation.valid ? '✅ 有效' : '❌ 无效'}
- 错误数量: ${validation.errors.length}
- 警告数量: ${validation.warnings.length}

${validation.errors.length > 0 ? `
## 错误列表
${validation.errors.map(error => `- ${error}`).join('\n')}
` : ''}

${validation.warnings.length > 0 ? `
## 警告列表
${validation.warnings.map(warning => `- ${warning}`).join('\n')}
` : ''}

## 路径映射详情
${Object.entries(LOCALIZED_PATHS).map(([key, paths]) => `
### ${key}
${Object.entries(paths).map(([locale, path]) => `- ${locale}: ${path}`).join('\n')}
`).join('')}
`;
}

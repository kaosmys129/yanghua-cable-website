/**
 * CMS 配置管理
 * 支持 Strapi 和 WordPress 之间的无缝切换
 */

export type CMSType = 'strapi' | 'wordpress';

export interface CMSConfig {
  type: CMSType;
  enabled: boolean;
  fallback?: CMSType;
  debug?: boolean;
}

// CMS 配置
const getCMSConfig = (): CMSConfig => {
  // 从环境变量读取配置
  const cmsType = (process.env.CMS_TYPE || process.env.NEXT_PUBLIC_CMS_TYPE || 'strapi') as CMSType;
  const cmsEnabled = process.env.CMS_ENABLED !== 'false';
  const cmsFallback = process.env.CMS_FALLBACK as CMSType;
  const cmsDebug = process.env.CMS_DEBUG === 'true' || process.env.NODE_ENV === 'development';

  return {
    type: cmsType,
    enabled: cmsEnabled,
    fallback: cmsFallback,
    debug: cmsDebug
  };
};

// 导出配置实例
export const cmsConfig = getCMSConfig();

// 配置验证
export const validateCMSConfig = (): boolean => {
  const config = getCMSConfig();
  
  if (!['strapi', 'wordpress'].includes(config.type)) {
    console.error(`[CMSConfig] Invalid CMS type: ${config.type}. Must be 'strapi' or 'wordpress'.`);
    return false;
  }

  if (config.fallback && !['strapi', 'wordpress'].includes(config.fallback)) {
    console.error(`[CMSConfig] Invalid fallback CMS type: ${config.fallback}. Must be 'strapi' or 'wordpress'.`);
    return false;
  }

  // 检查必要的环境变量
  if (config.type === 'strapi') {
    const strapiUrl = process.env.STRAPI_BASE_URL || process.env.NEXT_PUBLIC_STRAPI_BASE_URL;
    if (!strapiUrl) {
      console.error('[CMSConfig] Strapi base URL is not configured.');
      return false;
    }
  }

  if (config.type === 'wordpress') {
    const wpUrl = process.env.WORDPRESS_BASE_URL || process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
    if (!wpUrl) {
      console.error('[CMSConfig] WordPress base URL is not configured.');
      return false;
    }
  }

  return true;
};

// 获取当前CMS类型
export const getCurrentCMSType = (): CMSType => {
  return cmsConfig.type;
};

// 检查是否使用Strapi
export const isUsingStrapi = (): boolean => {
  return cmsConfig.type === 'strapi';
};

// 检查是否使用WordPress
export const isUsingWordPress = (): boolean => {
  return cmsConfig.type === 'wordpress';
};

// 获取CMS显示名称
export const getCMSDisplayName = (type?: CMSType): string => {
  const cmsType = type || cmsConfig.type;
  switch (cmsType) {
    case 'strapi':
      return 'Strapi CMS';
    case 'wordpress':
      return 'WordPress CMS';
    default:
      return 'Unknown CMS';
  }
};

// CMS功能特性检查
export const getCMSFeatures = (type?: CMSType) => {
  const cmsType = type || cmsConfig.type;
  
  const features = {
    strapi: {
      multiLanguage: true,
      drafts: true,
      preview: true,
      customFields: true,
      contentBlocks: true,
      mediaLibrary: true,
      userRoles: true,
      webhooks: true,
      graphql: true,
      restApi: true
    },
    wordpress: {
      multiLanguage: true, // 通过插件支持
      drafts: true,
      preview: true,
      customFields: true, // 通过ACF支持
      contentBlocks: true, // 通过Gutenberg/ACF支持
      mediaLibrary: true,
      userRoles: true,
      webhooks: true,
      graphql: false, // 需要插件
      restApi: true
    }
  };

  return features[cmsType] || features.strapi;
};

// 日志记录
export const logCMSInfo = () => {
  if (cmsConfig.debug) {
    console.log('[CMSConfig] Current configuration:', {
      type: cmsConfig.type,
      enabled: cmsConfig.enabled,
      fallback: cmsConfig.fallback,
      displayName: getCMSDisplayName(),
      features: getCMSFeatures(),
      isValid: validateCMSConfig()
    });
  }
};

// 初始化时验证配置
if (typeof window === 'undefined') {
  // 仅在服务器端验证
  const isValid = validateCMSConfig();
  if (!isValid) {
    console.warn('[CMSConfig] CMS configuration validation failed. Please check your environment variables.');
  }
  logCMSInfo();
}
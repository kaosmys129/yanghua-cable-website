/**
 * CMS 客户端工厂
 * 提供统一的接口来访问不同的CMS系统（Strapi/WordPress）
 */

import { Article } from './types';
import { cmsConfig, getCurrentCMSType, isUsingStrapi, isUsingWordPress } from './cms-config';

// 统一的CMS客户端接口
export interface CMSClient {
  // 文章相关方法
  getAllArticles(locale?: string): Promise<{ data: Article[] }>;
  getArticleBySlug(slug: string, locale?: string): Promise<Article | null>;
  getArticleBySlugWithMetrics(slug: string, locale?: string): Promise<{ article: Article | null; metrics: { bytes: number } }>;
  getAllArticlesWithDrafts(locale?: string): Promise<{ data: Article[] }>;
  getArticleBySlugWithDrafts(slug: string, locale?: string): Promise<Article | null>;
  getArticlesWithCache(): Promise<{ data: Article[]; timestamp: number }>;
  
  // 健康检查
  checkHealth(): Promise<boolean>;
  getHealthStatus?(): Promise<any>;
}

// Strapi 客户端适配器
class StrapiClientAdapter implements CMSClient {
  private strapiClient: any;

  constructor() {
    // 动态导入 Strapi 客户端
    this.initStrapiClient();
  }

  private async initStrapiClient() {
    try {
      const strapiModule = await import('./strapi-client');
      this.strapiClient = strapiModule;
    } catch (error) {
      console.error('[CMSClientFactory] Failed to load Strapi client:', error);
      throw new Error('Strapi client initialization failed');
    }
  }

  async getAllArticles(locale = 'en'): Promise<{ data: Article[] }> {
    await this.initStrapiClient();
    return this.strapiClient.getAllArticles(locale);
  }

  async getArticleBySlug(slug: string, locale = 'en'): Promise<Article | null> {
    await this.initStrapiClient();
    return this.strapiClient.getArticleBySlug(slug, locale);
  }

  async getArticleBySlugWithMetrics(slug: string, locale = 'en'): Promise<{ article: Article | null; metrics: { bytes: number } }> {
    await this.initStrapiClient();
    return this.strapiClient.getArticleBySlugWithMetrics(slug, locale);
  }

  async getAllArticlesWithDrafts(locale = 'en'): Promise<{ data: Article[] }> {
    await this.initStrapiClient();
    return this.strapiClient.getAllArticlesWithDrafts(locale);
  }

  async getArticleBySlugWithDrafts(slug: string, locale = 'en'): Promise<Article | null> {
    await this.initStrapiClient();
    return this.strapiClient.getArticleBySlugWithDrafts(slug, locale);
  }

  async getArticlesWithCache(): Promise<{ data: Article[]; timestamp: number }> {
    await this.initStrapiClient();
    return this.strapiClient.getArticlesWithCache();
  }

  async checkHealth(): Promise<boolean> {
    await this.initStrapiClient();
    return this.strapiClient.checkStrapiHealth();
  }

  async getHealthStatus(): Promise<any> {
    await this.initStrapiClient();
    // Strapi 没有详细的健康状态接口，返回基本信息
    const isHealthy = await this.checkHealth();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      type: 'strapi'
    };
  }
}

// WordPress 客户端适配器
class WordPressClientAdapter implements CMSClient {
  private wordpressClient: any;

  constructor() {
    // 动态导入 WordPress 客户端
    this.initWordPressClient();
  }

  private async initWordPressClient() {
    try {
      const wordpressModule = await import('./wordpress-client');
      this.wordpressClient = wordpressModule;
    } catch (error) {
      console.error('[CMSClientFactory] Failed to load WordPress client:', error);
      throw new Error('WordPress client initialization failed');
    }
  }

  async getAllArticles(locale = 'en'): Promise<{ data: Article[] }> {
    await this.initWordPressClient();
    return this.wordpressClient.getAllArticles(locale);
  }

  async getArticleBySlug(slug: string, locale = 'en'): Promise<Article | null> {
    await this.initWordPressClient();
    return this.wordpressClient.getArticleBySlug(slug, locale);
  }

  async getArticleBySlugWithMetrics(slug: string, locale = 'en'): Promise<{ article: Article | null; metrics: { bytes: number } }> {
    await this.initWordPressClient();
    return this.wordpressClient.getArticleBySlugWithMetrics(slug, locale);
  }

  async getAllArticlesWithDrafts(locale = 'en'): Promise<{ data: Article[] }> {
    await this.initWordPressClient();
    return this.wordpressClient.getAllArticlesWithDrafts(locale);
  }

  async getArticleBySlugWithDrafts(slug: string, locale = 'en'): Promise<Article | null> {
    await this.initWordPressClient();
    return this.wordpressClient.getArticleBySlugWithDrafts(slug, locale);
  }

  async getArticlesWithCache(): Promise<{ data: Article[]; timestamp: number }> {
    await this.initWordPressClient();
    return this.wordpressClient.getArticlesWithCache();
  }

  async checkHealth(): Promise<boolean> {
    await this.initWordPressClient();
    return this.wordpressClient.checkWordPressHealth();
  }

  async getHealthStatus(): Promise<any> {
    await this.initWordPressClient();
    return this.wordpressClient.getWordPressHealthStatus();
  }
}

// CMS 客户端工厂
class CMSClientFactory {
  private static instance: CMSClientFactory;
  private clientCache: Map<string, CMSClient> = new Map();

  private constructor() {}

  static getInstance(): CMSClientFactory {
    if (!CMSClientFactory.instance) {
      CMSClientFactory.instance = new CMSClientFactory();
    }
    return CMSClientFactory.instance;
  }

  // 获取当前配置的CMS客户端
  async getClient(): Promise<CMSClient> {
    const cmsType = getCurrentCMSType();
    return this.getClientByType(cmsType);
  }

  // 根据类型获取特定的CMS客户端
  async getClientByType(type: 'strapi' | 'wordpress'): Promise<CMSClient> {
    // 检查缓存
    if (this.clientCache.has(type)) {
      return this.clientCache.get(type)!;
    }

    let client: CMSClient;

    try {
      switch (type) {
        case 'strapi':
          client = new StrapiClientAdapter();
          break;
        case 'wordpress':
          client = new WordPressClientAdapter();
          break;
        default:
          throw new Error(`Unsupported CMS type: ${type}`);
      }

      // 缓存客户端实例
      this.clientCache.set(type, client);
      
      if (cmsConfig.debug) {
        console.log(`[CMSClientFactory] Created ${type} client`);
      }

      return client;
    } catch (error) {
      console.error(`[CMSClientFactory] Failed to create ${type} client:`, error);
      
      // 尝试使用fallback
      if (cmsConfig.fallback && cmsConfig.fallback !== type) {
        console.log(`[CMSClientFactory] Attempting fallback to ${cmsConfig.fallback}`);
        return this.getClientByType(cmsConfig.fallback);
      }
      
      throw error;
    }
  }

  // 清除客户端缓存
  clearCache(): void {
    this.clientCache.clear();
    if (cmsConfig.debug) {
      console.log('[CMSClientFactory] Client cache cleared');
    }
  }

  // 预热客户端（可选）
  async warmupClients(): Promise<void> {
    try {
      const currentClient = await this.getClient();
      await currentClient.checkHealth();
      
      if (cmsConfig.debug) {
        console.log('[CMSClientFactory] Client warmup completed');
      }
    } catch (error) {
      console.warn('[CMSClientFactory] Client warmup failed:', error);
    }
  }
}

// 导出工厂实例和便利方法
export const cmsClientFactory = CMSClientFactory.getInstance();

// 便利方法 - 获取当前CMS客户端
export const getCMSClient = async (): Promise<CMSClient> => {
  return cmsClientFactory.getClient();
};

// 便利方法 - 获取特定类型的CMS客户端
export const getCMSClientByType = async (type: 'strapi' | 'wordpress'): Promise<CMSClient> => {
  return cmsClientFactory.getClientByType(type);
};

// 便利方法 - 检查CMS健康状态
export const checkCMSHealth = async (): Promise<boolean> => {
  try {
    const client = await getCMSClient();
    return await client.checkHealth();
  } catch (error) {
    console.error('[CMSClientFactory] Health check failed:', error);
    return false;
  }
};

// 便利方法 - 获取CMS详细健康状态
export const getCMSHealthStatus = async (): Promise<any> => {
  try {
    const client = await getCMSClient();
    if (client.getHealthStatus) {
      return await client.getHealthStatus();
    }
    
    // 如果没有详细状态方法，返回基本状态
    const isHealthy = await client.checkHealth();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      type: getCurrentCMSType()
    };
  } catch (error: any) {
    console.error('[CMSClientFactory] Failed to get health status:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      type: getCurrentCMSType(),
      error: error?.message || 'Unknown error'
    };
  }
};
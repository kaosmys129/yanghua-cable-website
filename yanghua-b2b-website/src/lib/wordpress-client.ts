/**
 * WordPress REST API 客户端
 * 提供与 Strapi 客户端相同的接口，实现无缝切换
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  WordPressArticle, 
  WordPressConfig, 
  WordPressQueryParams,
  WordPressHealthResponse,
  WordPressError,
  WordPressLocale
} from './wordpress-types';
import { Article } from './types';
import { 
  transformWordPressArticle, 
  transformWordPressArticles,
  normalizeWordPressResponse,
  computeWordPressPayloadSize
} from './wordpress-data-transformer';
import { logError } from './error-logger';

// WordPress 客户端配置
const getWordPressConfig = (): WordPressConfig => {
  const baseUrl = process.env.WORDPRESS_BASE_URL || process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
  
  if (!baseUrl) {
    throw new Error('WordPress base URL is not configured. Please set WORDPRESS_BASE_URL environment variable.');
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''), // 移除末尾斜杠
    username: process.env.WORDPRESS_USERNAME,
    password: process.env.WORDPRESS_PASSWORD,
    applicationPassword: process.env.WORDPRESS_APPLICATION_PASSWORD,
    timeout: 25000, // 25秒超时，与Strapi保持一致
    retries: 6,
    locale: 'en'
  };
};

// 创建 axios 实例
const createWordPressClient = (): AxiosInstance => {
  const config = getWordPressConfig();
  
  const client = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  });

  // 配置认证
  if (config.applicationPassword) {
    // 使用应用程序密码（推荐）
    client.defaults.headers.common['Authorization'] = `Bearer ${config.applicationPassword}`;
  } else if (config.username && config.password) {
    // 使用基本认证
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    client.defaults.headers.common['Authorization'] = `Basic ${credentials}`;
  }

  return client;
};

const wordpressClient = createWordPressClient();

// 请求拦截器 - 添加详细日志
wordpressClient.interceptors.request.use(
  (config) => {
    const requestId = `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    (config as any).metadata = { requestId, startTime: Date.now() };
    
    console.log(`[${requestId}] WordPress API Request:`, {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      params: config.params,
      headers: config.headers,
      timeout: config.timeout,
      environment: typeof window === 'undefined' ? 'server' : 'client'
    });
    
    return config;
  },
  (error) => {
    console.error('[WordPressClient] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 添加详细日志
wordpressClient.interceptors.response.use(
  (response) => {
    const requestId = (response.config as any).metadata?.requestId;
    const startTime = (response.config as any).metadata?.startTime;
    const duration = startTime ? Date.now() - startTime : undefined;
    
    console.log(`[${requestId}] WordPress API Response:`, {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      duration: duration ? `${duration}ms` : 'unknown',
      dataLength: response.data ? JSON.stringify(response.data).length : 0,
      headers: response.headers
    });
    
    return response;
  },
  (error) => {
    const requestId = error.config?.metadata?.requestId;
    const startTime = error.config?.metadata?.startTime;
    const duration = startTime ? Date.now() - startTime : undefined;
    
    console.error(`[${requestId}] WordPress API Error:`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      duration: duration ? `${duration}ms` : 'unknown',
      error: error.message,
      responseData: error.response?.data
    });
    
    return Promise.reject(error);
  }
);

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 6,
  retryDelay: 1500,
  backoffMultiplier: 1.8,
  timeoutRetries: 4,
  maxDelay: 15000,
};

// 重试机制
const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = RETRY_CONFIG.maxRetries
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (retries <= 0) {
      throw error;
    }

    const isRetryableError = 
      error.code === 'ECONNABORTED' || // 超时
      error.code === 'ENOTFOUND' ||   // DNS错误
      error.code === 'ECONNRESET' ||  // 连接重置
      (error.response?.status >= 500) || // 服务器错误
      (error.response?.status === 429);   // 限流

    if (!isRetryableError) {
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxRetries - retries),
      RETRY_CONFIG.maxDelay
    );

    console.log(`[WordPressClient] Retrying in ${delay}ms... (${retries} retries left)`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(operation, retries - 1);
  }
};

// 错误处理
const handleWordPressError = (error: any, operation: string) => {
  const errorInfo = {
    operation,
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    code: error.code,
    config: {
      url: error.config?.url,
      method: error.config?.method,
      timeout: error.config?.timeout
    }
  };

  console.error(`[WordPressClient] ${operation} failed:`, errorInfo);
  logError('WordPress API error', error instanceof Error ? error : new Error(String(error)), { operation });

  // 返回用户友好的错误信息
  if (error.response?.status === 404) {
    throw new Error(`Content not found`);
  } else if (error.response?.status === 401) {
    throw new Error(`Authentication failed. Please check WordPress credentials.`);
  } else if (error.response?.status === 403) {
    throw new Error(`Access forbidden. Please check WordPress permissions.`);
  } else if (error.code === 'ECONNABORTED') {
    throw new Error(`Request timeout. WordPress server may be slow or unavailable.`);
  } else if (error.code === 'ENOTFOUND') {
    throw new Error(`WordPress server not found. Please check the URL configuration.`);
  } else {
    throw new Error(`WordPress API error: ${error.message}`);
  }
};

/**
 * 获取所有文章
 */
export async function getAllArticles(locale: WordPressLocale = 'en'): Promise<{ data: Article[] }> {
  return withRetry(async () => {
    try {
      console.log(`[WordPressClient] Fetching all articles for locale: ${locale}`);
      
      const params: WordPressQueryParams = {
        per_page: 100, // WordPress 默认限制
        status: ['publish'],
        _embed: true, // 包含嵌入数据
        orderby: 'date',
        order: 'desc'
      };

      // 添加语言参数（如果使用多语言插件）
      if (locale !== 'en') {
        (params as any).lang = locale;
      }

      const response = await wordpressClient.get('/wp-json/wp/v2/yanghua_article', { params });
      
      const articles = response.data as WordPressArticle[];
      console.log(`[WordPressClient] Retrieved ${articles.length} articles`);
      
      const transformedArticles = transformWordPressArticles(articles);
      const payloadSize = computeWordPressPayloadSize(response.data);
      
      console.log(`[WordPressClient] Payload size: ${payloadSize} bytes`);
      
      return normalizeWordPressResponse(transformedArticles);
    } catch (error: any) {
      handleWordPressError(error, 'getAllArticles');
      throw error;
    }
  });
}

/**
 * 根据 slug 获取单篇文章
 */
export async function getArticleBySlug(slug: string, locale: WordPressLocale = 'en'): Promise<Article | null> {
  return withRetry(async () => {
    try {
      console.log(`[WordPressClient] Fetching article by slug: ${slug}, locale: ${locale}`);
      
      const params: WordPressQueryParams = {
        slug,
        _embed: true,
        status: ['publish']
      };

      // 添加语言参数
      if (locale !== 'en') {
        (params as any).lang = locale;
      }

      const response = await wordpressClient.get('/wp-json/wp/v2/yanghua_article', { params });
      
      const articles = response.data as WordPressArticle[];
      
      if (!articles || articles.length === 0) {
        console.log(`[WordPressClient] No article found with slug: ${slug}`);
        return null;
      }

      const article = articles[0];
      const transformedArticle = transformWordPressArticle(article);
      
      console.log(`[WordPressClient] Article found: ${transformedArticle.title}`);
      return transformedArticle;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      handleWordPressError(error, 'getArticleBySlug');
      throw error;
    }
  });
}

/**
 * 根据 slug 获取文章并返回性能指标
 */
export async function getArticleBySlugWithMetrics(
  slug: string, 
  locale: WordPressLocale = 'en'
): Promise<{ article: Article | null; metrics: { bytes: number } }> {
  return withRetry(async () => {
    try {
      console.log(`[WordPressClient] Fetching article with metrics by slug: ${slug}, locale: ${locale}`);
      
      const params: WordPressQueryParams = {
        slug,
        _embed: true,
        status: ['publish']
      };

      if (locale !== 'en') {
        (params as any).lang = locale;
      }

      const response = await wordpressClient.get('/wp-json/wp/v2/yanghua_article', { params });
      
      const articles = response.data as WordPressArticle[];
      const payloadSize = computeWordPressPayloadSize(response.data);
      
      if (!articles || articles.length === 0) {
        console.log(`[WordPressClient] No article found with slug: ${slug}`);
        return { article: null, metrics: { bytes: payloadSize } };
      }

      const article = articles[0];
      const transformedArticle = transformWordPressArticle(article);
      
      console.log(`[WordPressClient] Article found with metrics: ${transformedArticle.title}, ${payloadSize} bytes`);
      return { 
        article: transformedArticle, 
        metrics: { bytes: payloadSize } 
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { article: null, metrics: { bytes: 0 } };
      }
      handleWordPressError(error, 'getArticleBySlugWithMetrics');
      throw error;
    }
  });
}

/**
 * 获取所有文章（包括草稿）
 */
export async function getAllArticlesWithDrafts(locale: WordPressLocale = 'en'): Promise<{ data: Article[] }> {
  return withRetry(async () => {
    try {
      console.log(`[WordPressClient] Fetching all articles with drafts for locale: ${locale}`);
      
      const params: WordPressQueryParams = {
        per_page: 100,
        status: ['publish', 'draft', 'private'],
        _embed: true,
        orderby: 'date',
        order: 'desc'
      };

      if (locale !== 'en') {
        (params as any).lang = locale;
      }

      const response = await wordpressClient.get('/wp-json/wp/v2/yanghua_article', { params });
      
      const articles = response.data as WordPressArticle[];
      console.log(`[WordPressClient] Retrieved ${articles.length} articles (including drafts)`);
      
      const transformedArticles = transformWordPressArticles(articles);
      return normalizeWordPressResponse(transformedArticles);
    } catch (error: any) {
      handleWordPressError(error, 'getAllArticlesWithDrafts');
      throw error;
    }
  });
}

/**
 * 根据 slug 获取文章（包括草稿）
 */
export async function getArticleBySlugWithDrafts(
  slug: string, 
  locale: WordPressLocale = 'en'
): Promise<Article | null> {
  return withRetry(async () => {
    try {
      console.log(`[WordPressClient] Fetching article with drafts by slug: ${slug}, locale: ${locale}`);
      
      const params: WordPressQueryParams = {
        slug,
        _embed: true,
        status: ['publish', 'draft', 'private']
      };

      if (locale !== 'en') {
        (params as any).lang = locale;
      }

      const response = await wordpressClient.get('/wp-json/wp/v2/yanghua_article', { params });
      
      const articles = response.data as WordPressArticle[];
      
      if (!articles || articles.length === 0) {
        console.log(`[WordPressClient] No article found with slug: ${slug} (including drafts)`);
        return null;
      }

      const article = articles[0];
      const transformedArticle = transformWordPressArticle(article);
      
      console.log(`[WordPressClient] Article found (with drafts): ${transformedArticle.title}`);
      return transformedArticle;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      handleWordPressError(error, 'getArticleBySlugWithDrafts');
      throw error;
    }
  });
}

/**
 * 获取缓存的文章数据
 */
export async function getArticlesWithCache(): Promise<{ data: Article[]; timestamp: number }> {
  const result = await getAllArticles();
  return {
    data: result.data,
    timestamp: Date.now()
  };
}

/**
 * WordPress 健康检查
 */
export async function checkWordPressHealth(): Promise<boolean> {
  try {
    console.log('[WordPressClient] Performing health check...');
    
    // 尝试获取 WordPress 站点信息
    const response = await wordpressClient.get('/wp-json/wp/v2', { timeout: 10000 });
    
    const isHealthy = response.status === 200 && response.data;
    console.log(`[WordPressClient] Health check result: ${isHealthy ? 'healthy' : 'unhealthy'}`);
    
    return isHealthy;
  } catch (error) {
    console.error('[WordPressClient] Health check failed:', error);
    return false;
  }
}

/**
 * 获取详细的 WordPress 健康状态
 */
export async function getWordPressHealthStatus(): Promise<WordPressHealthResponse> {
  try {
    const response = await wordpressClient.get('/wp-json/wp/v2');
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: response.data.gmt_offset ? 'WordPress REST API v2' : 'Unknown',
      database: {
        status: 'connected'
      },
      plugins: {
        active: [],
        total: 0
      },
      theme: {
        name: 'Custom Theme',
        version: '1.0.0'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: 'Unknown',
      database: {
        status: 'disconnected'
      },
      plugins: {
        active: [],
        total: 0
      },
      theme: {
        name: 'Unknown',
        version: 'Unknown'
      }
    };
  }
}
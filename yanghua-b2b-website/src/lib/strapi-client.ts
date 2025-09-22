import Strapi, { StrapiLocale } from "strapi-sdk-js";
import { getStrapiURL } from "./utils";
import { Article } from "./types";
import { logError } from "./error-logger";
import { transformArticles, normalizeApiResponse } from "./data-transformer";

// Enhanced Strapi client configuration for Strapi Cloud
const strapiUrl = getStrapiURL();
console.log('[StrapiClient] Initializing Strapi client with URL:', strapiUrl);
console.log('[StrapiClient] Environment:', typeof window === 'undefined' ? 'server' : 'client');
console.log('[StrapiClient] STRAPI_API_TOKEN configured:', !!process.env.STRAPI_API_TOKEN);

const strapi = new Strapi({
  url: strapiUrl,
});

// Configure axios for cloud service optimization
strapi.axios.defaults.timeout = 25000; // 25 seconds timeout to cover Strapi Cloud cold-start latency
strapi.axios.defaults.headers.common['Accept'] = 'application/json';
strapi.axios.defaults.headers.common['Content-Type'] = 'application/json';

// Configure authentication for Strapi Cloud
if (process.env.STRAPI_API_TOKEN) {
  strapi.axios.defaults.headers.common['Authorization'] = `Bearer ${process.env.STRAPI_API_TOKEN}`;
  console.log('[StrapiClient] Strapi API token configured for authentication');
} else {
  console.warn('[StrapiClient] STRAPI_API_TOKEN not found - API calls may fail');
}

// Add request interceptor for detailed logging
strapi.axios.interceptors.request.use(
  (config) => {
    const requestId = `strapi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    (config as any).metadata = { requestId, startTime: Date.now() };
    
    console.log(`[${requestId}] Strapi API Request:`, {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      params: config.params,
      data: config.data,
      headers: config.headers,
      timeout: config.timeout,
      environment: typeof window === 'undefined' ? 'server' : 'client'
    });
    
    return config;
  },
  (error) => {
    console.error('[StrapiClient] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for detailed logging
strapi.axios.interceptors.response.use(
  (response) => {
    const requestId = (response.config as any).metadata?.requestId;
    const startTime = (response.config as any).metadata?.startTime;
    const duration = startTime ? Date.now() - startTime : undefined;
    
    console.log(`[${requestId}] Strapi API Response:`, {
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
    
    console.error(`[${requestId}] Strapi API Error:`, {
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

// Enhanced retry configuration for cloud services
const RETRY_CONFIG = {
  maxRetries: 6, // Increased to 6 for better cold-start handling
  retryDelay: 1500, // 1.5 seconds initial delay
  backoffMultiplier: 1.8, // Moderate exponential backoff
  timeoutRetries: 4, // Allow more retries specifically for timeouts
  maxDelay: 15000, // Maximum delay of 15 seconds
};

const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = RETRY_CONFIG.maxRetries
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const isRetryableError = 
      error.code === 'ECONNABORTED' || // Timeout
      error.code === 'ENOTFOUND' || // DNS issues
      error.code === 'ECONNRESET' || // Connection reset
      error.code === 'ECONNREFUSED' || // Connection refused (cold start)
      (error.response && error.response.status >= 500) || // Server errors
      (error.response && error.response.status === 429) || // Rate limiting
      (error.response && error.response.status === 502) || // Bad Gateway (cold start)
      (error.response && error.response.status === 503) || // Service Unavailable (cold start)
      (error.response && error.response.status === 504); // Gateway Timeout (cold start)
    
    if (retries > 0 && isRetryableError) {
      const baseDelay = RETRY_CONFIG.retryDelay;
      const attemptNumber = RETRY_CONFIG.maxRetries - retries;
      const delay = Math.min(
        baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attemptNumber),
        RETRY_CONFIG.maxDelay
      );
      
      logError(`Retrying operation in ${delay}ms. Retries left: ${retries}`, error, {
        retries,
        delay,
        errorCode: error.code,
        statusCode: error.response?.status,
        isRetryableError,
        attemptNumber: attemptNumber + 1
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1);
    }
    throw error;
  }
};

// Enhanced error handling for cloud services
const handleStrapiError = (error: any, operation: string) => {
  let errorMessage = `Strapi Cloud ${operation} failed`;
  let userFriendlyMessage = 'Unable to fetch data. Please try again later.';
  let detailedErrorInfo = '';
  
  if (error && error.code === 'ECONNABORTED') {
    errorMessage += ': Request timeout';
    userFriendlyMessage = 'Request timed out. Please check your internet connection.';
    detailedErrorInfo = `Timeout after ${error.timeout || 'unknown'}ms`;
  } else if (error && error.code === 'ENOTFOUND') {
    errorMessage += ': DNS resolution failed';
    userFriendlyMessage = 'Unable to connect to the server. Please check your internet connection.';
    detailedErrorInfo = `DNS lookup failed for ${error.hostname || 'unknown host'}`;
  } else if (error && error.response) {
    const status = error.response.status;
    const statusText = error.response.statusText || 'Unknown Status';
    const responseData = error.response.data;
    
    errorMessage += `: HTTP ${status} - ${statusText}`;
    detailedErrorInfo = `Response: ${JSON.stringify(responseData, null, 2)}`;
    
    if (status >= 500) {
      userFriendlyMessage = 'Server is temporarily unavailable. Please try again in a few minutes.';
    } else if (status === 429) {
      userFriendlyMessage = 'Too many requests. Please wait a moment before trying again.';
    } else if (status === 404) {
      userFriendlyMessage = 'The requested content was not found.';
    } else if (status >= 400) {
      userFriendlyMessage = 'There was an error with your request. Please try again.';
    }
  } else {
    // Enhanced error message extraction
    let message = 'Unknown error';
    
    if (error?.message) {
      message = error.message;
    } else if (error && typeof error === 'object') {
      try {
        message = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
      } catch {
        message = error.toString();
      }
    } else if (error) {
      message = String(error);
    }
    
    errorMessage += `: ${message}`;
    detailedErrorInfo = `Raw error: ${message}`;
  }
  
  // Enhanced logging with more context
  logError(errorMessage, error instanceof Error ? error : new Error(errorMessage), { 
    operation, 
    originalError: error,
    userFriendlyMessage,
    cloudService: 'Strapi Cloud',
    detailedErrorInfo,
    errorType: error?.constructor?.name || typeof error,
    timestamp: new Date().toISOString(),
    url: getStrapiURL()
  });
  
  const enhancedError = new Error(userFriendlyMessage);
  (enhancedError as any).originalError = error;
  (enhancedError as any).operation = operation;
  (enhancedError as any).detailedInfo = detailedErrorInfo;
  throw enhancedError;
};

// Debug utility for error analysis
const debugError = (error: any, context: string) => {
  console.group(`🔍 Error Debug - ${context}`);
  console.log('Error type:', typeof error);
  console.log('Error constructor:', error?.constructor?.name);
  console.log('Error message:', error?.message);
  console.log('Error code:', error?.code);
  console.log('Error response:', error?.response);
  console.log('Error stack:', error?.stack);
  console.log('Full error object:', error);
  console.log('Error keys:', error ? Object.keys(error) : 'No keys');
  console.groupEnd();
};

export async function getAllArticles(locale?: StrapiLocale): Promise<{ data: Article[] }> {
  return withRetry(async () => {
    // Log detailed request information for debugging
    const requestStartTime = Date.now();
    const strapiUrl = getStrapiURL();
    const requestId = `getAllArticles-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[${requestId}] Fetching articles from Strapi Cloud:`, strapiUrl);
    console.log(`[${requestId}] Request locale:`, locale);
    console.log(`[${requestId}] API Token configured:`, !!process.env.STRAPI_API_TOKEN);
    console.log(`[${requestId}] Environment:`, typeof window === 'undefined' ? 'server' : 'client');
    console.log(`[${requestId}] User Agent:`, typeof window !== 'undefined' ? window.navigator.userAgent : 'server');
    
    const articles = await strapi.find("articles", {
      populate: {
        cover: { populate: "*" },
        author: {
          populate: {
            avatar: { populate: "*" },
          },
        },
        blocks: {
          populate: "*",
        },
      },
      locale: locale || 'en',
      sort: "publishedAt:desc",
    });
    
    const requestEndTime = Date.now();
    const duration = requestEndTime - requestStartTime;
    
    console.log(`[${requestId}] Articles fetched successfully, count:`, articles?.data?.length || 0);
    console.log(`[${requestId}] Request duration: ${duration}ms`);
    console.log(`[${requestId}] Response status: success`);
    
    // Log request details for network debugging
    if (typeof window !== 'undefined' && window.performance) {
      const navigationEntries = window.performance.getEntriesByType('navigation');
      const resourceEntries = window.performance.getEntriesByType('resource');
      
      console.log(`[${requestId}] Navigation entries:`, navigationEntries);
      console.log(`[${requestId}] Resource entries matching Strapi:`, 
        resourceEntries.filter(entry => entry.name.includes('strapi'))
      );
    }
    
    const normalized = normalizeApiResponse(articles, transformArticles);
    
    if (normalized.error) {
      console.error('Normalization error:', normalized.error);
      throw new Error(normalized.error);
    }
    
    console.log('Successfully processed articles:', normalized.data?.length || 0);
    return { data: normalized.data || [] };
  });
}

export async function getArticleBySlug(slug: string, locale?: StrapiLocale): Promise<Article | null> {
  return withRetry(async () => {
    try {
      console.log(`Fetching article by slug: ${slug}`);
      const articles = await strapi.find("articles", {
        filters: { slug: { $eq: slug } },
        populate: {
          cover: { populate: "*" },
          author: {
            populate: {
              avatar: { populate: "*" },
            },
          },
          blocks: {
            populate: "*",
          },
        },
        locale: locale,
      } as any);
      const normalized = normalizeApiResponse(articles, (data) => {
         const articleArray = Array.isArray(data) ? data : [data];
         const transformed = transformArticles(articleArray);
         return transformed[0] || null;
       });
       if (normalized.error) {
         throw new Error(normalized.error);
       }
       return normalized.data;
    } catch (error) {
      handleStrapiError(error, `getArticleBySlug(${slug})`);
      throw error;
    }
  });
}

// New function to get articles with draft support for preview mode
export async function getAllArticlesWithDrafts(locale?: StrapiLocale): Promise<{ data: Article[] }> {
  return withRetry(async () => {
    try {
      console.log('Fetching articles (including drafts) from Strapi Cloud:', getStrapiURL());
      const articles = await strapi.find("articles", {
        populate: {
          cover: { populate: "*" },
          author: {
            populate: {
              avatar: { populate: "*" },
            },
          },
          blocks: {
            populate: "*",
          },
        },
        locale,
        publicationState: 'preview', // Include both published and draft articles
      } as any);
      const normalized = normalizeApiResponse(articles, transformArticles);
       if (normalized.error) {
         throw new Error(normalized.error);
       }
       return { data: normalized.data || [] };
    } catch (error) {
      handleStrapiError(error, 'getAllArticlesWithDrafts');
      throw error;
    }
  });
}

// Enhanced function to get article by slug with draft support
export async function getArticleBySlugWithDrafts(slug: string, locale?: StrapiLocale): Promise<Article | null> {
  return withRetry(async () => {
    try {
      console.log(`Fetching article (including drafts) by slug: ${slug}`);
      const articles = await strapi.find("articles", {
        filters: { slug: { $eq: slug } },
        populate: {
          cover: { populate: "*" },
          author: {
            populate: {
              avatar: { populate: "*" },
            },
          },
          blocks: {
            populate: "*",
          },
        },
        locale: locale,
        publicationState: 'preview', // Include both published and draft articles
      } as any);
      const normalized = normalizeApiResponse(articles, (data) => {
         const articleArray = Array.isArray(data) ? data : [data];
         const transformed = transformArticles(articleArray);
         return transformed[0] || null;
       });
       if (normalized.error) {
         throw new Error(normalized.error);
       }
       return normalized.data;
    } catch (error) {
      handleStrapiError(error, `getArticleBySlugWithDrafts(${slug})`);
      throw error;
    }
  });
}

// New function for caching support
export async function getArticlesWithCache(): Promise<{ data: Article[]; timestamp: number }> {
  const articles = await getAllArticles();
  return {
    ...articles,
    timestamp: Date.now(),
  };
}

// Health check function for Strapi Cloud connection
export async function checkStrapiHealth(): Promise<boolean> {
  try {
    await withRetry(async () => {
      const response = await fetch(`${getStrapiURL()}/api/articles?pagination[limit]=1`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return response.json();
    });
    return true;
  } catch (error) {
    logError('Strapi health check failed', error instanceof Error ? error : new Error(String(error)), { originalError: error });
    return false;
  }
}
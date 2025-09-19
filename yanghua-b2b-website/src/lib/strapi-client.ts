import Strapi, { StrapiLocale } from "strapi-sdk-js";
import { getStrapiURL } from "./utils";
import { Article } from "./types";
import { logError } from "./error-logger";
import { transformArticles, normalizeApiResponse } from "./data-transformer";

// Enhanced Strapi client configuration for Strapi Cloud
const strapi = new Strapi({
  url: getStrapiURL(),
});

// Configure axios for cloud service optimization
strapi.axios.defaults.timeout = 25000; // 25 seconds timeout to cover Strapi Cloud cold-start latency
strapi.axios.defaults.headers.common['Accept'] = 'application/json';
strapi.axios.defaults.headers.common['Content-Type'] = 'application/json';

// Set API token if available (optional for public endpoints)
if (process.env.STRAPI_API_TOKEN) {
  strapi.axios.defaults.headers.common['Authorization'] = `Bearer ${process.env.STRAPI_API_TOKEN}`;
}

// Enhanced retry configuration for cloud services
const RETRY_CONFIG = {
  maxRetries: 5, // Increased to 5 for better cold-start handling
  retryDelay: 2000, // 2 seconds initial delay
  backoffMultiplier: 2.0, // Exponential backoff factor
  timeoutRetries: 3, // Allow more retries specifically for timeouts
};

// Enhanced retry logic for cloud services
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
      (error.response && error.response.status >= 500) || // Server errors
      (error.response && error.response.status === 429); // Rate limiting
    
    if (retries > 0 && isRetryableError) {
      const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxRetries - retries);
      
      logError(`Retrying operation in ${delay}ms. Retries left: ${retries}`, error, {
        retries,
        delay,
        errorCode: error.code,
        statusCode: error.response?.status
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
  
  if (error.code === 'ECONNABORTED') {
    errorMessage += ': Request timeout';
    userFriendlyMessage = 'Request timed out. Please check your internet connection.';
  } else if (error.code === 'ENOTFOUND') {
    errorMessage += ': DNS resolution failed';
    userFriendlyMessage = 'Unable to connect to the server. Please check your internet connection.';
  } else if (error.response) {
    const status = error.response.status;
    errorMessage += `: HTTP ${status} - ${error.response.statusText}`;
    
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
    errorMessage += `: ${error.message || 'Unknown error'}`;
  }
  
  logError(errorMessage, error, { 
    operation, 
    originalError: error,
    userFriendlyMessage,
    cloudService: 'Strapi Cloud'
  });
  
  const enhancedError = new Error(userFriendlyMessage);
  (enhancedError as any).originalError = error;
  (enhancedError as any).operation = operation;
  throw enhancedError;
};

export async function getAllArticles(locale?: StrapiLocale): Promise<{ data: Article[] }> {
  return withRetry(async () => {
    try {
      // Log cloud API request for monitoring
      console.log('Fetching articles from Strapi Cloud:', getStrapiURL());
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
      });
      const normalized = normalizeApiResponse(articles, transformArticles);
       if (normalized.error) {
         throw new Error(normalized.error);
       }
       return { data: normalized.data || [] };
    } catch (error) {
      handleStrapiError(error, 'getAllArticles');
      throw error; // This won't be reached due to handleStrapiError throwing
    }
  });
}

export async function getArticleBySlug(slug: string, locale?: StrapiLocale): Promise<Article | null> {
  return withRetry(async () => {
    try {
      console.log(slug, "slug");
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
        locale: locale
      });
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
      throw error; // This won't be reached due to handleStrapiError throwing
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
/**
 * API重试机制工具函数
 * 实现指数退避策略和错误处理
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // 默认重试条件：网络错误或5xx服务器错误
    if (error?.code === 'NETWORK_ERROR') return true;
    if (error?.response?.status >= 500) return true;
    if (error?.name === 'TimeoutError') return true;
    return false;
  }
};

/**
 * 带重试机制的异步函数执行器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === opts.maxRetries) {
        throw error;
      }

      // 检查是否应该重试
      if (!opts.retryCondition(error)) {
        throw error;
      }

      // 计算延迟时间（指数退避）
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffFactor, attempt),
        opts.maxDelay
      );

      console.warn(`API调用失败，${delay}ms后进行第${attempt + 1}次重试:`, error instanceof Error ? error.message : String(error));
      
      // 等待指定时间后重试
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * 带重试机制的fetch包装器
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 检查HTTP状态码
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = response;
        throw error;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        (timeoutError as any).name = 'TimeoutError';
        throw timeoutError;
      }
      
      throw error;
    }
  }, retryOptions);
}

/**
 * 创建带有默认重试配置的API客户端
 */
export function createApiClient(baseURL: string, defaultOptions?: RetryOptions) {
  return {
    get: async (path: string, options?: RequestInit & { retryOptions?: RetryOptions }) => {
      const { retryOptions, ...fetchOptions } = options || {};
      return fetchWithRetry(
        `${baseURL}${path}`,
        { method: 'GET', ...fetchOptions },
        { ...defaultOptions, ...retryOptions }
      );
    },
    
    post: async (path: string, data?: any, options?: RequestInit & { retryOptions?: RetryOptions }) => {
      const { retryOptions, ...fetchOptions } = options || {};
      return fetchWithRetry(
        `${baseURL}${path}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...fetchOptions.headers },
          body: data ? JSON.stringify(data) : undefined,
          ...fetchOptions
        },
        { ...defaultOptions, ...retryOptions }
      );
    },
    
    put: async (path: string, data?: any, options?: RequestInit & { retryOptions?: RetryOptions }) => {
      const { retryOptions, ...fetchOptions } = options || {};
      return fetchWithRetry(
        `${baseURL}${path}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...fetchOptions.headers },
          body: data ? JSON.stringify(data) : undefined,
          ...fetchOptions
        },
        { ...defaultOptions, ...retryOptions }
      );
    },
    
    delete: async (path: string, options?: RequestInit & { retryOptions?: RetryOptions }) => {
      const { retryOptions, ...fetchOptions } = options || {};
      return fetchWithRetry(
        `${baseURL}${path}`,
        { method: 'DELETE', ...fetchOptions },
        { ...defaultOptions, ...retryOptions }
      );
    }
  };
}
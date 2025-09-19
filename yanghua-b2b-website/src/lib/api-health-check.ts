import { createApiClient, fetchWithRetry } from './api-retry';

// 健康检查配置
interface HealthCheckConfig {
  timeout: number;
  retries: number;
  interval: number;
}

// 健康检查结果
interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
  timestamp: string;
}

// 服务端点配置
interface ServiceEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  headers?: Record<string, string>;
  expectedStatus?: number[];
  timeout?: number;
}

// 默认配置
const DEFAULT_CONFIG: HealthCheckConfig = {
  timeout: 5000,
  retries: 2,
  interval: 30000
};

// 服务端点列表
const SERVICE_ENDPOINTS: ServiceEndpoint[] = [
  {
    name: 'strapi-api',
    url: process.env.NEXT_PUBLIC_STRAPI_API_URL + '/api/health' || 'http://localhost:1337/api/health',
    method: 'GET',
    expectedStatus: [200, 204],
    timeout: 3000
  },
  {
    name: 'strapi-articles',
    url: process.env.NEXT_PUBLIC_STRAPI_API_URL + '/api/articles' || 'http://localhost:1337/api/articles',
    method: 'HEAD',
    expectedStatus: [200, 404], // 404也算正常，说明API可访问
    timeout: 3000
  },
  {
    name: 'strapi-projects',
    url: process.env.NEXT_PUBLIC_STRAPI_API_URL + '/api/projects' || 'http://localhost:1337/api/projects',
    method: 'HEAD',
    expectedStatus: [200, 404],
    timeout: 3000
  }
];

// 单个服务健康检查
export async function checkServiceHealth(
  endpoint: ServiceEndpoint,
  config: Partial<HealthCheckConfig> = {}
): Promise<HealthCheckResult> {
  const { timeout } = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();
  
  try {
    const apiClient = createApiClient('');
    
    let response: Response;
    
    // 根据方法类型调用相应的API
    switch (endpoint.method) {
      case 'GET':
        response = await apiClient.get(endpoint.url, {
          headers: endpoint.headers,
          signal: AbortSignal.timeout(endpoint.timeout || timeout)
        });
        break;
      case 'POST':
        response = await apiClient.post(endpoint.url, undefined, {
          headers: endpoint.headers,
          signal: AbortSignal.timeout(endpoint.timeout || timeout)
        });
        break;
      case 'HEAD':
        // 使用fetchWithRetry直接处理HEAD请求
        response = await fetchWithRetry(endpoint.url, {
          method: 'HEAD',
          headers: endpoint.headers,
          signal: AbortSignal.timeout(endpoint.timeout || timeout)
        });
        break;
      default:
        throw new Error(`Unsupported method: ${endpoint.method}`);
    }
    
    const responseTime = Date.now() - startTime;
    const expectedStatuses = endpoint.expectedStatus || [200];
    const isHealthy = expectedStatuses.includes(response.status);
    
    return {
      service: endpoint.name,
      status: isHealthy ? 'healthy' : 'degraded',
      responseTime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return {
      service: endpoint.name,
      status: 'unhealthy',
      responseTime,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

// 批量健康检查
export async function checkAllServicesHealth(
  config: Partial<HealthCheckConfig> = {}
): Promise<HealthCheckResult[]> {
  const promises = SERVICE_ENDPOINTS.map(endpoint => 
    checkServiceHealth(endpoint, config)
  );
  
  return Promise.all(promises);
}

// 获取整体健康状态
export async function getOverallHealthStatus(
  config: Partial<HealthCheckConfig> = {}
): Promise<{
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
}> {
  const services = await checkAllServicesHealth(config);
  
  const summary = services.reduce(
    (acc, service) => {
      acc.total++;
      acc[service.status]++;
      return acc;
    },
    { total: 0, healthy: 0, unhealthy: 0, degraded: 0 }
  );
  
  // 确定整体状态
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
  if (summary.unhealthy > 0) {
    overallStatus = 'unhealthy';
  } else if (summary.degraded > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }
  
  return {
    status: overallStatus,
    services,
    summary
  };
}

// 健康检查监控器
export class HealthMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private config: HealthCheckConfig;
  private listeners: Array<(results: HealthCheckResult[]) => void> = [];
  
  constructor(config: Partial<HealthCheckConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  // 开始监控
  start(): void {
    if (this.intervalId) {
      this.stop();
    }
    
    // 立即执行一次检查
    this.performCheck();
    
    // 设置定期检查
    this.intervalId = setInterval(() => {
      this.performCheck();
    }, this.config.interval);
  }
  
  // 停止监控
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  // 添加监听器
  onHealthCheck(callback: (results: HealthCheckResult[]) => void): void {
    this.listeners.push(callback);
  }
  
  // 移除监听器
  removeListener(callback: (results: HealthCheckResult[]) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  // 执行检查
  private async performCheck(): Promise<void> {
    try {
      const results = await checkAllServicesHealth(this.config);
      
      // 通知所有监听器
      this.listeners.forEach(callback => {
        try {
          callback(results);
        } catch (error) {
          console.error('Health check listener error:', error);
        }
      });
      
      // 记录不健康的服务
      const unhealthyServices = results.filter(r => r.status !== 'healthy');
      if (unhealthyServices.length > 0) {
        console.warn('Unhealthy services detected:', unhealthyServices);
      }
      
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }
}

// 创建默认监控器实例
export const defaultHealthMonitor = new HealthMonitor();

// 浏览器环境下自动启动监控
if (typeof window !== 'undefined') {
  // 页面加载完成后启动监控
  if (document.readyState === 'complete') {
    defaultHealthMonitor.start();
  } else {
    window.addEventListener('load', () => {
      defaultHealthMonitor.start();
    });
  }
  
  // 页面卸载时停止监控
  window.addEventListener('beforeunload', () => {
    defaultHealthMonitor.stop();
  });
}

// 导出工具函数
export {
  type HealthCheckConfig,
  type HealthCheckResult,
  type ServiceEndpoint,
  SERVICE_ENDPOINTS,
  DEFAULT_CONFIG
};
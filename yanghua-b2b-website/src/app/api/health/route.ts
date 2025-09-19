import { NextRequest, NextResponse } from 'next/server';
import { checkAllServicesHealth, getOverallHealthStatus } from '@/lib/api-health-check';
import { monitoring, createRequestLogger } from '@/lib/monitoring';

// 健康检查结果类型
interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: {
    database: string;
    strapi: string;
    [key: string]: string;
  };
  uptime: number;
  version: string;
  monitoring?: {
    performance: any;
    errors: any;
    logs: any;
  };
}

// GET请求处理 - 详细健康检查
export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  
  try {
    const startTime = Date.now();
    
    // 获取整体健康状态
    const healthStatus = await getOverallHealthStatus({
      timeout: 3000,
      retries: 1
    });
    
    // 运行监控系统健康检查
    const monitoringHealth = await monitoring.health.getHealthStatus();
    
    // 构建响应数据
    const results: HealthStatus = {
      status: healthStatus.status === 'healthy' && monitoringHealth.status === 'healthy' ? 'healthy' : 
              healthStatus.status === 'degraded' || monitoringHealth.status === 'degraded' ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'not_configured',
        strapi: 'not_configured'
      },
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      monitoring: {
        performance: monitoring.performance.getPerformanceSummary(),
        errors: monitoring.error.getErrorSummary(),
        logs: monitoring.logger.getRecentLogs(5),
      }
    };
    
    // 更新服务状态
    healthStatus.services.forEach(service => {
      if (service.service.includes('strapi')) {
        results.services.strapi = service.status;
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    logger.log('info', 'Health check completed', {
      status: results.status,
      responseTime,
      servicesChecked: healthStatus.services.length,
    });
    
    // 根据健康状态返回相应的HTTP状态码
    const httpStatus = results.status === 'healthy' ? 200 : 
                      results.status === 'degraded' ? 200 : 503;
    
    logger.finish(httpStatus);
    
    return NextResponse.json(results, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`
      }
    });
    
  } catch (error) {
    logger.log('error', 'Health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    logger.finish(503);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}

// POST请求处理 - 简单健康检查
export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);
  
  try {
    const body = await request.json().catch(() => ({}));
    const includeDetails = body.includeDetails || false;
    
    // 快速健康检查
    const monitoringHealth = await monitoring.health.getHealthStatus();
    
    let response: any = {
      status: monitoringHealth.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
    
    if (includeDetails) {
      response = {
        ...response,
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          memory: process.memoryUsage(),
          env: process.env.NODE_ENV,
        },
        monitoring: {
          performance: monitoring.performance.getPerformanceSummary(),
          errors: monitoring.error.getErrorSummary(),
          logs: monitoring.logger.getRecentLogs(10),
        },
        checks: monitoringHealth.checks,
      };
    }
    
    logger.log('info', 'Simple health check completed', {
      status: response.status,
      includeDetails,
    });
    
    const httpStatus = response.status === 'healthy' ? 200 : 
                      response.status === 'degraded' ? 200 : 503;
    
    logger.finish(httpStatus);
    
    return NextResponse.json(response, { status: httpStatus });
    
  } catch (error) {
    logger.log('error', 'Simple health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    logger.finish(503);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

// HEAD请求处理 - 最简单的健康检查
export async function HEAD(request: NextRequest) {
  const logger = createRequestLogger(request);
  
  try {
    // 最基本的健康检查
    const isHealthy = process.uptime() > 0;
    const status = isHealthy ? 200 : 503;
    
    logger.log('info', 'HEAD health check', { status });
    logger.finish(status);
    
    return new NextResponse(null, { 
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    logger.log('error', 'HEAD health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    logger.finish(503);
    
    return new NextResponse(null, { status: 503 });
  }
}
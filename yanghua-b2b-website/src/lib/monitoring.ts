import { NextRequest } from 'next/server';

// Types for monitoring
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  userAgent?: string;
  userId?: string;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  timestamp: number;
  userAgent?: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Record Core Web Vitals
  recordWebVital(metric: PerformanceMetric): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now(),
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Send to analytics service
    this.sendToAnalytics(metric);
  }

  // Record custom performance metrics
  recordCustomMetric(name: string, value: number, context?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.recordWebVital(metric);
  }

  // Get performance summary
  getPerformanceSummary(): Record<string, any> {
    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp < 300000 // Last 5 minutes
    );

    const summary: Record<string, any> = {};
    
    recentMetrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          total: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0,
        };
      }

      const stat = summary[metric.name];
      stat.count++;
      stat.total += metric.value;
      stat.min = Math.min(stat.min, metric.value);
      stat.max = Math.max(stat.max, metric.value);
      stat.avg = stat.total / stat.count;
    });

    return summary;
  }

  private async sendToAnalytics(metric: PerformanceMetric): Promise<void> {
    try {
      // Only send analytics in development or when explicitly enabled
      const isProduction = process.env.NODE_ENV === 'production';
      const analyticsEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
      
      if (isProduction && !analyticsEnabled) {
        return; // Skip analytics in production unless explicitly enabled
      }

      // Send to Google Analytics 4
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'web_vital', {
          event_category: 'Performance',
          event_label: metric.name,
          value: Math.round(metric.value),
          custom_parameter_1: metric.url,
        });
      }

      // Send to custom analytics endpoint with timeout
      if (typeof fetch !== 'undefined') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        await fetch('/api/analytics/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metric),
          signal: controller.signal,
        }).catch(() => {
          // Silently fail to avoid affecting user experience
        });
        
        clearTimeout(timeoutId);
      }
    } catch (error) {
      // Silently fail in production to avoid console noise
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to send performance metric:', error);
      }
    }
  }
}

// Error monitoring
export class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errors: ErrorReport[] = [];
  private maxErrors = 500;

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  // Report error
  reportError(error: Error | string, severity: ErrorReport['severity'] = 'medium', context?: Record<string, any>): void {
    const errorReport: ErrorReport = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      severity,
      context,
    };

    this.errors.push(errorReport);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Send to error tracking service
    this.sendToErrorService(errorReport);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reported:', errorReport);
    }
  }

  // Get error summary
  getErrorSummary(): Record<string, any> {
    const recentErrors = this.errors.filter(
      e => Date.now() - e.timestamp < 3600000 // Last hour
    );

    return {
      total: recentErrors.length,
      bySeverity: recentErrors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byUrl: recentErrors.reduce((acc, error) => {
        acc[error.url] = (acc[error.url] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recent: recentErrors.slice(-10),
    };
  }

  private async sendToErrorService(error: ErrorReport): Promise<void> {
    try {
      // Only send error reports in development or when explicitly enabled
      const isProduction = process.env.NODE_ENV === 'production';
      const errorReportingEnabled = process.env.NEXT_PUBLIC_ERROR_REPORTING_ENABLED === 'true';
      
      if (isProduction && !errorReportingEnabled) {
        return; // Skip error reporting in production unless explicitly enabled
      }

      // Send to Sentry or similar service
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(new Error(error.message), {
          level: error.severity,
          extra: error.context,
          tags: {
            url: error.url,
          },
        });
      }

      // Send to custom error endpoint with timeout
      if (typeof fetch !== 'undefined') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        await fetch('/api/monitoring/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(error),
          signal: controller.signal,
        }).catch(() => {
          // Silently fail
        });
        
        clearTimeout(timeoutId);
      }
    } catch (err) {
      // Silently fail in production to avoid console noise
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to send error report:', err);
      }
    }
  }
}

// Logger
export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogEntry['level'], message: string, context?: Record<string, any>): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      sessionId: this.getSessionId(),
    };

    this.logs.push(logEntry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Send to logging service
    this.sendToLoggingService(logEntry);

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}]`, message, context || '');
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  // Get recent logs
  getRecentLogs(count = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('monitoring-session-id');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('monitoring-session-id', sessionId);
      }
      return sessionId;
    }
    return 'server';
  }

  private async sendToLoggingService(log: LogEntry): Promise<void> {
    try {
      // Only send logs in development or when explicitly enabled
      const isProduction = process.env.NODE_ENV === 'production';
      const loggingEnabled = process.env.NEXT_PUBLIC_LOGGING_ENABLED === 'true';
      
      if (isProduction && !loggingEnabled) {
        return; // Skip logging in production unless explicitly enabled
      }

      if (typeof fetch !== 'undefined') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        await fetch('/api/monitoring/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(log),
          signal: controller.signal,
        }).catch(() => {
          // Silently fail
        });
        
        clearTimeout(timeoutId);
      }
    } catch (error) {
      // Silently fail to avoid infinite loops
    }
  }
}

// Health check
export class HealthMonitor {
  private static instance: HealthMonitor;
  private checks: Map<string, () => Promise<boolean>> = new Map();

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  // Register health check
  registerCheck(name: string, checkFn: () => Promise<boolean>): void {
    this.checks.set(name, checkFn);
  }

  // Run all health checks
  async runHealthChecks(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, checkFn] of this.checks) {
      try {
        results[name] = await checkFn();
      } catch (error) {
        results[name] = false;
        Logger.getInstance().error(`Health check failed: ${name}`, { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    return results;
  }

  // Get system health status
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: number;
  }> {
    const checks = await this.runHealthChecks();
    const failedChecks = Object.values(checks).filter(result => !result).length;
    const totalChecks = Object.keys(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks === 0) {
      status = 'healthy';
    } else if (failedChecks < totalChecks / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      timestamp: Date.now(),
    };
  }
}

// Utility functions
export const monitoring = {
  performance: PerformanceMonitor.getInstance(),
  error: ErrorMonitor.getInstance(),
  logger: Logger.getInstance(),
  health: HealthMonitor.getInstance(),
};

// Initialize monitoring in browser
export function initializeMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Set up global error handlers
  window.addEventListener('error', (event) => {
    monitoring.error.reportError(event.error || event.message, 'high', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    monitoring.error.reportError(event.reason, 'high', {
      type: 'unhandledrejection',
    });
  });

  // Set up performance observer for Core Web Vitals
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            monitoring.performance.recordCustomMetric('page_load_time', navEntry.loadEventEnd - navEntry.loadEventStart);
          }
          
          if (entry.entryType === 'paint') {
            monitoring.performance.recordCustomMetric(entry.name, entry.startTime);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation', 'paint'] });
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }
  }

  // Register basic health checks
  monitoring.health.registerCheck('api', async () => {
    try {
      const response = await fetch('/api/health');
      return response.ok;
    } catch {
      return false;
    }
  });

  monitoring.health.registerCheck('localStorage', async () => {
    try {
      localStorage.setItem('health-check', 'test');
      localStorage.removeItem('health-check');
      return true;
    } catch {
      return false;
    }
  });

  monitoring.logger.info('Monitoring initialized');
}

// Server-side monitoring utilities
export function createRequestLogger(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 15);
  const startTime = Date.now();

  return {
    requestId,
    log: (level: LogEntry['level'], message: string, context?: Record<string, any>) => {
      monitoring.logger[level](message, {
        ...context,
        requestId,
        url: req.url,
        method: req.method,
        userAgent: req.headers.get('user-agent'),
      });
    },
    finish: (statusCode: number) => {
      const duration = Date.now() - startTime;
      monitoring.performance.recordCustomMetric('request_duration', duration);
      monitoring.logger.info(`Request completed: ${req.method} ${req.url}`, {
        requestId,
        statusCode,
        duration,
      });
    },
  };
}
/**
 * 性能监控工具函数
 * 用于监控Web Vitals和应用性能指标
 */

// Web Vitals 类型定义
interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
}

// 性能指标阈值
const PERFORMANCE_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 }
} as const;

/**
 * 获取性能评级
 */
function getPerformanceRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * 发送性能指标到监控服务
 */
function sendToAnalytics(metric: WebVitalMetric) {
  // 在生产环境中，这里可以发送到 Google Analytics, Vercel Analytics 等
  if (process.env.NODE_ENV === 'production') {
    // 示例：发送到 Google Analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        custom_map: {
          metric_rating: metric.rating,
          metric_delta: metric.delta
        }
      });
    }
    
    // 示例：发送到自定义分析端点
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...metric,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    }).catch(console.error);
  }
  
  // 开发环境日志
  console.log('Web Vital:', metric);
}

/**
 * 监控 Web Vitals
 */
export function monitorWebVitals() {
  if (typeof window === 'undefined') return;
  
  // 动态导入 web-vitals 库（如果可用）
  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
    onCLS((metric: any) => {
      const webVital: WebVitalMetric = {
        ...metric,
        rating: getPerformanceRating('CLS', metric.value)
      };
      sendToAnalytics(webVital);
    });
    
    // FID已被INP替代，移除FID监控
    
    onFCP((metric: any) => {
      const webVital: WebVitalMetric = {
        ...metric,
        rating: getPerformanceRating('FCP', metric.value)
      };
      sendToAnalytics(webVital);
    });
    
    onLCP((metric: any) => {
      const webVital: WebVitalMetric = {
        ...metric,
        rating: getPerformanceRating('LCP', metric.value)
      };
      sendToAnalytics(webVital);
    });
    
    onTTFB((metric: any) => {
      const webVital: WebVitalMetric = {
        ...metric,
        rating: getPerformanceRating('TTFB', metric.value)
      };
      sendToAnalytics(webVital);
    });
    
    onINP((metric: any) => {
      const webVital: WebVitalMetric = {
        ...metric,
        rating: getPerformanceRating('INP', metric.value)
      };
      sendToAnalytics(webVital);
    });
  }).catch(console.error);
}

/**
 * 性能计时器类
 */
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number> = new Map();
  
  constructor(private name: string) {
    this.startTime = performance.now();
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-start`);
    }
  }
  
  mark(label: string) {
    const now = performance.now();
    this.marks.set(label, now);
    
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${this.name}-${label}`);
    }
  }
  
  measure(label?: string): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    
    if (typeof window !== 'undefined' && 'performance' in window) {
      const measureName = `${this.name}${label ? `-${label}` : ''}`;
      performance.measure(measureName, `${this.name}-start`);
    }
    
    return duration;
  }
  
  getMarks(): Record<string, number> {
    const result: Record<string, number> = {};
    this.marks.forEach((time, label) => {
      result[label] = time - this.startTime;
    });
    return result;
  }
}

/**
 * 监控资源加载性能
 */
export function monitorResourcePerformance() {
  if (typeof window === 'undefined') return;
  
  // 监控资源加载
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'resource') {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // 记录慢资源
        if (resourceEntry.duration > 1000) {
          console.warn('慢资源加载:', {
            name: resourceEntry.name,
            duration: resourceEntry.duration,
            size: resourceEntry.transferSize,
            type: resourceEntry.initiatorType
          });
        }
      }
    });
  });
  
  observer.observe({ entryTypes: ['resource'] });
}

/**
 * 监控长任务
 */
export function monitorLongTasks() {
  if (typeof window === 'undefined') return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.warn('检测到长任务:', {
          duration: entry.duration,
          startTime: entry.startTime,
          name: entry.name
        });
      });
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    // 某些浏览器可能不支持 longtask
    console.log('浏览器不支持长任务监控');
  }
}

/**
 * 内存使用监控
 */
export function monitorMemoryUsage() {
  if (typeof window === 'undefined') return;
  
  const checkMemory = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryInfo = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      };
      
      // 内存使用率超过80%时警告
      if (memoryInfo.used / memoryInfo.limit > 0.8) {
        console.warn('内存使用率过高:', memoryInfo);
      }
      
      return memoryInfo;
    }
    return null;
  };
  
  // 每30秒检查一次内存使用
  setInterval(checkMemory, 30000);
  
  return checkMemory;
}

/**
 * 初始化所有性能监控
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;
  
  // 等待页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        monitorWebVitals();
        monitorResourcePerformance();
        monitorLongTasks();
        monitorMemoryUsage();
      }, 1000);
    });
  } else {
    setTimeout(() => {
      monitorWebVitals();
      monitorResourcePerformance();
      monitorLongTasks();
      monitorMemoryUsage();
    }, 1000);
  }
}
/**
 * 性能优化工具库
 * 提供图片懒加载、代码分割、缓存策略等功能
 */

import { ComponentType, lazy, LazyExoticComponent } from 'react';

// 图片懒加载配置
export const imageLoadingConfig = {
  // 交叉观察器选项
  intersectionObserverOptions: {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
  },
  // 图片占位符
  placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjY2NjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4=',
};

// 代码分割工具
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
): LazyExoticComponent<T> {
  return lazy(importFn);
}

// 预加载组件
export function preloadComponent(importFn: () => Promise<any>): void {
  if (typeof window !== 'undefined') {
    // 在浏览器环境中预加载
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    importFn().then(() => {
      // 预加载完成
    }).catch(() => {
      // 预加载失败，忽略错误
    });
  }
}

// 缓存策略
export class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  // 设置缓存
  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // 获取缓存
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // 清除过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // 清除所有缓存
  clear(): void {
    this.cache.clear();
  }
}

// 全局缓存实例
export const globalCache = new CacheManager();

// 性能监控
export class PerformanceMonitor {
  private metrics: { [key: string]: number } = {};

  // 开始计时
  start(name: string): void {
    this.metrics[`${name}_start`] = performance.now();
  }

  // 结束计时
  end(name: string): number {
    const startTime = this.metrics[`${name}_start`];
    if (startTime === undefined) {
      console.warn(`Performance metric "${name}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics[name] = duration;
    delete this.metrics[`${name}_start`];

    return duration;
  }

  // 获取指标
  getMetric(name: string): number | undefined {
    return this.metrics[name];
  }

  // 获取所有指标
  getAllMetrics(): { [key: string]: number } {
    return { ...this.metrics };
  }

  // 清除指标
  clear(): void {
    this.metrics = {};
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// Web Vitals 监控
export function reportWebVitals(metric: any): void {
  if (process.env.NODE_ENV === 'production') {
    // 在生产环境中发送指标到分析服务
    console.log('Web Vital:', metric);
    
    // 可以集成 Google Analytics 或其他分析服务
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
      });
    }
  }
}

// 资源预加载
export function preloadResource(href: string, as: string = 'script'): void {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }
}

// 图片预加载
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// 批量图片预加载
export async function preloadImages(srcs: string[]): Promise<void> {
  const promises = srcs.map(src => preloadImage(src));
  await Promise.all(promises);
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 内存使用监控
export function getMemoryUsage(): any {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    return (performance as any).memory;
  }
  return null;
}

// 网络状态监控
export function getNetworkInfo(): any {
  if (typeof window !== 'undefined' && 'connection' in navigator) {
    return (navigator as any).connection;
  }
  return null;
}
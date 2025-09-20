'use client';

import React, { Suspense } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { createLazyComponent } from '@/lib/performance';

// 通用加载骨架屏
interface SkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
}

export function Skeleton({ className = '', lines = 3, height = 'h-4' }: SkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded ${height} mb-2 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

// 卡片骨架屏
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
      <div className="space-y-2">
        <div className="bg-gray-200 rounded h-4 w-3/4"></div>
        <div className="bg-gray-200 rounded h-4 w-1/2"></div>
        <div className="bg-gray-200 rounded h-4 w-2/3"></div>
      </div>
    </div>
  );
}

// 列表骨架屏
export function ListSkeleton({ 
  items = 5, 
  className = '' 
}: { 
  items?: number; 
  className?: string; 
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="animate-pulse flex space-x-4">
          <div className="bg-gray-200 rounded-full h-12 w-12"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="bg-gray-200 rounded h-4 w-3/4"></div>
            <div className="bg-gray-200 rounded h-4 w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 错误回退组件
function LazyErrorFallback({ 
  error, 
  resetErrorBoundary 
}: FallbackProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex items-center">
        <svg 
          className="h-5 w-5 text-red-500 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
        <span className="text-sm text-red-700">组件加载失败</span>
        <button
          onClick={resetErrorBoundary}
          className="ml-auto text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
        >
          重试
        </button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-2">
          <summary className="text-xs text-red-600 cursor-pointer">错误详情</summary>
          <pre className="text-xs text-red-600 mt-1 overflow-auto">
            {error.message}
          </pre>
        </details>
      )}
    </div>
  );
}

// 懒加载组件包装器
interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<FallbackProps>;
  className?: string;
}

export function LazyComponentWrapper({
  children,
  fallback: FallbackComponent = Skeleton,
  errorFallback = LazyErrorFallback,
  className = '',
}: LazyComponentWrapperProps) {
  return (
    <ErrorBoundary
      FallbackComponent={errorFallback as any}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={<FallbackComponent />}>
        <div className={className}>
          {children}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

// 创建懒加载组件的高阶函数
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  options: {
    fallback?: React.ComponentType;
    errorFallback?: React.ComponentType<FallbackProps>;
    displayName?: string;
  } = {}
) {
  const LazyComponent = createLazyComponent(importFn);
  
  const WrappedComponent = (props: P) => (
    <LazyComponentWrapper
      fallback={options.fallback}
      errorFallback={options.errorFallback}
    >
      <LazyComponent {...props as any} />
    </LazyComponentWrapper>
  );

  WrappedComponent.displayName = options.displayName || 'LazyComponent';
  
  return WrappedComponent;
}

// 动态导入工具
export function dynamicImport<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(importFn);
}

export default LazyComponentWrapper;
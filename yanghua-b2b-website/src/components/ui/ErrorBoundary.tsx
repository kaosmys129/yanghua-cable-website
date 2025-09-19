'use client';

import * as React from 'react';
import { ErrorInfo } from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// 错误报告函数
async function reportError(error: Error, errorInfo?: ErrorInfo) {
  if (process.env.NODE_ENV === 'production') {
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('userId') || 'anonymous',
      };

      await fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }
}

function GlobalErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // 报告错误
  React.useEffect(() => {
    reportError(error);
  }, [error]);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          出现了一些问题
        </h2>
        <p className="text-gray-600 mb-6">
          很抱歉，页面遇到了错误。我们已经记录了这个问题，请尝试刷新页面或返回首页。
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
              错误详情 (开发模式)
            </summary>
            <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
              <div className="mb-2">
                <strong>错误:</strong> {error.message}
              </div>
              {error.stack && (
                <div className="mb-2">
                  <strong>堆栈跟踪:</strong>
                  <pre className="whitespace-pre-wrap">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}
        
        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full bg-[#fdb827] text-[#212529] px-4 py-2 rounded-lg font-medium hover:bg-[#fdb827]/90 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handleReload}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              刷新页面
            </button>
            <button
              onClick={handleGoHome}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-1" />
              返回首页
            </button>
          </div>
        </div>

        {process.env.NODE_ENV === 'production' && (
          <p className="text-xs text-gray-500 mt-4">
            错误已自动报告给我们的技术团队
          </p>
        )}
      </div>
    </div>
  );
}

// 自定义错误处理函数
function handleError(error: Error, errorInfo: ErrorInfo) {
  console.error('ErrorBoundary caught an error:', error, errorInfo);
  reportError(error, errorInfo);
}

const ErrorBoundary = ({ 
  children, 
  fallback,
  onError = handleError 
}: { 
  children: React.ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={(fallback || GlobalErrorFallback) as any}
      onError={onError}
      onReset={() => {
        // 清除可能的错误状态
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }}
    >
      {children as any}
    </ReactErrorBoundary>
  );
};

// 高阶组件包装器
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: {
    fallback?: React.ComponentType<FallbackProps>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error handling in functional components
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    reportError(error, errorInfo);
  }, []);
}

export default ErrorBoundary;
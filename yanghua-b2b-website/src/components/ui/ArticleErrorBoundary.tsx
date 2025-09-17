'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logError } from '@/lib/errorLogger';

interface ArticleErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ArticleErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void }>;
}

class ArticleErrorBoundary extends React.Component<
  ArticleErrorBoundaryProps,
  ArticleErrorBoundaryState
> {
  constructor(props: ArticleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ArticleErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('Article Error Boundary caught an error', error);
    console.error('Article Error Boundary:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, retry }: { error?: Error; retry?: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">
          {error?.message || 'An unexpected error occurred while loading the content.'}
        </p>
        {retry && (
          <button
            onClick={retry}
            className="inline-flex items-center px-4 py-2 bg-[#fdb827] text-white rounded-lg hover:bg-[#e6a623] transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// Specific error fallback for article lists
export function ArticleListErrorFallback({ error, retry }: { error?: Error; retry?: () => void }) {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#212529] mb-2">Unable to Load Articles</h2>
          <p className="text-[#6c757d] mb-6">
            {error?.message || "We're having trouble loading the articles. Please try again later."}
          </p>
          {retry && (
            <button
              onClick={retry}
              className="inline-flex items-center px-6 py-3 bg-[#fdb827] text-white rounded-lg hover:bg-[#e6a623] transition-colors duration-200 font-medium"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Retry Loading
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

// Specific error fallback for single articles
export function ArticleDetailErrorFallback({ 
  error, 
  retry, 
  backUrl = '/articles' 
}: { 
  error?: Error; 
  retry?: () => void; 
  backUrl?: string; 
}) {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#212529] mb-2">Article Not Available</h2>
          <p className="text-[#6c757d] mb-6">
            {error?.message || "The article you're looking for is currently unavailable."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {retry && (
              <button
                onClick={retry}
                className="inline-flex items-center px-6 py-3 bg-[#fdb827] text-white rounded-lg hover:bg-[#e6a623] transition-colors duration-200 font-medium"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </button>
            )}
            <a
              href={backUrl}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Back to Articles
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

// Loading state components
export function ArticleListSkeleton() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="h-12 bg-gray-200 rounded-lg w-96 mx-auto mb-4 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded-lg w-2/3 mx-auto animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="h-48 bg-gray-200 animate-pulse"></div>
            <div className="p-6">
              <div className="flex items-center mb-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse mr-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded mb-3 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="flex justify-between">
                <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
        <div className="h-12 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
        <div className="w-full h-96 bg-gray-200 rounded-lg mb-8"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    </main>
  );
}

export default ArticleErrorBoundary;
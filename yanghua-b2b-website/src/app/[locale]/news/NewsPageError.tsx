'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface NewsPageErrorProps {
  error: string;
  onRetry: () => void;
}

export default function NewsPageError({ error, onRetry }: NewsPageErrorProps) {
  const t = useTranslations('errors');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t('news.title', { defaultValue: 'Failed to Load News' })}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {t('news.message', { defaultValue: 'We encountered an error while loading the news articles. Please try again.' })}
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-4 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Technical Details
            </summary>
            <pre className="text-xs mt-2 p-2 bg-gray-100 rounded text-red-600 overflow-auto">
              {error}
            </pre>
          </details>
        )}
        
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('news.retry', { defaultValue: 'Try Again' })}
        </button>
        
        <div className="mt-4">
          <a
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {t('news.goHome', { defaultValue: 'Go to Homepage' })}
          </a>
        </div>
      </div>
    </div>
  );
}
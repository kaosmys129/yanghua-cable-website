'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, RefreshCw, Building2 } from 'lucide-react';

interface ProjectsPageErrorProps {
  error: string;
  onRetry: () => void;
}

export default function ProjectsPageError({ error, onRetry }: ProjectsPageErrorProps) {
  const t = useTranslations('errors');

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Building2 className="h-12 w-12 text-gray-300" />
            <AlertCircle className="h-6 w-6 text-red-500 absolute -top-1 -right-1" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t('projects.title', { defaultValue: 'Failed to Load Projects' })}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {t('projects.message', { defaultValue: 'We encountered an error while loading the project data. Please try again.' })}
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
          className="inline-flex items-center px-4 py-2 bg-[#fdb827] text-white rounded-md hover:bg-[#e6a625] transition-colors mb-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('projects.retry', { defaultValue: 'Try Again' })}
        </button>
        
        <div>
          <a
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {t('projects.goHome', { defaultValue: 'Go to Homepage' })}
          </a>
        </div>
      </div>
    </div>
  );
}
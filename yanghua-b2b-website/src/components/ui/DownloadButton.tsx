'use client';

import { useState } from 'react';
import { downloadPDF } from '@/lib/utils';
import { getDownloadResource, getLocalizedResource } from '@/lib/download-config';

interface DownloadButtonProps {
  resourceId: string;
  className?: string;
  locale: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  showIcon?: boolean;
}

export default function DownloadButton({ 
  resourceId, 
  className = '', 
  locale, 
  children,
  variant = 'secondary',
  showIcon = true
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      const resource = getDownloadResource(resourceId);
      if (!resource) {
        console.error(`Resource not found: ${resourceId}`);
        return;
      }
      
      const currentLanguage = locale as 'en' | 'es';
      const localizedResource = getLocalizedResource(resource, currentLanguage);
      
      const success = await downloadPDF({
        fileName: localizedResource.fileName,
        filePath: localizedResource.downloadPath,
        category: resource.category,
        language: currentLanguage,
        fileSize: resource.fileSize,
        description: localizedResource.description
      });
      
      if (!success) {
        console.error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#fdb827] hover:bg-[#e6a51e] text-[#212529] border-[#fdb827]';
      case 'secondary':
      default:
        return 'bg-transparent border-2 border-current hover:bg-current hover:text-white';
    }
  };

  const baseClasses = `${getVariantClasses()} font-semibold py-3 px-8 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`;

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={`${baseClasses} ${className}`}
    >
      {isDownloading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span>Downloading...</span>
        </>
      ) : (
        <>
          {showIcon && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {children}
        </>
      )}
    </button>
  );
}
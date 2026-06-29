'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { downloadPDF } from '@/lib/utils';
import { getDownloadResource, getLocalizedResource } from '@/lib/download-config';
import { Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SolutionDownloadButtonProps {
  solutionId: string;
  locale: string;
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'brand';
}

export default function SolutionDownloadButton({
  solutionId,
  locale,
  className,
  children,
  variant = 'outline',
}: SolutionDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    try {
      const resourceId = getResourceIdBySolutionId(solutionId);
      const resource = getDownloadResource(resourceId);

      if (!resource) {
        console.error(`Resource not found for solution: ${solutionId}`);
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
        description: localizedResource.description,
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

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      variant={variant}
      size="lg"
      className={cn('gap-2', className)}
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          {children || 'Download PDF'}
        </>
      )}
    </Button>
  );
}

function getResourceIdBySolutionId(solutionId: string): string {
  return 'flexible-busbar-solution';
}

'use client';

import React, { useState } from 'react';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  category?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fallbackSrc?: string;
  placeholder?: string;
  blurDataURL?: string;
}

export default function ResponsiveImage({
  src,
  alt,
  category = 'general',
  className = '',
  loading = 'lazy',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onLoad,
  onError,
  fallbackSrc,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
  blurDataURL
}: ResponsiveImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = (error: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    setIsLoading(false);
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      return;
    }
    
    const errorObj = new Error(`Failed to load image: ${currentSrc}`);
    onError?.(errorObj);
  };

  if (hasError && !fallbackSrc) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        loading={loading}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
    </div>
  );
}

// Simplified HOC
export function withResponsiveImage<P extends { src: string; alt: string }>(
  WrappedComponent: React.ComponentType<P>
) {
  return function ResponsiveImageWrapper(props: P) {
    return <WrappedComponent {...props} />;
  };
}

// Simplified hooks
export function useImagePreload(src: string, priority: boolean = false) {
  return { isLoaded: true, error: null };
}

export function useLazyImage(ref: React.RefObject<HTMLElement>) {
  return { isVisible: true };
}
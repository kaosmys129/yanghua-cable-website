'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  detectImageFormatSupport, 
  getBrowserInfo, 
  getAdaptiveQuality,
  getDevicePixelRatio,
  createImageObserver
} from '@/lib/browser-compatibility';
import { useImageErrorLogger } from '@/lib/image-error-logger';

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

interface ImageSource {
  srcSet: string;
  type: string;
  sizes?: string;
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
  const [imageSources, setImageSources] = useState<ImageSource[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority || loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 生成不同格式和尺寸的图片源
  const generateImageSources = async () => {
    try {
      const support = await detectImageFormatSupport();
      const browserInfo = getBrowserInfo();
      const quality = getAdaptiveQuality();
      const pixelRatio = getDevicePixelRatio();
      
      const baseName = src.replace(/\.[^.]+$/, '');
      const sources: ImageSource[] = [];
      
      // 定义尺寸断点
      const breakpoints = [
        { width: 320, suffix: 'small' },
        { width: 640, suffix: 'medium' },
        { width: 1024, suffix: 'large' },
        { width: 1920, suffix: 'xlarge' }
      ];
      
      // 根据设备像素比调整尺寸
      const adjustedBreakpoints = breakpoints.map(bp => ({
        ...bp,
        width: Math.round(bp.width * Math.min(pixelRatio, 2)) // 限制最大2x
      }));
      
      // 生成WebP源（如果支持）
      if (support.webp) {
        const webpSrcSet = adjustedBreakpoints.map(bp => 
          `${baseName}-${bp.suffix}.webp ${bp.width}w`
        ).join(', ');
        
        sources.push({
          srcSet: webpSrcSet,
          type: 'image/webp',
          sizes
        });
      }
      
      // 生成AVIF源（如果支持）
      if (support.avif) {
        const avifSrcSet = adjustedBreakpoints.map(bp => 
          `${baseName}-${bp.suffix}.avif ${bp.width}w`
        ).join(', ');
        
        sources.unshift({ // AVIF优先级最高
          srcSet: avifSrcSet,
          type: 'image/avif',
          sizes
        });
      }
      
      // 生成JPEG回退源
      const jpegSrcSet = adjustedBreakpoints.map(bp => 
        `${baseName}-${bp.suffix}.jpg ${bp.width}w`
      ).join(', ');
      
      sources.push({
        srcSet: jpegSrcSet,
        type: 'image/jpeg',
        sizes
      });
      
      setImageSources(sources);
    } catch (error) {
      console.warn('Failed to generate image sources:', error);
      // 回退到原始图片
      setImageSources([{
        srcSet: src,
        type: 'image/jpeg'
      }]);
    }
  };

  // 设置懒加载观察器
  useEffect(() => {
    if (loading === 'lazy' && !priority && imgRef.current) {
      observerRef.current = createImageObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setIsInView(true);
              if (observerRef.current && entry.target) {
                observerRef.current.unobserve(entry.target);
              }
            }
          });
        },
        {
          rootMargin: '50px'
        }
      );

      if (observerRef.current) {
        observerRef.current.observe(imgRef.current);
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, priority]);

  // 初始化图片源
  useEffect(() => {
    if (isInView) {
      generateImageSources();
    }
  }, [isInView, src, sizes]);

  // 处理图片加载成功
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  // 错误日志记录器
  const { logLoadFailure } = useImageErrorLogger();
  
  // 处理图片加载失败
  const handleError = () => {
    setHasError(true);
    const error = new Error(`Failed to load image: ${src}`);
    
    // 记录错误日志
    logLoadFailure(src, error, {
      category,
      component: 'ResponsiveImage',
      retryCount: 0
    });
    
    onError?.(error);
    
    // 尝试加载回退图片
    if (fallbackSrc && imgRef.current) {
      imgRef.current.src = fallbackSrc;
    }
  };

  // 获取默认图片源
  const getDefaultSrc = () => {
    if (hasError && fallbackSrc) {
      return fallbackSrc;
    }
    
    if (!isInView) {
      return placeholder;
    }
    
    // 使用中等尺寸的JPEG作为默认源
    const baseName = src.replace(/\.[^.]+$/, '');
    return `${baseName}-medium.jpg`;
  };

  // 预加载关键图片
  useEffect(() => {
    if (priority && imageSources.length > 0) {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'image';
      preloadLink.href = getDefaultSrc();
      
      if (imageSources[0]?.type) {
        preloadLink.type = imageSources[0].type;
      }
      
      document.head.appendChild(preloadLink);
      
      return () => {
        if (document.head.contains(preloadLink)) {
          document.head.removeChild(preloadLink);
        }
      };
    }
  }, [priority, imageSources]);

  return (
    <picture className={`responsive-image ${className}`}>
      {/* 渲染不同格式的源 */}
      {isInView && imageSources.map((source, index) => (
        <source
          key={index}
          srcSet={source.srcSet}
          type={source.type}
          sizes={source.sizes || sizes}
        />
      ))}
      
      {/* 主图片元素 */}
      <img
        ref={imgRef}
        src={getDefaultSrc()}
        alt={alt}
        className={`
          transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${hasError ? 'opacity-50' : ''}
        `}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* 加载状态指示器 */}
      {!isLoaded && !hasError && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">图片加载失败</p>
          </div>
        </div>
      )}
    </picture>
  );
}

// 高阶组件：为现有图片添加响应式支持
export function withResponsiveImage<P extends { src: string; alt: string }>(
  WrappedComponent: React.ComponentType<P>
) {
  return function ResponsiveImageWrapper(props: P & Partial<ResponsiveImageProps>) {
    const { src, alt, ...restProps } = props;
    
    return (
      <ResponsiveImage
        src={src}
        alt={alt}
        {...restProps}
      />
    );
  };
}

// 图片预加载Hook
export function useImagePreload(src: string, priority: boolean = false) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!priority) return;

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setError(null);
    };
    
    img.onerror = () => {
      setError(new Error(`Failed to preload image: ${src}`));
    };
    
    img.src = src;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, priority]);

  return { isLoaded, error };
}

// 图片懒加载Hook
export function useLazyImage(ref: React.RefObject<HTMLElement>) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = createImageObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer?.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '100px' }
    );

    if (observer) {
      observer.observe(element);
    }

    return () => {
      observer?.disconnect();
    };
  }, [ref]);

  return isInView;
}
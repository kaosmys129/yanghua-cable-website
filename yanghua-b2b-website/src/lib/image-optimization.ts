/**
 * 图片优化配置和工具函数
 */

import { ImageProps } from 'next/image';

// 图片质量配置
export const IMAGE_QUALITY = {
  thumbnail: 60,
  medium: 75,
  high: 85,
  original: 95
} as const;

// 响应式图片尺寸
export const IMAGE_SIZES = {
  mobile: '(max-width: 768px) 100vw',
  tablet: '(max-width: 1024px) 50vw',
  desktop: '33vw'
} as const;

// 常用图片尺寸预设
export const IMAGE_DIMENSIONS = {
  thumbnail: { width: 150, height: 150 },
  card: { width: 300, height: 200 },
  hero: { width: 1200, height: 600 },
  banner: { width: 1920, height: 400 },
  product: { width: 800, height: 600 }
} as const;

/**
 * 生成优化的图片属性
 */
export function getOptimizedImageProps(
  src: string,
  alt: string,
  preset: keyof typeof IMAGE_DIMENSIONS,
  options: Partial<ImageProps> = {}
): ImageProps {
  const dimensions = IMAGE_DIMENSIONS[preset];
  
  return {
    src,
    alt,
    width: dimensions.width,
    height: dimensions.height,
    quality: IMAGE_QUALITY.high,
    placeholder: 'blur',
    blurDataURL: generateBlurDataURL(dimensions.width, dimensions.height),
    sizes: `${IMAGE_SIZES.mobile}, ${IMAGE_SIZES.tablet}, ${IMAGE_SIZES.desktop}`,
    priority: false,
    ...options
  };
}

/**
 * 生成模糊占位符数据URL
 */
function generateBlurDataURL(width: number, height: number): string {
  const canvas = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
}

/**
 * 检查图片URL是否为外部链接
 */
export function isExternalImage(src: string): boolean {
  return src.startsWith('http://') || src.startsWith('https://');
}

/**
 * 获取图片的CDN优化URL（如果使用CDN）
 */
export function getCDNImageUrl(
  src: string,
  width?: number,
  height?: number,
  quality?: number
): string {
  // 如果是外部图片，直接返回
  if (isExternalImage(src)) {
    return src;
  }

  // 这里可以根据实际使用的CDN服务进行配置
  // 例如：Cloudinary, ImageKit, 或其他图片CDN服务
  const baseUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
  
  if (!baseUrl) {
    return src;
  }

  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (quality) params.set('q', quality.toString());

  const queryString = params.toString();
  return `${baseUrl}${src}${queryString ? `?${queryString}` : ''}`;
}

/**
 * 图片加载错误处理
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  
  // 设置默认占位图片
  img.src = '/images/placeholder.svg';
  img.alt = '图片加载失败';
  
  console.warn('图片加载失败:', img.dataset.originalSrc || img.src);
}

/**
 * 预加载关键图片
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 批量预加载图片
 */
export async function preloadImages(srcs: string[]): Promise<void> {
  try {
    await Promise.all(srcs.map(preloadImage));
  } catch (error) {
    console.warn('部分图片预加载失败:', error);
  }
}

/**
 * 图片懒加载观察器配置
 */
export const INTERSECTION_OBSERVER_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: '50px',
  threshold: 0.1
};
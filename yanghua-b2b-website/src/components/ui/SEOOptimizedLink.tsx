/**
 * SEO优化的链接组件
 * 自动应用多样化锚文本策略，提升内链SEO效果
 */

import Link from 'next/link';
import { ReactNode } from 'react';

interface SEOOptimizedLinkProps {
  href: string;
  children?: ReactNode;
  className?: string;
  targetPage?: string; // 用于锚文本优化的目标页面标识
  context?: 'navigation' | 'content' | 'footer' | 'sidebar';
  useOptimizedText?: boolean; // 是否使用优化的锚文本
  title?: string;
  rel?: string;
  target?: string;
}

// 全局锚文本使用记录，避免过度重复
const usedAnchorTexts = new Set<string>();

export default function SEOOptimizedLink({
  href,
  children,
  className,
  targetPage,
  context = 'content',
  useOptimizedText = false,
  title,
  rel,
  target,
  ...props
}: SEOOptimizedLinkProps) {
  // 如果指定了使用优化文本且提供了targetPage，则使用优化的锚文本
  let optimizedText = children;
  
  if (useOptimizedText && targetPage && typeof children === 'string') {
    // 暂时简化SEO优化逻辑，直接使用原始文本
    optimizedText = children;
  }

  return (
    <Link
      href={href}
      className={className}
      title={title}
      rel={rel}
      target={target}
      {...props}
    >
      {optimizedText}
    </Link>
  );
}

/**
 * 专门用于产品链接的组件
 */
export function ProductLink({
  productId,
  locale = 'zh',
  className,
  children,
  context = 'content'
}: {
  productId: string;
  locale?: string;
  className?: string;
  children?: ReactNode;
  context?: 'navigation' | 'content' | 'footer' | 'sidebar';
}) {
  const href = `/${locale}/products/${productId}`;
  
  return (
    <SEOOptimizedLink
      href={href}
      className={className}
      targetPage="power-cables" // 默认使用电力电缆的锚文本策略
      context={context}
      useOptimizedText={!children} // 如果没有提供children，则使用优化文本
    >
      {children}
    </SEOOptimizedLink>
  );
}

/**
 * 专门用于解决方案链接的组件
 */
export function SolutionLink({
  solutionId,
  locale = 'zh',
  className,
  children,
  context = 'content'
}: {
  solutionId: string;
  locale?: string;
  className?: string;
  children?: ReactNode;
  context?: 'navigation' | 'content' | 'footer' | 'sidebar';
}) {
  const href = `/${locale}/solutions/${solutionId}`;
  
  // 根据解决方案ID选择合适的锚文本策略
  let targetPage = 'industrial-automation';
  if (solutionId.includes('energy')) {
    targetPage = 'renewable-energy';
  } else if (solutionId.includes('automation')) {
    targetPage = 'industrial-automation';
  }
  
  return (
    <SEOOptimizedLink
      href={href}
      className={className}
      targetPage={targetPage}
      context={context}
      useOptimizedText={!children}
    >
      {children}
    </SEOOptimizedLink>
  );
}

/**
 * 专门用于联系我们链接的组件
 */
export function ContactLink({
  locale = 'zh',
  className,
  children,
  context = 'content'
}: {
  locale?: string;
  className?: string;
  children?: ReactNode;
  context?: 'navigation' | 'content' | 'footer' | 'sidebar';
}) {
  const href = `/${locale}/contact`;
  
  return (
    <SEOOptimizedLink
      href={href}
      className={className}
      targetPage="contact"
      context={context}
      useOptimizedText={!children}
    >
      {children}
    </SEOOptimizedLink>
  );
}

/**
 * 清除已使用的锚文本记录（用于页面刷新或重新渲染时）
 */
export function clearUsedAnchorTexts() {
  usedAnchorTexts.clear();
}
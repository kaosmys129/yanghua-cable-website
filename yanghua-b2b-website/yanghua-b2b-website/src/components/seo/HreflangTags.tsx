'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { generateHreflangAlternates } from '@/lib/seo';
import { Locale } from '@/lib/i18n';

/**
 * Hreflang标签组件
 * 用于在页面头部生成正确的hreflang标签，告诉搜索引擎不同语言版本页面的关系
 */
export default function HreflangTags() {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  
  // 移除语言前缀，获取纯路径
  const cleanPath = pathname.replace(`/${locale}`, '') || '/';
  
  // 生成hreflang链接
  const hreflangLinks = generateHreflangAlternates(cleanPath, locale);
  
  return (
    <>
      {hreflangLinks.map((link) => (
        <link
          key={link.hreflang}
          rel="alternate"
          hrefLang={link.hreflang}
          href={link.href}
        />
      ))}
    </>
  );
}

/**
 * 服务器端Hreflang生成器
 * 用于在服务器端组件中生成hreflang metadata
 */
export function generateHreflangMetadata(currentPath: string, currentLocale: Locale) {
  const hreflangLinks = generateHreflangAlternates(currentPath, currentLocale);
  
  const languages: Record<string, string> = {};
  
  hreflangLinks.forEach((link) => {
    if (link.hreflang === 'x-default') {
      // x-default 在 Next.js metadata 中不需要特殊处理
      return;
    }
    languages[link.hreflang] = link.href;
  });
  
  return {
    languages,
    canonical: hreflangLinks.find(link => link.hreflang === currentLocale)?.href
  };
}
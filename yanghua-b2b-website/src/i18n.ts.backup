import { getRequestConfig } from 'next-intl/server';

// 支持的语言
export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

// 语言标签映射
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  es: 'Español'
};

// 语言方向配置
export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  es: 'ltr'
};

// 配置函数
export default getRequestConfig(async ({ locale }) => {
  // 验证语言是否支持
  const activeLocale = (locales.includes(locale as any) ? locale : defaultLocale) as string;
  
  try {
    // 动态导入语言包
    const messages = (await import(`./messages/${activeLocale}.json`)).default;
    
    return {
      locale: activeLocale,
      messages,
      timeZone: 'UTC',
      now: new Date()
    };
  } catch (error) {
    // 如果语言包不存在，回退到默认语言
    console.warn(`Language pack for ${activeLocale} not found, falling back to ${defaultLocale}`);
    
    const fallbackMessages = (await import(`./messages/${defaultLocale}.json`)).default;
    
    return {
      locale: defaultLocale,
      messages: fallbackMessages,
      timeZone: 'UTC',
      now: new Date()
    };
  }
});

// 工具函数：获取语言显示名称
export function getLocaleLabel(locale: string): string {
  return localeLabels[locale as Locale] || locale;
}

// 工具函数：检查是否为支持的语言
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// 工具函数：获取语言方向
export function getLocaleDirection(locale: string): 'ltr' | 'rtl' {
  return localeDirections[locale as Locale] || 'ltr';
}
import { getRequestConfig } from 'next-intl/server';
// import { notFound } from 'next/navigation';

// Can be imported from a shared config
export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const activeLocale = (locales.includes(locale as any) ? locale : 'en') as string;

  return {
    locale: activeLocale,
    messages: (await import(`../messages/${activeLocale}.json`)).default
  };
});

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export const defaultLocale: Locale = 'en';
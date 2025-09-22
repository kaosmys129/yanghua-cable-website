import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'es'] as const;
export const defaultLocale = 'en' as const;

export default getRequestConfig(async ({ locale }) => {
  const validatedLocale = locales.find((l) => l === locale) || defaultLocale;

  return {
    locale: validatedLocale,
    messages: (await import(`./src/messages/${validatedLocale}.json`)).default,
  };
});
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { locales, defaultLocale } from '../../lib/i18n';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import DebugPanel from '../../components/ui/DebugPanel';
import { generateHreflangAlternatesForMetadata, generateCanonicalUrl } from '../../lib/seo';
import { Locale } from '../../lib/i18n';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// 动态生成每个语言版本的metadata，包括hreflang标签
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const currentPath = '/'; // 这是根布局，对应首页
  
  // 生成hreflang alternates
  const hreflangAlternates = generateHreflangAlternatesForMetadata(currentPath, locale as Locale);
  
  // 生成canonical URL
  const canonical = generateCanonicalUrl(currentPath, locale as Locale);
  
  return {
    alternates: {
      canonical,
      languages: hreflangAlternates.languages,
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  // Debug log
  console.log('[LocaleLayout] params:', params);
  
  // Load network debugging script in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Validate that the incoming `locale` parameter is valid
  const isValid = locales.includes(locale as any);
  if (!isValid) {
    console.warn('[LocaleLayout] Invalid locale detected:', locale, 'allowed:', locales);
  }
  const activeLocale = (isValid ? (locale as any) : defaultLocale) as typeof locales[number];

  // Load messages manually to avoid throwing notFound from next-intl during debugging
  const messages = (await import(`../../messages/${activeLocale}.json`)).default;

  return (
    <NextIntlClientProvider locale={activeLocale} messages={messages}>
      <ErrorBoundary>
        <Header />
        <main>{children}</main>
        <Footer />
      </ErrorBoundary>
      <DebugPanel />
      {/* Load network debugging script in development */}
      {isDevelopment && (
        <script src="/debug-network.js" />
      )}
    </NextIntlClientProvider>
  );
}
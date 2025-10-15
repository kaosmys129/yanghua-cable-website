import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, defaultLocale } from '../../lib/i18n';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import DebugPanel from '../../components/ui/DebugPanel';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
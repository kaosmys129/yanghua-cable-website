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
import { DEFAULT_METADATA, SITE_CONFIG } from '../../lib/seo-config';

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
  
  // 根据语言设置标题和描述
  const title = locale === 'es' 
    ? 'Yanghua Cable - Soluciones de Cables'
    : 'Yanghua Cable - Cable Solutions';
    
  const description = locale === 'es'
    ? 'Fabricante líder de cables de alta calidad para aplicaciones industriales, comerciales y residenciales.'
    : 'Leading manufacturer of high-quality cables for industrial, commercial, and residential applications.';
  
  return {
    title: {
      default: title,
      template: `%s | Yanghua Cable`
    },
    description,
    keywords: locale === 'es' 
      ? ['fabricante de cables', 'soluciones de alambre', 'cables industriales', 'cables eléctricos', 'yanghua cable', 'proveedor de cables']
      : ['cable manufacturer', 'wire solutions', 'industrial cables', 'electrical cables', 'yanghua cable', 'cable supplier'],
    authors: [{ name: 'Yanghua Cable Co., Ltd.' }],
    creator: 'Yanghua Cable Co., Ltd.',
    publisher: 'Yanghua Cable Co., Ltd.',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      url: canonical,
      title,
      description,
      siteName: 'Yanghua Cable',
      images: [
        {
          url: '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/og-image.jpg'],
    },
    alternates: {
      canonical,
      languages: hreflangAlternates,
    },
    viewport: 'width=device-width, initial-scale=1',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
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
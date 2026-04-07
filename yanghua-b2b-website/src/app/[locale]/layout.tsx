import { NextIntlClientProvider } from 'next-intl';
import type { Metadata, Viewport } from 'next';
import { locales, defaultLocale } from '../../lib/i18n';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import DebugPanel from '../../components/ui/DebugPanel';
import { generateHreflangAlternatesForMetadata, generateCanonicalUrl } from '../../lib/seo';
import { Locale } from '../../lib/i18n';
import { contentRepository } from '@/lib/content-repository';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// 动态生成每个语言版本的metadata，包括hreflang标签
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const currentPath = '/'; // 这是根布局，对应首页
  const siteSettings = contentRepository.getSiteSettings<any>();
  const localeSeo = siteSettings?.seo?.locales?.[locale] || siteSettings?.seo?.locales?.en || {};
  
  // 生成hreflang alternates
  const hreflangAlternates = generateHreflangAlternatesForMetadata(currentPath, locale as Locale);
  
  // 生成canonical URL
  const canonical = generateCanonicalUrl(currentPath, locale as Locale);
  
  // 根据语言设置标题和描述
  const title = localeSeo.defaultTitle || siteSettings?.seo?.locales?.en?.defaultTitle || 'Yanghua Cable - Cable Solutions';
  const description =
    localeSeo.defaultDescription ||
    siteSettings?.seo?.locales?.en?.defaultDescription ||
    'Leading manufacturer of high-quality cables for industrial, commercial, and residential applications.';
  const siteName = siteSettings?.siteName || 'Yanghua Cable';
  const author = siteSettings?.seo?.author || 'Yanghua Cable Co., Ltd.';
  const ogImage = siteSettings?.seo?.defaultOgImage || '/images/og-image.jpg';
  const keywords = localeSeo.keywords || siteSettings?.seo?.defaultKeywords || [];
  const ogLocale = localeSeo.locale || (locale === 'es' ? 'es_ES' : 'en_US');
  
  return {
    title: {
      default: title,
      template: `%s | ${siteName}`
    },
    description,
    keywords,
    authors: [{ name: author }],
    creator: author,
    publisher: author,
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
      locale: ogLocale,
      url: canonical,
      title,
      description,
      siteName,
      images: [
        {
          url: ogImage,
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
      images: [ogImage],
    },
    alternates: {
      canonical,
      languages: hreflangAlternates,
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

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
  const siteSettings = contentRepository.getSiteSettings<any>();
  const localizedNavigation = siteSettings?.navigation?.[activeLocale] || siteSettings?.navigation?.en;
  const localizedFooter = siteSettings?.footer?.[activeLocale] || siteSettings?.footer?.en;
  const localizedAddress =
    siteSettings?.contact?.address?.[activeLocale] ||
    siteSettings?.contact?.address?.en ||
    siteSettings?.contact?.address;
  const sharedContent = {
    logo: siteSettings?.logo,
    navigation: localizedNavigation,
    contact: {
      email: siteSettings?.contact?.email,
      phone: siteSettings?.contact?.phone,
      address: localizedAddress,
    },
    footer: localizedFooter,
  };

  return (
    <NextIntlClientProvider locale={activeLocale} messages={messages}>
      <ErrorBoundary>
        <Header content={sharedContent} />
        <main>{children}</main>
        <Footer content={sharedContent} />
      </ErrorBoundary>
      <DebugPanel />
      {/* Load network debugging script in development */}
      {isDevelopment && (
        <script src="/debug-network.js" />
      )}
    </NextIntlClientProvider>
  );
}

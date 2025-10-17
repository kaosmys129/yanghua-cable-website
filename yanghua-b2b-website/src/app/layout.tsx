import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { MonitoringProvider } from '@/components/providers/MonitoringProvider';
import { getLocale } from 'next-intl/server';
import { headers, cookies } from 'next/headers';
import FloatingWhatsAppButton from '@/components/FloatingWhatsAppButton';
import CookieBanner from '@/components/cookies/CookieBanner';
import AnalyticsProvider from '@/components/providers/AnalyticsProvider';

export const metadata = {
  title: 'Yanghua Cable - Professional Cable Solutions',
  description: 'Leading manufacturer of flexible busbars and cable solutions for industrial applications.',
  metadataBase: new URL('https://www.yhflexiblebusbar.com'),
  alternates: {
    canonical: 'https://www.yhflexiblebusbar.com',
    languages: {
      en: 'https://www.yhflexiblebusbar.com/en',
      es: 'https://www.yhflexiblebusbar.com/es',
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 从 middleware 传递的自定义请求头、cookie 以及 next-intl 获取 locale，确保 SSR 输出稳定
  const hdrs = headers();
  const headerLocale = hdrs.get('x-locale') || undefined;
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const intlLocale = await getLocale();
  const activeLocale = (headerLocale || cookieLocale || intlLocale || 'en').toLowerCase();
  return (
    <html lang={activeLocale} suppressHydrationWarning>
      <head>
        {/* Preconnect to Strapi for faster initial connections on pages that request CMS data */}
        <link rel="preconnect" href="https://fruitful-presence-02d7be759c.strapiapp.com" crossOrigin="anonymous" />
      </head>
      <body>
        <QueryProvider>
          <MonitoringProvider>
            {children}
            {/* Global floating WhatsApp chat button */}
            <FloatingWhatsAppButton />
            {/* Global cookie consent banner */}
            <CookieBanner />
            {/* Analytics provider: only loads GA after user consent, and reports SPA page_view manually */}
            <AnalyticsProvider />
          </MonitoringProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
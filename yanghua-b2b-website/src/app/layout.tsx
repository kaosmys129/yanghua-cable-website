import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { MonitoringProvider } from '@/components/providers/MonitoringProvider';
import Script from 'next/script';
import { getLocale } from 'next-intl/server';
import { headers, cookies } from 'next/headers';
import FloatingWhatsAppButton from '@/components/FloatingWhatsAppButton';

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
  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return (
    <html lang={activeLocale} suppressHydrationWarning>
      <head>
        {/* Preconnect to Strapi for faster initial connections on pages that request CMS data */}
        <link rel="preconnect" href="https://fruitful-presence-02d7be759c.strapiapp.com" crossOrigin="anonymous" />
        {GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} 
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
            `}</Script>
            {/* Web Vitals reporting to GA4 */}
            <Script src="https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js" strategy="afterInteractive" />
            <Script id="ga4-web-vitals" strategy="afterInteractive">{`
              (function(){
                if (!window.webVitals || typeof window.gtag !== 'function') return;
                function sendToGoogleAnalytics({name, delta, id}) {
                  window.gtag('event', name, {
                    value: Math.round(name === 'CLS' ? delta * 1000 : delta),
                    event_category: 'Web Vitals',
                    event_label: id,
                    non_interaction: true,
                  });
                }
                webVitals.onLCP(sendToGoogleAnalytics);
                webVitals.onCLS(sendToGoogleAnalytics);
                webVitals.onINP(sendToGoogleAnalytics);
              })();
            `}</Script>
          </>
        ) : null}
      </head>
      <body>
        <QueryProvider>
          <MonitoringProvider>
            {children}
            {/* Global floating WhatsApp chat button */}
            <FloatingWhatsAppButton />
          </MonitoringProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
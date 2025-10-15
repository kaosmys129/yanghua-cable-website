import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { MonitoringProvider } from '@/components/providers/MonitoringProvider';
import Script from 'next/script';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} 
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
            `}</Script>
          </>
        ) : null}
      </head>
      <body>
        <QueryProvider>
          <MonitoringProvider>
            {children}
          </MonitoringProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
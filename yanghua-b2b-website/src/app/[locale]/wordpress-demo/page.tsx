import { getTranslations } from 'next-intl/server';
import { generateCanonicalUrl } from '@/lib/seo';
import { buildLocalizedUrl } from '@/lib/url-localization';
import type { Metadata } from 'next';
import WordPressDemoClient from './WordPressDemoClient';

// 生成页面元数据
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  
  const titles: Record<string, string> = {
    en: 'WordPress CMS Integration Demo | Yanghua Cable',
    es: 'Demo de Integración CMS WordPress | Yanghua Cable',
  };
  
  const descriptions: Record<string, string> = {
    en: 'Demonstration of WordPress CMS integration with Next.js, showing real-time content from WordPress REST API.',
    es: 'Demostración de la integración de WordPress CMS con Next.js, mostrando contenido en tiempo real desde la API REST de WordPress.',
  };

  const baseUrl = 'https://www.yhflexiblebusbar.com';
  const canonical = generateCanonicalUrl('/wordpress-demo', locale as any, baseUrl);
  
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: {
        en: buildLocalizedUrl('wordpress-demo', 'en', undefined, baseUrl),
        es: buildLocalizedUrl('wordpress-demo', 'es', undefined, baseUrl),
      },
    },
  };
}

export default async function WordPressDemoPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('common');
  const locale = params?.locale || 'en';
  
  return (
    <div>
      {/* JSON-LD for the demo page */}
      {(() => {
        const baseUrl = 'https://www.yhflexiblebusbar.com';
        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: locale === 'es' ? 'Demo de Integración CMS WordPress' : 'WordPress CMS Integration Demo',
          description: locale === 'es' 
            ? 'Demostración de la integración de WordPress CMS con Next.js'
            : 'Demonstration of WordPress CMS integration with Next.js',
          url: `${baseUrl}/${locale}/wordpress-demo`,
        };
        return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
      })()}
      
      <WordPressDemoClient />
    </div>
  );
}
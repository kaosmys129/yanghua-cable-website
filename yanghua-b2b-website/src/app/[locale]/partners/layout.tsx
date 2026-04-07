import type { Metadata } from 'next';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { contentRepository } from '@/lib/content-repository';

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  const page = contentRepository.getPageContent<any>('partners', locale as 'en' | 'es');
  const metadata = page?.content?.metadata || {};
  const publicPath = locale === 'es' ? '/socios' : '/partners';

  const canonical = generateCanonicalUrl(publicPath, locale as any, baseUrl);

  return {
    title: metadata.title || 'Our Partners | Yanghua Cable',
    description: metadata.description || page?.content?.subtitle || 'Trusted by leading companies worldwide.',
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata(publicPath, locale as any),
    },
  };
}

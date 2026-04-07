import type { Metadata } from 'next';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { getLocalizedPath } from '@/lib/url-localization';
import { notFound } from 'next/navigation';

export default function SpanishArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  if (locale !== 'es') {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  const localizedPath = getLocalizedPath('articles', 'es');
  const canonical = generateCanonicalUrl(localizedPath, 'es', baseUrl);

  return {
    title: 'Blog Barras Colectoras Flexibles | Yanghua',
    description: 'Artículos y recursos técnicos sobre diseño de barras colectoras flexibles, materiales, normas, instalación y comparativas con soluciones tradicionales.',
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata(localizedPath, 'es'),
    },
  };
}

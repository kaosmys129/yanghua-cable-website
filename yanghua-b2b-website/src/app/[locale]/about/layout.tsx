import type { Metadata } from 'next';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { buildLocalizedUrl } from '@/lib/url-localization';

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  
  const titles: Record<string, string> = {
    en: 'About Yanghua | Busbar Manufacturer',
    es: 'Acerca de Yanghua | Fabricante Barras',
  };
  
  const descriptions: Record<string, string> = {
    en: 'Learn about Yanghua Cable\'s 28+ years of expertise in flexible busbar manufacturing, our mission, values, and commitment to innovation.',
    es: 'Conozca los más de 28 años de experiencia de Yanghua Cable en la fabricación de barras colectoras flexibles, nuestra misión y valores.',
  };

  const canonical = generateCanonicalUrl('/about', locale as any, baseUrl);

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata('/about', locale as any),
    },
  };
}
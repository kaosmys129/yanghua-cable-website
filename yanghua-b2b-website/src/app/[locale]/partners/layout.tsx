import type { Metadata } from 'next';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { buildLocalizedUrl } from '@/lib/url-localization';

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  
  const titles: Record<string, string> = {
    en: 'Our Partners | Leading Industry Collaborations | Yanghua Cable',
    es: 'Nuestros Socios | Colaboraciones Industriales Líderes | Yanghua Cable',
  };
  
  const descriptions: Record<string, string> = {
    en: 'Discover Yanghua Cable\'s strategic partnerships with industry leaders including BYD, CATL, Huawei, and State Grid for innovative flexible busbar solutions.',
    es: 'Descubra las asociaciones estratégicas de Yanghua Cable con líderes de la industria incluyendo BYD, CATL, Huawei y State Grid para soluciones innovadoras de barras colectoras flexibles.',
  };

  const canonical = generateCanonicalUrl('/partners', locale as any, baseUrl);

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata('/partners', locale as any),
    },
  };
}
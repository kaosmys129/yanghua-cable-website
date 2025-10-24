import type { Metadata } from 'next';
import { generateCanonicalUrl } from '@/lib/seo';
import { buildLocalizedUrl } from '@/lib/url-localization';

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  
  const titles: Record<string, string> = {
    en: 'About Yanghua Cable | Leading Flexible Busbar Manufacturer',
    es: 'Acerca de Yanghua Cable | Fabricante Líder de Barras Colectoras Flexibles',
  };
  
  const descriptions: Record<string, string> = {
    en: 'Learn about Yanghua Cable\'s 28+ years of expertise in flexible busbar manufacturing, our mission, values, and commitment to innovation in power distribution solutions.',
    es: 'Conozca los más de 28 años de experiencia de Yanghua Cable en la fabricación de barras colectoras flexibles, nuestra misión, valores y compromiso con la innovación en soluciones de distribución de energía.',
  };

  const canonical = generateCanonicalUrl('/about', locale as any, baseUrl);

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: {
        en: buildLocalizedUrl('about', 'en', undefined, baseUrl),
        es: buildLocalizedUrl('about', 'es', undefined, baseUrl),
      },
    },
  };
}
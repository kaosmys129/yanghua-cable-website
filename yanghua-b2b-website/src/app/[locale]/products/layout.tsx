import type { Metadata } from 'next';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { buildLocalizedUrl } from '@/lib/url-localization';

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  
  const titles: Record<string, string> = {
    en: 'Flexible Copper Busbar Products | Yanghua',
    es: 'Productos de Barra Colectora de Cobre Flexible | Yanghua',
  };
  const descriptions: Record<string, string> = {
    en: 'Explore Yanghua’s flexible busbar portfolio: 200–6300A, ≤3kV, XLPE/PVC insulation, high protection level for industrial and outdoor environments.',
    es: 'Descubra el portafolio de barras colectoras flexibles de Yanghua: 200–6300A, ≤3kV, aislamiento XLPE/PVC y alta protección para aplicaciones industriales y exteriores.',
  };
  const canonical = generateCanonicalUrl('/products', locale as any, baseUrl);
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata('/products', locale as any),
    },
  };
}
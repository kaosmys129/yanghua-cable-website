import type { Metadata } from 'next';

const BASE_URL = 'https://www.yhflexiblebusbar.com';

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const titles: Record<string, string> = {
    en: 'Flexible Copper Busbar Products | Yanghua',
    es: 'Productos de Barra Colectora de Cobre Flexible | Yanghua',
  };
  const descriptions: Record<string, string> = {
    en: 'Explore Yanghua’s flexible busbar portfolio: 200–6300A, ≤3kV, XLPE/PVC insulation, high protection level for industrial and outdoor environments.',
    es: 'Descubra el portafolio de barras colectoras flexibles de Yanghua: 200–6300A, ≤3kV, aislamiento XLPE/PVC y alta protección para aplicaciones industriales y exteriores.',
  };
  const url = `${BASE_URL}/${locale}/products`;
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/products`,
        es: `${BASE_URL}/es/productos`,
      },
    },
  };
}
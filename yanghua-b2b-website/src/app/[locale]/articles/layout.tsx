import type { Metadata } from 'next';

const BASE_URL = 'https://www.yhflexiblebusbar.com';

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const titles: Record<string, string> = {
    en: 'Flexible Busbar Blog & Resources | Design, Comparisons & FAQs | Yanghua',
    es: 'Blog y Recursos de Barras Colectoras Flexibles | Diseño, Comparativas y FAQs | Yanghua',
  };
  const descriptions: Record<string, string> = {
    en: 'Technical articles and resources on flexible busbar design, materials, standards, installation, and comparisons with traditional solutions.',
    es: 'Artículos y recursos técnicos sobre diseño de barras colectoras flexibles, materiales, normas, instalación y comparativas con soluciones tradicionales.',
  };
  const url = `${BASE_URL}/${locale}/articles`;
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/articles`,
        es: `${BASE_URL}/es/articles`,
      },
    },
  };
}
import type { Metadata } from 'next';

const BASE_URL = 'https://www.yhflexiblebusbar.com';

export default function SolutionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const titles: Record<string, string> = {
    en: 'Flexible Busbar Solutions for Data Centers, EV & Industry | Yanghua',
    es: 'Soluciones de Barras Colectoras para Centros de Datos, EV e Industria | Yanghua',
  };
  const descriptions: Record<string, string> = {
    en: 'Reliable flexible busbar solutions for demanding applications: data centers, EV power modules, and industrial automation with high safety and low loss.',
    es: 'Soluciones fiables de barras colectoras flexibles para aplicaciones exigentes: centros de datos, módulos EV y automatización industrial con alta seguridad y baja pérdida.',
  };
  const url = `${BASE_URL}/${locale}/solutions`;
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/solutions`,
        es: `${BASE_URL}/es/solutions`,
      },
    },
  };
}
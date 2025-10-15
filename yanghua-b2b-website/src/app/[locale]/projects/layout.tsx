import type { Metadata } from 'next';

const BASE_URL = 'https://www.yhflexiblebusbar.com';

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const titles: Record<string, string> = {
    en: 'Flexible Busbar Case Studies | Industrial & Data Center Projects | Yanghua',
    es: 'Casos de Barras Colectoras Flexibles | Proyectos Industriales y Centros de Datos | Yanghua',
  };
  const descriptions: Record<string, string> = {
    en: 'Explore real-world case studies of flexible busbar deployments across industrial and data center environments with measurable performance gains.',
    es: 'Explore casos reales de implementación de barras colectoras flexibles en entornos industriales y centros de datos con resultados medibles.',
  };
  const url = `${BASE_URL}/${locale}/projects`;
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/projects`,
        es: `${BASE_URL}/es/projects`,
      },
    },
  };
}
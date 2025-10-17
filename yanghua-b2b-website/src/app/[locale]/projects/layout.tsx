import type { Metadata } from 'next';
import { buildLocalizedUrl } from '@/lib/url-localization';

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
  const url = buildLocalizedUrl('projects', locale as 'en' | 'es', undefined, BASE_URL);
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical: url,
      languages: {
        en: buildLocalizedUrl('projects', 'en', undefined, BASE_URL),
        es: buildLocalizedUrl('projects', 'es', undefined, BASE_URL),
      },
    },
  };
}
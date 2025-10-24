import type { Metadata } from 'next';
import { generateCanonicalUrl } from '@/lib/seo';
import { buildLocalizedUrl } from '@/lib/url-localization';

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  
  const titles: Record<string, string> = {
    en: 'Flexible Busbar Case Studies | Industrial & Data Center Projects | Yanghua',
    es: 'Casos de Barras Colectoras Flexibles | Proyectos Industriales y Centros de Datos | Yanghua',
  };
  const descriptions: Record<string, string> = {
    en: 'Explore real-world case studies of flexible busbar deployments across industrial and data center environments with measurable performance gains.',
    es: 'Explore casos reales de implementación de barras colectoras flexibles en entornos industriales y centros de datos con resultados medibles.',
  };
  const canonical = generateCanonicalUrl('/projects', locale as any, baseUrl);
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: {
        en: buildLocalizedUrl('projects', 'en', undefined, baseUrl),
        es: buildLocalizedUrl('projects', 'es', undefined, baseUrl),
      },
    },
  };
}
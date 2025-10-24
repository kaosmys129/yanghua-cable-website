import type { Metadata } from 'next';
import { generateCanonicalUrl } from '@/lib/seo';
import { buildLocalizedUrl } from '@/lib/url-localization';

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yhflexiblebusbar.com';
  
  const titles: Record<string, string> = {
    en: 'Custom Busbar Manufacturing, Testing & Maintenance Services | Yanghua',
    es: 'Servicios de Fabricación, Pruebas y Mantenimiento de Barras Colectoras | Yanghua',
  };
  const descriptions: Record<string, string> = {
    en: 'From engineering design to testing and maintenance, Yanghua provides end-to-end services to ensure reliable flexible busbar performance.',
    es: 'Desde el diseño de ingeniería hasta pruebas y mantenimiento, Yanghua ofrece servicios integrales para garantizar el rendimiento fiable de las barras colectoras flexibles.',
  };
  const canonical = generateCanonicalUrl('/services', locale as any, baseUrl);
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: {
        en: buildLocalizedUrl('services', 'en', undefined, baseUrl),
        es: buildLocalizedUrl('services', 'es', undefined, baseUrl),
      },
    },
  };
}
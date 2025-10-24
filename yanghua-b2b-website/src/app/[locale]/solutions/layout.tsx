import type { Metadata } from 'next';
import { generateCanonicalUrl } from '@/lib/seo';
import { buildLocalizedUrl } from '@/lib/url-localization';

export default function SolutionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  const titles: Record<string, string> = {
    en: 'Flexible Busbar Solutions for Data Centers, EV & Industry | Yanghua',
    es: 'Soluciones de Barras Colectoras para Centros de Datos, EV e Industria | Yanghua',
  };
  const descriptions: Record<string, string> = {
    en: 'Reliable flexible busbar solutions for demanding applications: data centers, EV power modules, and industrial automation with high safety and low loss.',
    es: 'Soluciones fiables de barras colectoras flexibles para aplicaciones exigentes: centros de datos, módulos EV y automatización industrial con alta seguridad y baja pérdida.',
  };
  const canonical = generateCanonicalUrl('/solutions', locale as any, baseUrl);
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: {
        en: buildLocalizedUrl('solutions', 'en', undefined, baseUrl),
        es: buildLocalizedUrl('solutions', 'es', undefined, baseUrl),
      },
    },
  };
}
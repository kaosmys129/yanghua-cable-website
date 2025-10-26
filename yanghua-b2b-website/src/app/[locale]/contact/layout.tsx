import type { Metadata } from 'next';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { buildLocalizedUrl } from '@/lib/url-localization';

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  
  const titles: Record<string, string> = {
    en: 'Contact Yanghua | Flexible Busbar Quote',
    es: 'Contactar Yanghua | Cotización Barras',
  };
  
  const descriptions: Record<string, string> = {
    en: 'Contact Yanghua Cable for custom flexible busbar solutions, technical support, and project consultations. Get expert advice for your power distribution needs.',
    es: 'Contacte a Yanghua Cable para soluciones de barras colectoras flexibles, soporte técnico y consultas de proyectos. Asesoramiento experto.',
  };

  const canonical = generateCanonicalUrl('/contact', locale as any, baseUrl);

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata('/contact', locale as any),
    },
  };
}
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
    en: 'Contact Yanghua Cable | Get Quote for Flexible Busbar Solutions',
    es: 'Contactar Yanghua Cable | Obtener Cotización para Soluciones de Barras Colectoras',
  };
  
  const descriptions: Record<string, string> = {
    en: 'Contact Yanghua Cable for custom flexible busbar solutions, technical support, and project consultations. Get expert advice for your power distribution needs.',
    es: 'Contacte a Yanghua Cable para soluciones personalizadas de barras colectoras flexibles, soporte técnico y consultas de proyectos. Obtenga asesoramiento experto para sus necesidades de distribución de energía.',
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
import type { Metadata } from 'next';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { buildLocalizedUrl } from '@/lib/url-localization';

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  const titles: Record<string, string> = {
    en: 'Flexible Busbar Blog & Resources | Design, Comparisons & FAQs | Yanghua',
    es: 'Blog y Recursos de Barras Colectoras Flexibles | Diseño, Comparativas y FAQs | Yanghua',
  };
  const descriptions: Record<string, string> = {
    en: 'Technical articles and resources on flexible busbar design, materials, standards, installation, and comparisons with traditional solutions.',
    es: 'Artículos y recursos técnicos sobre diseño de barras colectoras flexibles, materiales, normas, instalación y comparativas con soluciones tradicionales.',
  };
  // 使用本地化URL生成，确保西语翻译段作为规范路径
  const canonical = generateCanonicalUrl('/articles', locale as any, baseUrl);
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata('/articles', locale as any),
    },
  };
}
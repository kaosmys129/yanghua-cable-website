import type { Metadata } from 'next';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { buildLocalizedUrl } from '@/lib/url-localization';

export default function SolutionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string; id?: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  // 当存在子页面参数时（/solutions/[id]），跳过在布局层生成 alternates，避免对子页面输出固定 '/solutions'
  if (params?.id) {
    return {};
  }
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  const titles: Record<string, string> = {
    en: 'Flexible Busbar Solutions | Data Centers',
    es: 'Soluciones Barras Flexibles | Centros Datos',
  };
  const descriptions: Record<string, string> = {
    en: 'Reliable flexible busbar solutions for data centers, EV power modules, and industrial automation with high safety, performance and durability.',
    es: 'Soluciones fiables de barras colectoras flexibles para centros de datos, módulos EV y automatización industrial con alta seguridad y rendimiento.',
  };
  const canonical = generateCanonicalUrl('/solutions', locale as any, baseUrl);
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata('/solutions', locale as any),
    },
  };
}
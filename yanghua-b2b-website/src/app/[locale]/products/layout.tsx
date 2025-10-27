import type { Metadata } from 'next';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { getLocalizedPath } from '@/lib/url-localization';

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string; id?: string; name?: string } }): Promise<Metadata> {
  const { locale, id, name } = params || { locale: 'en' };
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  
  // 当访问 /products/[id] 或 /products/category/[name] 子页面时，跳过布局层的 alternates 生成，交由页面级别处理
  if (id || name) {
    return {};
  }

  const titles: Record<string, string> = {
    en: 'Flexible Copper Busbar Products | Yanghua',
    es: 'Productos Barras Flexibles | Yanghua',
  };
  const descriptions: Record<string, string> = {
    en: "Explore Yanghua's flexible busbar portfolio: 200-6300A, ≤3kV, XLPE/PVC insulation, high protection level for industrial and outdoor environments.",
    es: 'Barras flexibles Yanghua: 200-6300A, ≤3kV, aislamiento XLPE/PVC, alta protección para aplicaciones industriales y exteriores.',
  };

  const localizedPath = getLocalizedPath('products', locale as any);
  const canonical = generateCanonicalUrl(localizedPath, locale as any, baseUrl);

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata(localizedPath, locale as any),
    },
  };
}
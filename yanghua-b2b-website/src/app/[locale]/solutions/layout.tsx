import type { Metadata } from 'next';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { getLocalizedPath } from '@/lib/url-localization';
import { getTranslations } from 'next-intl/server';

export default function SolutionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string; id?: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  // 当存在子页面参数时（/solutions/[id]），跳过在布局层生成 alternates，避免对子页面输出固定 '/solutions'
  if (params?.id) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: 'seo.pages.solutions' });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  
  const canonical = generateCanonicalUrl(getLocalizedPath('solutions', locale as any), locale as any, baseUrl);
  const currentUrl = canonical;
  const currentPathForLocale = getLocalizedPath('solutions', locale as any);
  
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: currentUrl,
      siteName: 'Yanghua Cable',
      type: 'website',
      locale,
    },
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata(currentPathForLocale, locale as any),
    },
  };
}
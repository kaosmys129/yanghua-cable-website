import type { Metadata } from 'next';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { getLocalizedPath } from '@/lib/url-localization';
import { contentRepository } from '@/lib/content-repository';

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  const page = contentRepository.getPageContent<{ metadata?: { title?: string; description?: string } }>(
    'contact',
    locale as 'en' | 'es'
  );

  const localizedPath = getLocalizedPath('contact', locale as any);
  const canonical = generateCanonicalUrl(localizedPath, locale as any, baseUrl);

  return {
    title: page?.metadata?.title,
    description: page?.metadata?.description,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata(localizedPath, locale as any),
    },
  };
}

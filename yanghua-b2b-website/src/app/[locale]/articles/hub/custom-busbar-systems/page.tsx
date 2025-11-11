import type { Metadata } from 'next';
import { getLocalizedPath } from '@/lib/url-localization';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { getFeaturedProjects } from '@/lib/projects';
import { getCsrfToken } from '@/lib/security/csrf';
import CustomBusbarHubClient from '@/components/custom/CustomBusbarHubClient';

interface PageProps { params: { locale: 'en' | 'es' } }

export default async function CustomBusbarHub({ params }: PageProps) {
  const { locale } = params;
  const projects = await getFeaturedProjects();
  const csrfToken = await getCsrfToken();
  return <CustomBusbarHubClient projects={projects} csrfToken={csrfToken} />;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params;
  const localizedPath = getLocalizedPath('articles-hub-detail', locale, { slug: 'custom-busbar-systems' });
  const canonical = generateCanonicalUrl(localizedPath, locale);
  const title = locale === 'es' ? 'Sistemas de Barra Flexible Personalizados | Yanghua' : 'Custom Flexible Busbar Systems | Yanghua';
  const description = locale === 'es'
    ? 'Soluciones a medida de barra flexible: longitudes, terminaciones y accesorios para escenarios industriales.'
    : 'Tailored flexible busbar solutions: lengths, terminations and accessories for industrial scenarios.';
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata(localizedPath, locale),
    },
  };
}

export const dynamicParams = false;
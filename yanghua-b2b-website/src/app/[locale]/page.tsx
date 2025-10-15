import Hero from '@/components/business/Hero';
import CompanyStrength from '@/components/business/CompanyStrength';
import ApplicationAreas from '@/components/business/ApplicationAreas';
import ProductComparison from '@/components/ui/FlexibleBusbarComparison';
import Partners from '@/components/business/Partners';
import InquiryForm from '@/components/features/InquiryForm';
import ProjectGallery from '@/components/business/ProjectGallery';
import { getFeaturedProjects } from '@/lib/projects';
import { getCsrfToken } from '@/lib/security/csrf';
import { MultipleStructuredDataScript } from '@/components/seo/StructuredDataScript';
import { generateOrganizationSchema, generateWebsiteSchema } from '@/lib/structured-data';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generateHreflangAlternatesForMetadata } from '@/lib/seo';

export default async function Home() {
  const projects = await getFeaturedProjects();
  const csrfToken = await getCsrfToken();

  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();

  return (
    <>
      <MultipleStructuredDataScript schemas={[organizationSchema, websiteSchema]} />
      <Hero />
      <CompanyStrength />
      <ApplicationAreas />
      <ProductComparison />
      <Partners />
      <ProjectGallery projects={projects} />
      <InquiryForm csrfToken={csrfToken} />
    </>
  );
}

const BASE_URL = 'https://www.yhflexiblebusbar.com';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  const title = t('pages.home.title');
  const description = t('pages.home.description');
  const currentUrl = `${BASE_URL}/${locale}`;

  return {
    title,
    description,
    keywords: locale === 'es' 
      ? 'barra colectora flexible, sistemas de distribución de energía, cables de alta corriente, yanghua'
      : 'flexible busbar, power distribution systems, high current cables, yanghua',
    openGraph: {
      title,
      description,
      url: currentUrl,
      siteName: 'Yanghua Cable',
      images: [`${BASE_URL}/images/og-home.jpg`],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${BASE_URL}/images/og-home.jpg`],
    },
    alternates: {
      canonical: currentUrl,
      languages: generateHreflangAlternatesForMetadata('/', locale as 'en' | 'es'),
    },
  };
}

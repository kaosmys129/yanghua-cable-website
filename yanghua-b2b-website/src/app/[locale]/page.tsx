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
import { generateHreflangAlternatesForMetadata, generateCanonicalUrl } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site-url';
import { contentRepository } from '@/lib/content-repository';

type HomePageContent = {
  hero?: {
    title: string;
    subtitle: string;
    description: string;
    cta: string;
  };
  companyStrength?: {
    title: string;
    subtitle: string;
    ctaLearnMore: string;
    stats: {
      certifications: { value: string; label: string; description: string };
      capacity: { value: string; label: string; description: string };
      testing: { value: string; label: string; description: string };
      documentation: { value: string; label: string; description: string };
    };
  };
  applicationAreas?: {
    title: string;
    subtitle: string;
    pagination?: { previous?: string; next?: string };
    areas: Record<string, { title: string; description: string }>;
  };
  partners?: {
    title: string;
    subtitle: string;
    ctaAllPartners: string;
    items?: Array<{ name: string; logo: string }>;
  };
  projectGallery?: {
    title?: string;
    subtitle?: string;
    viewDetails?: string;
    viewAllProjects?: string;
  };
};

export default async function Home({ params }: { params: { locale: string } }) {
  const locale = (params.locale || 'en') as 'en' | 'es';
  const projects = await getFeaturedProjects();
  const csrfToken = await getCsrfToken();
  const pageContent = contentRepository.getPageContent<HomePageContent>('home', locale);

  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();

  return (
    <>
      <MultipleStructuredDataScript schemas={[organizationSchema, websiteSchema]} />
      <Hero content={pageContent?.hero} />
      <CompanyStrength content={pageContent?.companyStrength} />
      <ApplicationAreas content={pageContent?.applicationAreas} />
      <ProductComparison />
      <Partners content={pageContent?.partners} />
      <ProjectGallery projects={projects} content={pageContent?.projectGallery} />
      <InquiryForm csrfToken={csrfToken} />
    </>
  );
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  const pageContent = contentRepository.getPageContent<HomePageContent>('home', locale as 'en' | 'es');
  const baseUrl = getSiteUrl();

  const title = pageContent?.hero?.title ?? t('pages.home.title');
  const description = pageContent?.hero?.description ?? t('pages.home.description');
  const canonicalUrl = generateCanonicalUrl('/', locale as 'en' | 'es', baseUrl);

  return {
    title,
    description,
    keywords:
      locale === 'es'
        ? 'barra colectora flexible, sistemas de distribución de energía, cables de alta corriente, yanghua'
        : 'flexible busbar, power distribution systems, high current cables, yanghua',
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Yanghua Cable',
      images: [`${baseUrl}/images/og-home.jpg`],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/images/og-home.jpg`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangAlternatesForMetadata('/', locale as 'en' | 'es'),
    },
  };
}

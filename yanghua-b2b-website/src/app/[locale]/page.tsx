import Hero from '@/components/business/Hero';
import CompanyStrength from '@/components/business/CompanyStrength';
import ApplicationAreas from '@/components/business/ApplicationAreas';
import ProductComparison from '@/components/ui/FlexibleBusbarComparison';
import Partners from '@/components/business/Partners';
import InquiryForm from '@/components/features/InquiryForm';
import ProjectGallery from '@/components/business/ProjectGallery';
import { getFeaturedProjects } from '@/lib/projects';
import { getCsrfToken } from '@/lib/security/csrf';
import StructuredDataScript from '@/components/seo/StructuredDataScript';
import { generateOrganizationSchema, generateWebsiteSchema } from '@/lib/structured-data';

export default async function Home() {
  const featuredProjects = getFeaturedProjects(4);
  const csrfToken = getCsrfToken();
  
  // 生成结构化数据
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();
  
  return (
    <>
      <StructuredDataScript schema={organizationSchema} />
      <StructuredDataScript schema={websiteSchema} />
      <div className="min-h-screen">
        <Hero />
        <CompanyStrength />
        <ProductComparison />
        <ApplicationAreas />
        <ProjectGallery projects={featuredProjects} />
        <Partners />
        <InquiryForm csrfToken={csrfToken} />
      </div>
    </>
  );
}
import type { Metadata } from 'next';

const BASE_URL = 'https://www.yhflexiblebusbar.com';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const titles: Record<string, string> = {
    en: 'Flexible Busbar Solutions | Yanghua',
    es: 'Soluciones de Barra Colectora Flexible | Yanghua',
  };
  const descriptions: Record<string, string> = {
    en: 'Leading flexible copper busbar systems for industrial power distribution. High-current, low-loss, reliable solutions for data centers, EV, and industrial applications.',
    es: 'Sistemas de barra colectora flexible para distribución de energía industrial. Alta corriente, baja pérdida y soluciones fiables para centros de datos, EV e industria.',
  };

  const url = `${BASE_URL}/${locale}`;
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en`,
        es: `${BASE_URL}/es`,
      },
    },
  };
}

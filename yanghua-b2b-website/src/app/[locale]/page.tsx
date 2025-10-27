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

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  
  // 确保与canonical使用相同的域名逻辑
  let baseUrl: string;
  if (typeof window !== 'undefined') {
    // 客户端环境
    baseUrl = window.location.origin;
  } else if (process.env.NODE_ENV === 'development') {
    // 开发环境服务端
    baseUrl = 'http://localhost:3000';
  } else {
    // 生产环境服务端
    baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  }

  const title = t('pages.home.title');
  const description = t('pages.home.description');
  // 使用generateCanonicalUrl生成canonical链接，始终指向英语版本
  const canonicalUrl = generateCanonicalUrl('/', locale as 'en' | 'es', baseUrl);
  // 将 Open Graph 的 url 与 canonical 保持一致，避免英文出现 /en 前缀和双斜杠
  const ogUrl = canonicalUrl;

  return {
    title,
    description,
    keywords: locale === 'es' 
      ? 'barra colectora flexible, sistemas de distribución de energía, cables de alta corriente, yanghua'
      : 'flexible busbar, power distribution systems, high current cables, yanghua',
    openGraph: {
      title,
      description,
      url: ogUrl,
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

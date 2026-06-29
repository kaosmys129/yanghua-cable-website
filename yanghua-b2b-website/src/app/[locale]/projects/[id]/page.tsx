import { getTranslations } from 'next-intl/server';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { buildLocalizedUrl } from '@/lib/url-localization';
import type { Metadata } from 'next';
import { getCsrfTokenAsync } from '@/lib/security/csrf';
import StructuredDataScript from '@/components/seo/StructuredDataScript';
import { generateCaseStudySchema, generateBreadcrumbSchema } from '@/lib/structured-data';
import { notFound } from 'next/navigation';
import ProjectDetailClient from '@/components/business/ProjectDetailClient';

interface Project {
  id: string;
  title: string;
  client: string;
  industry: string;
  location: string;
  duration: string;
  completionDate: string;
  projectScale: string;
  challenge: string;
  solution: string;
  challenges: string[];
  solutionPoints: string[];
  results: { metric: string; value: string }[];
  productsUsed: string[];
  images: string[];
  testimonial?: string;
  testimonialAuthor?: string;
  testimonialPosition?: string;
}

// Get project data from translations
async function getProject(id: string, t: any): Promise<Project | null> {
  try {
    const projects = t.raw('list') as any[];
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return null;
    }
    
    return {
      id: project.id,
      title: project.title,
      client: project.client,
      industry: project.industry,
      location: project.location,
      duration: project.duration,
      completionDate: project.completionDate,
      projectScale: project.projectScale,
      challenge: project.challenge || project.content,
      solution: project.solution || project.content,
      challenges: project.challenges || [],
      solutionPoints: project.solutionPoints || [],
      results: project.results || [],
      productsUsed: project.productsUsed || [],
      images: project.images || [],
      testimonial: project.testimonial,
      testimonialAuthor: project.testimonialAuthor,
      testimonialPosition: project.testimonialPosition,
    };
  } catch (error) {
    console.error('Error loading project data:', error);
    return null;
  }
}

// Generate static params for all available projects
export async function generateStaticParams() {
  const projectIds = ['1', '2', '3', '4', '5', '6', '7'];
  const locales = ['en', 'es'];
  
  const params = [];
  for (const locale of locales) {
    for (const id of projectIds) {
      params.push({ locale, id });
    }
  }
  
  return params;
}

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'projects' });
  const project = await getProject(id, t);
  const csrfToken = await getCsrfTokenAsync();

  if (!project) {
    notFound();
  }

  // 生成结构化数据
  const caseStudySchema = generateCaseStudySchema({
    title: project.title,
    description: project.challenge,
    client: project.client,
    industry: project.industry,
    completionDate: project.completionDate,
    image: project.images?.[0] || '/images/projects/default.jpg',
    url: `/${locale}/projects/${id}`,
    results: project.results,
    location: project.location,
    duration: project.duration,
    projectScale: project.projectScale,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: locale === 'es' ? 'Inicio' : 'Home', url: `/${locale}` },
    { name: locale === 'es' ? 'Proyectos' : 'Projects', url: `/${locale}/projects` },
    { name: project.title, url: `/${locale}/projects/${id}` },
  ]);

  const translations = {
    backToProjects: t('labels.backToProjects'),
    viewDetails: t('labels.viewDetails'),
    projectLocation: t('detailPage.projectLocation'),
    completionDate: t('detailPage.completionDate'),
    projectScale: t('labels.projectScale'),
    projectDuration: t('detailPage.projectDuration'),
    challenges: t('detailPage.challenges'),
    solution: t('detailPage.solution'),
    results: t('detailPage.results'),
    products: t('detailPage.products'),
    projectGallery: t('detailPage.projectGallery'),
    testimonial: t('detailPage.testimonial'),
    relatedProjects: t('detailPage.relatedProjects'),
    quickInquiry: t('detailPage.quickInquiry'),
    projectInformation: t('detailPage.projectInformation'),
    client: t('labels.client'),
    industry: t('labels.industry'),
    location: t('labels.location'),
    overview: t('detailPage.overview'),
    overviewTitle: t('detailPage.overview'),
    projectNotFound: t('detailPage.projectNotFound'),
    projectNotFoundDesc: t('detailPage.projectNotFoundDesc'),
  };

  const relatedProjects = [
    { title: '30MW Wind Power Project', industry: 'New Energy' },
    { title: 'Data Center Power Distribution System', industry: 'Data Center' },
    { title: 'Industrial Plant Renovation Project', industry: 'Industry' },
  ];

  return (
    <>
      <StructuredDataScript schema={caseStudySchema} />
      <StructuredDataScript schema={breadcrumbSchema} />
      <ProjectDetailClient
        project={project}
        csrfToken={csrfToken}
        translations={translations}
        relatedProjects={relatedProjects}
      />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'projects' });
  
  const project = await (async () => {
    try {
      const projects = t.raw('list') as any[];
      return projects.find(p => p.id === id) || null;
    } catch {
      return null;
    }
  })();

  const baseUrl = 'https://www.yhflexiblebusbar.com';
  const canonical = buildLocalizedUrl('projects-detail', locale as any, { id }, baseUrl);
  const titleBase = project?.title || 'Project Case';

  const titles: Record<string, string> = {
    en: `${titleBase} | Flexible Busbar Case Study | Yanghua`,
    es: `${titleBase} | Estudio de Caso de Barras Colectoras | Yanghua`,
  };

  const descriptions: Record<string, string> = {
    en: project?.challenge || `Case study in ${project?.industry || 'Industry'}: location ${project?.location || ''}, client ${project?.client || ''}.`,
    es: project?.challenge || `Estudio de caso en ${project?.industry || 'Industria'}: ubicación ${project?.location || ''}, cliente ${project?.client || ''}.`,
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata(`/projects/${id}`, locale as any),
    },
  };
}

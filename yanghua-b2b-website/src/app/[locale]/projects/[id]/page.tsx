import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, Calendar, Users, TrendingUp } from 'lucide-react';
import QuickInquiry from '@/components/features/QuickInquiry';
import { getCsrfTokenAsync } from '@/lib/security/csrf';

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
      testimonialPosition: project.testimonialPosition
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

  // Placeholder image component
  const PlaceholderImage = ({ className }: { className?: string }) => (
    <div className={`bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}>
      <span className="text-gray-500 text-sm">Image Not Available</span>
    </div>
  );

  // Loadable image component
  const LoadableImage = ({ src, alt, className, fill = true, priority = false, sizes = '100vw' }: { src: string; alt: string; className?: string; fill?: boolean; priority?: boolean; sizes?: string }) => {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        priority={priority}
        sizes={sizes}
        className={className}
      />
    );
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('detailPage.projectNotFound')}</h1>
          <p className="text-gray-600 mb-4">{t('detailPage.projectNotFoundDesc')}</p>
          <Link href={`/${locale}/projects`} className="btn-primary">
            {t('labels.backToProjects')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD: Breadcrumbs for project detail */}
      {(() => {
        const baseUrl = 'https://www.yhflexiblebusbar.com';
        const projectUrl = `${baseUrl}/${locale}/projects/${id}`;
        const breadcrumbJsonLd = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: locale === 'es' ? 'Inicio' : 'Home', item: `${baseUrl}/${locale}` },
            { '@type': 'ListItem', position: 2, name: locale === 'es' ? 'Proyectos' : 'Projects', item: `${baseUrl}/${locale}/projects` },
            { '@type': 'ListItem', position: 3, name: project.title, item: projectUrl },
          ],
        };
        return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />;
      })()}
      {/* Project header */}
      <div className="relative h-96 bg-gradient-to-r from-gray-900 to-gray-700">
        <div className="absolute inset-0">
          {project.images[0] ? (
            <LoadableImage
              src={project.images[0]}
              alt={project.title}
              className="object-cover opacity-50"
              priority
              sizes="(max-width: 768px) 100vw, 100vw"
            />
          ) : (
            <PlaceholderImage className="w-full h-full opacity-50" />
          )}
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-3xl">
            <span className="text-yellow-500 text-sm font-semibold tracking-wide uppercase">
              {project.industry} Project Case
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4">
              {project.title}
            </h1>
            <p className="text-xl text-gray-200">
              Providing professional flexible busbar solutions for {project.client}
            </p>
          </div>
        </div>
      </div>

      {/* Project overview */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t('detailPage.projectLocation')}</h3>
              <p className="text-gray-600 mt-2">{project.location}</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t('detailPage.completionDate')}</h3>
              <p className="text-gray-600 mt-2">{project.completionDate}</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t('labels.projectScale')}</h3>
              <p className="text-gray-600 mt-2">{project.projectScale}</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t('detailPage.projectDuration')}</h3>
              <p className="text-gray-600 mt-2">{project.duration}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project details content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{project.title}</h1>
          <div className="flex flex-wrap justify-center gap-6 text-lg text-gray-600">
            <span>{t('labels.client')}: {project.client}</span>
            <span>{t('labels.industry')}: {project.industry}</span>
            <span>{t('labels.location')}: {project.location}</span>
            <span>{t('labels.duration')}: {project.duration}</span>
            <span>{t('labels.completionDate')}: {project.completionDate}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('detailPage.challenges')}</h2>
            {project.challenges.length > 0 ? (
              <ul className="space-y-2">
                {project.challenges.map((challenge: string, index: number) => (
                  <li key={index} className="text-gray-600 leading-relaxed flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    {challenge}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 leading-relaxed">{project.challenge}</p>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('detailPage.solution')}</h2>
            {project.solutionPoints.length > 0 ? (
              <ul className="space-y-2">
                {project.solutionPoints.map((point: string, index: number) => (
                  <li key={index} className="text-gray-600 leading-relaxed flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 leading-relaxed">{project.solution}</p>
            )}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('detailPage.results')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {project.results.map((result: any, index: number) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="text-3xl font-bold text-[#F9BB67] mb-2">{result.value}</div>
                <div className="text-gray-600">{result.metric}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('detailPage.products')}</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {project.productsUsed.map((product: any, index: number) => (
              <span key={index} className="bg-[#F9BB67] text-gray-900 px-4 py-2 rounded-full">{product}</span>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('detailPage.projectGallery')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.images.map((image: any, index: number) => (
              <div key={index} className="relative h-64 rounded-lg overflow-hidden shadow-lg">
                {image ? (
                  <LoadableImage
                    src={image}
                    alt={`Project image ${index + 1}`}
                    fill={true}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 33vw"
                    className="transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <PlaceholderImage className="w-full h-full" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-8 rounded-lg mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">{t('detailPage.testimonial')}</h2>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl text-gray-600 italic mb-6">"{project.testimonial || 'No testimonial available'}"</p>
            <div>
              <p className="font-semibold text-gray-900">{project.testimonialAuthor || 'Anonymous'}</p>
              <p className="text-gray-600">{project.testimonialPosition || 'Client'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-8">
        {/* Project navigation */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('detailPage.projectInformation')}</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">{t('labels.client')}</span>
              <div className="font-medium text-gray-900">{project.client}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">{t('labels.industry')}</span>
              <div className="font-medium text-gray-900">{project.industry}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">{t('labels.location')}</span>
              <div className="font-medium text-gray-900">{project.location}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">{t('labels.projectScale')}</span>
              <div className="font-medium text-gray-900">{project.projectScale}</div>
            </div>
          </div>
        </div>
    
        {/* Quick inquiry */}
        <div className="bg-yellow-500 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('detailPage.quickInquiry')}</h3>
          <QuickInquiry projectId={id} projectTitle={project.title} csrfToken={csrfToken} />
        </div>
    
        {/* Related projects */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('detailPage.relatedProjects')}</h3>
          <div className="space-y-4">
            {[
              { title: '30MW Wind Power Project', industry: 'New Energy' },
              { title: 'Data Center Power Distribution System', industry: 'Data Center' },
              { title: 'Industrial Plant Renovation Project', industry: 'Industry' }
            ].map((relatedProject, index) => (
              <Link
                key={index}
                href={`/${locale}/projects/${relatedProject.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">{relatedProject.title}</div>
                <div className="text-sm text-gray-600">{relatedProject.industry}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { id: string; locale: string } }): Promise<Metadata> {
  const { id, locale } = params;
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
  const url = `${baseUrl}/${locale}/projects/${id}`;
  const titleBase = project?.title || 'Project Case';
  const titles: Record<string, string> = {
    en: `${titleBase} | Flexible Busbar Case Study | Yanghua`,
    es: `${titleBase} | Estudio de Caso de Barras Colectoras | Yanghua`,
  };
  const descriptions: Record<string, string> = {
    en: project?.description || `Case study in ${project?.industry || 'Industry'}: location ${project?.location || ''}, client ${project?.client || ''}.`,
    es: project?.description || `Estudio de caso en ${project?.industry || 'Industria'}: ubicación ${project?.location || ''}, cliente ${project?.client || ''}.`,
  };
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical: url,
      languages: {
        en: `${baseUrl}/en/projects/${id}`,
        es: `${baseUrl}/es/projects/${id}`,
      },
    },
  };
}
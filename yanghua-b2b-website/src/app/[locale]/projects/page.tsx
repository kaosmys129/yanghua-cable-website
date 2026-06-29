import { getTranslations } from 'next-intl/server';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { buildLocalizedUrl, getLocalizedPath } from '@/lib/url-localization';
import ProjectsPageClient from '@/components/business/ProjectsPageClient';
import type { Metadata } from 'next';

// 获取项目数据的函数
function getProjects(t: any) {
  return t.raw('list') as any[];
}

export default async function ProjectsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('projects');
  const projects = getProjects(t);
  const locale = params?.locale || 'en';
  
  const stats = {
    totalProjects: t('stats.totalProjects'),
    industriesCovered: t('stats.industriesCovered'),
    countriesServed: t('stats.countriesServed'),
    totalCapacity: t('stats.totalCapacity'),
  };

  return (
    <>
      {/* JSON-LD: CollectionPage for Projects */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: t('page.title'),
            description: t('page.description'),
            url: `https://www.yhflexiblebusbar.com/${locale}/projects`,
          }),
        }}
      />
      <ProjectsPageClient projects={projects} stats={stats} />
    </>
  );
}

// 生成页面元数据
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const t = await getTranslations('projects');
  
  const titles: Record<string, string> = {
    en: 'Project Cases | Yanghua Cable',
    es: 'Casos de Proyectos | Yanghua Cable',
  };
  
  const descriptions: Record<string, string> = {
    en: 'Explore our successful flexible busbar projects across data centers, new energy, and industrial applications. Real-world case studies.',
    es: 'Explora nuestros exitosos proyectos de barras flexibles en centros de datos, nueva energía y aplicaciones industriales. Casos de estudio reales y ejemplos.',
  };

  const baseUrl = 'https://www.yhflexiblebusbar.com';
  const localizedPath = getLocalizedPath('projects', locale as any);
  const canonical = generateCanonicalUrl(localizedPath, locale as any, baseUrl);
  const hreflangAlternates = generateHreflangAlternatesForMetadata(localizedPath, locale as any);
  
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: hreflangAlternates,
    },
  };
}

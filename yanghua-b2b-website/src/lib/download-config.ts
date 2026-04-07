import { getStaticSiteSettings } from './site-settings';

export interface PDFResource {
  id: string;
  category: string;
  baseName: string;
  title: {
    en: string;
    es: string;
  };
  description: {
    en: string;
    es: string;
  };
  fileSize: string;
  languages: ('en' | 'es')[];
  version: string;
  featured?: boolean;
}

const siteSettings = getStaticSiteSettings();

export const downloadResources: PDFResource[] =
  (siteSettings.downloads?.resources as PDFResource[] | undefined) ?? [];

// 获取下载资源
export function getDownloadResource(id: string): PDFResource | undefined {
  return downloadResources.find(resource => resource.id === id);
}

// 按类别获取资源
export function getResourcesByCategory(category: string): PDFResource[] {
  return downloadResources.filter(resource => resource.category === category);
}

// 构建下载路径
export function buildDownloadPath(resource: PDFResource, language: 'en' | 'es'): string {
  const fileName = `${resource.baseName}_${language}_${resource.version}.pdf`;
  return `/downloads/${resource.category}/${fileName}`;
}

// 获取本地化资源信息
export function getLocalizedResource(resource: PDFResource, language: 'en' | 'es') {
  return {
    ...resource,
    title: resource.title[language],
    description: resource.description[language],
    fileName: `${resource.baseName}_${language}_${resource.version}.pdf`,
    downloadPath: buildDownloadPath(resource, language)
  };
}

// 获取特色资源
export function getFeaturedResources(): PDFResource[] {
  return downloadResources.filter(resource => resource.featured);
}

// 按标签搜索资源
export function searchResourcesByTag(searchTerm: string): PDFResource[] {
  const term = searchTerm.toLowerCase();
  return downloadResources.filter(resource => 
    resource.title.en.toLowerCase().includes(term) ||
    resource.title.es.toLowerCase().includes(term) ||
    resource.description.en.toLowerCase().includes(term) ||
    resource.description.es.toLowerCase().includes(term) ||
    resource.category.toLowerCase().includes(term)
  );
}

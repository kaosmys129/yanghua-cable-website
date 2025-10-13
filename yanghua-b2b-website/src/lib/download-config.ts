// PDF资源配置
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

// 下载资源配置
export const downloadResources: PDFResource[] = [
  {
    id: 'company-profile',
    category: 'company-profile',
    baseName: 'yanghua_company_profile',
    title: {
      en: 'Company Profile',
      es: 'Perfil de la Empresa'
    },
    description: {
      en: 'Comprehensive overview of Yanghua Cable Company',
      es: 'Descripción completa de Yanghua Cable Company'
    },
    fileSize: '3.2 MB',
    languages: ['en', 'es'],
    version: 'v2.0',
    featured: true
  },
  {
    id: 'flexible-busbar-solution',
    category: 'solutions',
    baseName: 'flexible_busbar_specification',
    title: {
      en: 'Flexible Busbar Solution Specification',
      es: 'Especificación de Solución de Barra Flexible'
    },
    description: {
      en: 'Technical specifications for flexible busbar solutions',
      es: 'Especificaciones técnicas para soluciones de barras flexibles'
    },
    fileSize: '2.1 MB',
    languages: ['en', 'es'],
    version: 'v1.5'
  },
  {
    id: 'service-resources',
    category: 'services',
    baseName: 'service_resources_package',
    title: {
      en: 'Service Resources Package',
      es: 'Paquete de Recursos de Servicio'
    },
    description: {
      en: 'Installation guides, technical manuals, and support documentation',
      es: 'Guías de instalación, manuales técnicos y documentación de soporte'
    },
    fileSize: '8.5 MB',
    languages: ['en', 'es'],
    version: 'v1.0'
  }
];

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
import siteSettings from '../../content/settings/site.json';

export type SiteSettings = typeof siteSettings & {
  downloads?: {
    resources?: Array<{
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
    }>;
  };
};

export function getStaticSiteSettings(): SiteSettings {
  return siteSettings as SiteSettings;
}

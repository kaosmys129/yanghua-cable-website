import type { Locale } from './loaders';
import { loadSiteSettings } from './loaders';

type LegacySiteSettings = {
  brandName?: string;
  siteName?: string;
  defaultLocale?: Locale;
  locales?: Locale[];
  navigation?: Record<
    Locale,
    {
      items?: Array<{ label: string; href: string }>;
      ctaLabel?: string;
    }
  >;
  contact?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    address?: Record<Locale, string>;
  };
  footer?: Record<
    Locale,
    {
      description?: string;
      copyright?: string;
      links?: Record<string, { label: string; href: string }>;
      sections?: Record<
        string,
        {
          title?: string;
          items?: Array<{ label: string; href: string }>;
        }
      >;
    }
  >;
  seo?: {
    defaultTitle?: string;
    defaultDescription?: string;
    defaultOgImage?: string;
  };
};

export type NormalizedNavItem = { label: string; href: string };

export type NormalizedSiteSettings = {
  locale: Locale;
  brand: {
    name: string;
    siteName: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    defaultOgImage: string;
  };
  navigation: {
    items: NormalizedNavItem[];
    ctaLabel: string;
  };
  client: {
    email: string;
    phoneRaw: string;
    phoneForTel: string;
    phoneFormatted: string;
    whatsappRaw: string;
    whatsappForTel: string;
    addressText: string;
  };
  footer: {
    description: string;
    copyright: string;
    links: Array<{ label: string; href: string }>;
    sections: Array<{ title: string; items: NormalizedNavItem[] }>;
  };
};

function normalizeTel(value: string): string {
  return String(value || '').replace(/[^\d+]/g, '');
}

function pickLocaleText(map: Record<string, any> | undefined, locale: Locale): string {
  if (!map) return '';
  return String(map[locale] ?? map.en ?? map.es ?? '');
}

export async function loadAndNormalizeSiteSettings(locale: Locale): Promise<NormalizedSiteSettings> {
  const raw = (await loadSiteSettings<LegacySiteSettings>()) || {};

  const brandName = String(raw.brandName || raw.siteName || 'Yanghua Cable');
  const siteName = String(raw.siteName || raw.brandName || brandName);

  const nav = raw.navigation?.[locale] ?? raw.navigation?.[raw.defaultLocale || 'en'];
  const navItems = (nav?.items || []).filter((x) => x?.label && x?.href) as NormalizedNavItem[];
  const ctaLabel = String(nav?.ctaLabel || (locale === 'es' ? 'Solicitar cotización' : 'Get Quote'));

  const email = String(raw.contact?.email || '');
  const phoneRaw = String(raw.contact?.phone || '');
  const phoneForTel = normalizeTel(phoneRaw);
  const phoneFormatted = phoneRaw || phoneForTel;

  const whatsappRaw = String(raw.contact?.whatsapp || '');
  const whatsappForTel = normalizeTel(whatsappRaw);

  const addressText = pickLocaleText(raw.contact?.address as any, locale);

  const footer = raw.footer?.[locale] ?? raw.footer?.[raw.defaultLocale || 'en'];
  const footerDescription = String(footer?.description || '');
  const footerCopyright = String(footer?.copyright || `© {year} ${brandName}. All rights reserved.`);
  const footerLinks = Object.values(footer?.links || {}).filter((x) => x?.label && x?.href) as Array<{
    label: string;
    href: string;
  }>;
  const footerSections = Object.values(footer?.sections || {})
    .filter((s) => s?.title)
    .map((s) => ({
      title: String(s?.title || ''),
      items: (s?.items || []).filter((x) => x?.label && x?.href) as NormalizedNavItem[],
    }));

  const defaultTitle = String(raw.seo?.defaultTitle || brandName);
  const defaultDescription = String(raw.seo?.defaultDescription || footerDescription || brandName);
  const defaultOgImage = String(raw.seo?.defaultOgImage || '/og-image.png');

  return {
    locale,
    brand: { name: brandName, siteName },
    seo: { defaultTitle, defaultDescription, defaultOgImage },
    navigation: { items: navItems, ctaLabel },
    client: {
      email,
      phoneRaw,
      phoneForTel,
      phoneFormatted,
      whatsappRaw,
      whatsappForTel,
      addressText,
    },
    footer: {
      description: footerDescription,
      copyright: footerCopyright,
      links: footerLinks,
      sections: footerSections,
    },
  };
}


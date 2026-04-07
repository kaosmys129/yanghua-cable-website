import fs from 'fs';
import path from 'path';
import { loadArticleDocuments } from './lib/news-import.ts';

type Locale = 'en' | 'es';

const root = process.cwd();
const contentRoot = path.join(root, 'content');
const messagesRoot = path.join(root, 'src', 'messages');

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function resetDirectory(dirPath: string, extension: string) {
  ensureDir(dirPath);
  for (const entry of fs.readdirSync(dirPath)) {
    if (entry.endsWith(extension)) {
      fs.rmSync(path.join(dirPath, entry));
    }
  }
}

function writeJson(filePath: string, value: unknown) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeMdx(filePath: string, frontmatter: Record<string, unknown>, body: string) {
  ensureDir(path.dirname(filePath));
  const payload = `---\n${JSON.stringify(frontmatter, null, 2)}\n---\n\n${body.trim()}\n`;
  fs.writeFileSync(filePath, payload, 'utf8');
}

function loadMessages(locale: Locale) {
  return JSON.parse(fs.readFileSync(path.join(messagesRoot, `${locale}.json`), 'utf8'));
}

function buildPageContent(locale: Locale) {
  const messages = loadMessages(locale);

  return {
    home: {
      translationKey: 'home',
      locale,
      hero: messages.hero,
      companyStrength: messages.companyStrength,
      applicationAreas: messages.applicationAreas,
      partners: messages.partners,
    },
    about: {
      translationKey: 'about',
      locale,
      content: messages.about ?? {},
    },
    contact: {
      translationKey: 'contact',
      locale,
      content: messages.contact ?? {},
    },
    partners: {
      translationKey: 'partners',
      locale,
      content: messages.partners ?? {},
    },
    services: {
      translationKey: 'services',
      locale,
      content: messages.services ?? {},
    },
    privacy: {
      translationKey: 'privacy',
      locale,
      content: messages.privacy ?? {},
    },
    terms: {
      translationKey: 'terms',
      locale,
      content: messages.terms ?? {},
    },
  };
}

function buildSiteSettings() {
  return {
    brandName: 'Yanghua Cable',
    siteName: 'Yanghua Cable',
    defaultLocale: 'en',
    locales: ['en', 'es'],
    logo: {
      textPrimary: 'Yanghua',
      textAccent: 'STI',
    },
    contact: {
      email: 'info@yhflexiblebusbar.com',
      phone: '+86-769-3893-9888',
      whatsapp: '+86-138-2698-2553',
      address: 'Dongguan, Guangdong, China',
    },
    seo: {
      defaultTitle: 'Yanghua Cable - Professional Cable Solutions',
      defaultDescription:
        'Leading manufacturer of flexible busbars and cable solutions for industrial applications.',
      defaultOgImage: '/images/og-home.jpg',
    },
  };
}

function buildHubs(locale: Locale, featuredArticleSlugs: string[]) {
  return [
    {
      fileName: 'retrofit-fast-installation',
      frontmatter: {
        sourceId: 1,
        translationKey: 'retrofit-fast-installation',
        locale,
        slug: 'retrofit-fast-installation',
        title:
          locale === 'es'
            ? 'Instalacion Rapida para Reacondicionamiento'
            : 'Fast Retrofit Installation',
        intro:
          locale === 'es'
            ? 'Guia tematica sobre reacondicionamiento rapido con barras flexibles de alta corriente.'
            : 'Topic hub for fast retrofit installation with high-current flexible busbars.',
        cover: {
          src: '/images/projects-home/huawei-data-center-expansion.webp',
          alt:
            locale === 'es'
              ? 'Instalacion rapida para reacondicionamiento'
              : 'Fast retrofit installation',
        },
        featuredArticleSlugs: featuredArticleSlugs.slice(0, 2),
      },
      body:
        locale === 'es'
          ? '## Instalacion modular\n\nReduzca tiempos de parada con rutas flexibles y menos retrabajo.'
          : '## Modular installation\n\nReduce downtime with flexible routing and less rework.',
    },
    {
      fileName: 'high-current-safer-distribution',
      frontmatter: {
        sourceId: 2,
        translationKey: 'high-current-safer-distribution',
        locale,
        slug: 'high-current-safer-distribution',
        title:
          locale === 'es'
            ? 'Distribucion Segura de Alta Corriente'
            : 'Safer High-Current Distribution',
        intro:
          locale === 'es'
            ? 'Tema editorial sobre estabilidad energetica, temperatura de contacto y cumplimiento.'
            : 'Editorial hub focused on power stability, contact temperature and compliance.',
        cover: {
          src: '/images/news/data-center-comparison.jpg',
          alt:
            locale === 'es'
              ? 'Distribucion segura de alta corriente'
              : 'Safer high-current distribution',
        },
        featuredArticleSlugs: featuredArticleSlugs.slice(1, 4),
      },
      body:
        locale === 'es'
          ? '## Cumplimiento y confiabilidad\n\nConozca materiales, disipacion termica y casos de uso.'
          : '## Compliance and reliability\n\nExplore materials, thermal management and use cases.',
    },
    {
      fileName: 'custom-busbar-systems',
      frontmatter: {
        sourceId: 3,
        translationKey: 'custom-busbar-systems',
        locale,
        slug: 'custom-busbar-systems',
        title:
          locale === 'es'
            ? 'Sistemas de Barra Flexible Personalizados'
            : 'Custom Flexible Busbar Systems',
        intro:
          locale === 'es'
            ? 'Tema editorial sobre soluciones personalizadas, terminaciones y accesorios.'
            : 'Editorial hub for customized solutions, terminations and accessory options.',
        cover: {
          src: '/images/news/technical-whitepaper.jpg',
          alt:
            locale === 'es'
              ? 'Sistemas de barra flexible personalizados'
              : 'Custom flexible busbar systems',
        },
        featuredArticleSlugs: featuredArticleSlugs.slice(2, 5),
      },
      body:
        locale === 'es'
          ? '## Soluciones a medida\n\nLongitudes, terminaciones y accesorios para escenarios industriales.'
          : '## Tailored solutions\n\nLengths, terminations and accessories for industrial scenarios.',
    },
  ];
}

function main() {
  ensureDir(contentRoot);
  writeJson(path.join(contentRoot, 'settings', 'site.json'), buildSiteSettings());

  const articleDocuments = loadArticleDocuments(root);

  for (const locale of ['en', 'es'] as const) {
    const pages = buildPageContent(locale);
    for (const [pageKey, value] of Object.entries(pages)) {
      writeJson(path.join(contentRoot, 'pages', locale, `${pageKey}.json`), value);
    }

    const articlesDir = path.join(contentRoot, 'articles', locale);
    const hubsDir = path.join(contentRoot, 'hubs', locale);
    resetDirectory(articlesDir, '.mdx');
    resetDirectory(hubsDir, '.mdx');

    articleDocuments[locale].forEach((document) => {
      writeMdx(path.join(articlesDir, document.fileName), document.frontmatter, document.body);
    });

    for (const hub of buildHubs(
      locale,
      articleDocuments[locale].map((document) => document.frontmatter.slug)
    )) {
      writeMdx(path.join(hubsDir, `${hub.fileName}.mdx`), hub.frontmatter, hub.body);
    }
  }
}

main();

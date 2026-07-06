import {
  buildArticlesMapPayload,
  buildLlmsTxt,
  buildSitemapXml,
  normalizeArticleModule,
  normalizeHubModule,
  sortArticlesByDate,
} from './articles-core.mjs';

export const YANGHUA_SITE_URL = 'https://www.yhflexiblebusbar.com';

// ── 双源 glob：优先 prebuild 复制的本地内容，其次旧站原始路径（本地开发兼容）──
// 注意：import.meta.glob 是 Vite 编译时功能，这里定义两组按模块位置解析的 glob

// 本地 prebuild 路径（相对于 src/lib/yanghua/ → src/data/legacy-content/content/）
const localArticleModules = {
  en: import.meta.glob('../../data/legacy-content/content/articles/en/*.mdx', { eager: true }),
  es: import.meta.glob('../../data/legacy-content/content/articles/es/*.mdx', { eager: true }),
  pt: import.meta.glob('../../data/legacy-content/content/articles/pt/*.mdx', { eager: true }),
};

const localHubModules = {
  en: import.meta.glob('../../data/legacy-content/content/hubs/en/*.mdx', { eager: true }),
  es: import.meta.glob('../../data/legacy-content/content/hubs/es/*.mdx', { eager: true }),
  pt: import.meta.glob('../../data/legacy-content/content/hubs/pt/*.mdx', { eager: true }),
};

// 原始旧站路径（相对于 src/lib/yanghua/ → yanghua-b2b-website/content/）
const legacyArticleModules = {
  en: import.meta.glob('../../../../yanghua-b2b-website/content/articles/en/*.mdx', { eager: true }),
  es: import.meta.glob('../../../../yanghua-b2b-website/content/articles/es/*.mdx', { eager: true }),
  pt: import.meta.glob('../../../../yanghua-b2b-website/content/articles/pt/*.mdx', { eager: true }),
};

const legacyHubModules = {
  en: import.meta.glob('../../../../yanghua-b2b-website/content/hubs/en/*.mdx', { eager: true }),
  es: import.meta.glob('../../../../yanghua-b2b-website/content/hubs/es/*.mdx', { eager: true }),
  pt: import.meta.glob('../../../../yanghua-b2b-website/content/hubs/pt/*.mdx', { eager: true }),
};

// 运行时选择：prebuild 本地内容优先
const articleModules = Object.keys(localArticleModules.en).length > 0 ? localArticleModules : legacyArticleModules;
const hubModules = Object.keys(localHubModules.en).length > 0 ? localHubModules : legacyHubModules;

function asLocale(locale) {
  return locale === 'es' ? 'es' : locale === 'pt' ? 'pt' : 'en';
}

function withContent(entry) {
  const [path, mod] = entry;
  const article = normalizeArticleModule({
    path,
    frontmatter: mod.frontmatter ?? {},
  });

  return {
    ...article,
    Content: mod.default,
  };
}

function withHubContent(entry) {
  const [path, mod] = entry;
  const hub = normalizeHubModule({
    path,
    frontmatter: mod.frontmatter ?? {},
  });

  return {
    ...hub,
    Content: mod.default,
  };
}

export function getArticles(locale, options = {}) {
  const normalizedLocale = asLocale(locale);
  const publicOnly = options.publicOnly !== false;
  const articles = Object.entries(articleModules[normalizedLocale]).map(withContent);
  return sortArticlesByDate(publicOnly ? articles.filter((article) => article.isPublic) : articles);
}

export function getAllArticles(options = {}) {
  return ['en', 'es', 'pt'].flatMap((locale) => getArticles(locale, options));
}

export function getHubs(locale) {
  const normalizedLocale = asLocale(locale);
  return Object.entries(hubModules[normalizedLocale])
    .map(withHubContent)
    .sort((left, right) => left.title.localeCompare(right.title));
}

export function getAllHubs() {
  return ['en', 'es', 'pt'].flatMap((locale) => getHubs(locale));
}

export function getArticleStaticPaths(locale) {
  return getArticles(locale).map((article) => ({
    params: { slug: article.slug },
    props: { article, Content: article.Content },
  }));
}

export function getHubStaticPaths(locale) {
  return getHubs(locale).map((hub) => ({
    params: { slug: hub.slug },
    props: { hub, Content: hub.Content },
  }));
}

export function getArticlesMapPayload(options = {}) {
  return buildArticlesMapPayload({
    siteUrl: options.siteUrl || YANGHUA_SITE_URL,
    articles: getAllArticles(),
    hubs: getAllHubs(),
    generatedAt: options.generatedAt,
  });
}

export function getLlmsTxt(options = {}) {
  return buildLlmsTxt({
    siteUrl: options.siteUrl || YANGHUA_SITE_URL,
    articles: getAllArticles(),
    hubs: getAllHubs(),
  });
}

export function getSitemapXml(options = {}) {
  return buildSitemapXml({
    siteUrl: options.siteUrl || YANGHUA_SITE_URL,
    articles: getAllArticles(),
    hubs: getAllHubs(),
  });
}

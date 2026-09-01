import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const astroRoot = process.cwd();
const contentRoot = path.resolve(astroRoot, 'src/data/legacy-content/content');
const outputPath = path.resolve(astroRoot, '..', 'exports/seo-content-governance/page-asset-ledger.json');
const assignmentPath = path.resolve(astroRoot, 'src/data/legacy-content/content/seo-page-assignments.json');
const locales = ['en', 'es', 'pt'];
const articleBase = { en: '/en/articles', es: '/es/articulos', pt: '/pt/artigos' };
const hubBase = { en: '/en/articles/hub', es: '/es/articulos/hub', pt: '/pt/artigos/hub' };
const assignments = JSON.parse(fs.readFileSync(assignmentPath, 'utf8'));
const assignmentsByPath = new Map(
  assignments.flatMap((assignment) => Object.entries(assignment.paths).map(([locale, url]) => [url, {
    ...assignment,
    locale,
    primaryQuery: assignment.primaryQueries[locale],
  }]))
);

const clusterDefinitions = [
  { id: 'data-center', terms: ['data center', 'datacenter', 'server farm', 'cloud facility', 'colocation', 'hyperscale'], primary: '/en/solutions/data-center' },
  { id: 'energy-storage', terms: ['energy storage', 'battery energy', 'bess', 'battery cabinet', 'pcs', 'solar pv', 'photovoltaic'], primary: '/en/solutions/new-energy' },
  { id: 'ev-charging', terms: ['ev charging', 'charging station', 'charging pile', 'fast charging', 'electric vehicle'], primary: '/en/solutions/charging-station' },
  { id: 'comparison', terms: ['parallel cable', 'multiple cable', 'busduct', 'cable tray', 'vs cable', 'comparison', 'tco'], primary: '/en/articles/hub/flexible-busbar-vs-cable' },
  { id: 'manufacturing', terms: ['manufacturing', 'industrial plant', 'factory', 'automation', 'chemical plant', 'steel mill'], primary: '/en/solutions/manufacturing' },
  { id: 'general', terms: ['flexible busbar', 'high current', 'power distribution', 'installation', 'manufacturer', 'supplier'], primary: '/en/articles/hub/high-current-power-distribution' },
];

function filesIn(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((filename) => filename.endsWith('.mdx'))
    .sort()
    .map((filename) => path.join(directory, filename));
}

function text(value) {
  return String(value ?? '').trim();
}

function normalized(value) {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function bodyWordCount(body) {
  return text(body).split(/\s+/).filter(Boolean).length;
}

function extractInternalLinks(body) {
  return [...text(body).matchAll(/\]\((\/[^)#?\s]+)[^)]*\)/g)].map((match) => match[1]);
}

function findCluster(value) {
  const source = normalized(value);
  return clusterDefinitions.find((cluster) => cluster.terms.some((term) => source.includes(term))) ?? clusterDefinitions.at(-1);
}

function statusOf(data) {
  if (data.draft === true || data.published === false) return 'draft';
  const status = text(data.geoflow?.status || data.geoflow?.reviewStatus);
  return status || 'legacy';
}

function parsePage(file, locale, type) {
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : {};
  const slug = text(data.slug) || path.basename(file, '.mdx');
  const isHub = type === 'hub';
  const url = `${isHub ? hubBase[locale] : articleBase[locale]}/${slug}`;
  const title = text(data.seo?.title || data.metaTitle || data.title || slug);
  const description = text(data.seo?.description || data.description || data.summary || data.metaDescription || data.intro);
  const queries = Array.isArray(data.geo?.targetQueries) ? data.geo.targetQueries.filter(Boolean) : [];
  const citations = Array.isArray(data.geo?.citations) ? data.geo.citations.filter(Boolean) : [];
  const relatedProducts = Array.isArray(data.geo?.relatedProductIds) ? data.geo.relatedProductIds.filter(Boolean) : [];
  const relatedSolutions = Array.isArray(data.geo?.relatedSolutionIds) ? data.geo.relatedSolutionIds.filter(Boolean) : [];
  const cluster = findCluster([slug, title, description, ...queries].join(' '));
  const assignment = assignmentsByPath.get(url) ?? null;
  const evidenceSignals = [
    citations.length > 0,
    /\b(iec|ul|vde|standard|test|tested|calculation|case study|project|measurement|amp|a\b|kw\b|mw\b)/i.test(parsed.content),
    /(^|\n)\s*[-*]\s+/.test(parsed.content),
  ];

  return {
    url,
    locale,
    type,
    slug,
    sourceFile: path.relative(path.resolve(astroRoot, '..'), file),
    title,
    description,
    translationKey: text(data.translationKey) || null,
    status: statusOf(data),
    publishedAt: text(data.publishedAt || data.createdAt) || null,
    updatedAt: text(data.updatedAt || data.publishedAt || data.createdAt) || null,
    topicCluster: cluster.id,
    primaryPage: cluster.primary,
    targetQueries: queries,
    buyerIntent: text(data.geo?.buyerIntent) || null,
    bodyWords: bodyWordCount(parsed.content),
    internalLinks: extractInternalLinks(parsed.content),
    internalLinkCount: extractInternalLinks(parsed.content).length,
    evidence: {
      citations: citations.length,
      hasAnswerSummary: Boolean(text(data.geo?.answerSummary)),
      hasTechnicalSignals: evidenceSignals[1],
      hasStructuredLists: evidenceSignals[2],
      score: evidenceSignals.filter(Boolean).length,
    },
    relatedProductIds: relatedProducts,
    relatedSolutionIds: relatedSolutions,
    ...(assignment ? {
      seoAssignment: {
        id: assignment.id,
        translationKey: assignment.translationKey,
        pageRole: assignment.pageRole,
        primaryQuery: assignment.primaryQuery,
        secondaryQueries: assignment.secondaryQueries,
        intent: assignment.intent,
        evidenceStatus: assignment.evidenceStatus,
        reviewStatus: assignment.reviewStatus,
      },
    } : {}),
    governance: {
      disposition: 'review',
      gsc: { clicks: null, impressions: null, indexed: null, lastCrawl: null },
      notes: 'Populate GSC/GA4/RFQ fields before merge, noindex, or 410 decisions.',
    },
  };
}

export function buildPageLedger() {
  const pages = [];
  for (const locale of locales) {
    pages.push(...filesIn(path.join(contentRoot, 'articles', locale)).map((file) => parsePage(file, locale, 'article')));
    pages.push(...filesIn(path.join(contentRoot, 'hubs', locale)).map((file) => parsePage(file, locale, 'hub')));
  }

  return {
    generatedAt: new Date().toISOString(),
    site: 'https://www.yhflexiblebusbar.com',
    policy: {
      strategy: 'evidence-first',
      primaryLocale: 'en',
      destructiveActionsRequireSnapshot: true,
      allowedDispositions: ['keep', 'merge', 'support', 'noindex', '410', 'review'],
    },
    clusterDefinitions,
    summary: {
      totalPages: pages.length,
      byLocale: Object.fromEntries(locales.map((locale) => [locale, pages.filter((page) => page.locale === locale).length])),
      byType: {
        article: pages.filter((page) => page.type === 'article').length,
        hub: pages.filter((page) => page.type === 'hub').length,
      },
      needsGscSnapshot: pages.length,
      lowEvidencePages: pages.filter((page) => page.evidence.score < 2).length,
      pagesWithoutDescription: pages.filter((page) => !page.description).length,
      plannedSeoAssignments: assignments.length * locales.length,
      mappedSeoAssignments: pages.filter((page) => page.seoAssignment).length,
    },
    pages,
  };
}

function verify(ledger) {
  const errors = [];
  const warnings = [];
  const urls = new Set();
  const titlesByLocale = new Map();
  const primaryQueriesByLocale = new Map();

  for (const page of ledger.pages) {
    if (urls.has(page.url)) errors.push(`Duplicate URL: ${page.url}`);
    urls.add(page.url);
    if (!page.title) errors.push(`Missing title: ${page.sourceFile}`);
    if (!page.description) warnings.push(`Missing description: ${page.url}`);
    if (page.type === 'article' && page.bodyWords < 120) warnings.push(`Thin article body (${page.bodyWords} words): ${page.url}`);
    const titleKey = `${page.locale}:${page.title.toLowerCase()}`;
    if (titlesByLocale.has(titleKey)) warnings.push(`Duplicate same-locale title: ${page.url} and ${titlesByLocale.get(titleKey)}`);
    titlesByLocale.set(titleKey, page.url);
    if (page.locale === 'en' && page.status !== 'draft' && page.type === 'article' && page.evidence.score < 2) {
      warnings.push(`Low evidence score (${page.evidence.score}/3): ${page.url}`);
    }
    if (page.seoAssignment?.evidenceStatus === 'needs_source') {
      warnings.push(`SEO assignment needs source review: ${page.url}`);
    }
    if (page.seoAssignment?.primaryQuery) {
      const queryKey = `${page.locale}:${page.seoAssignment.primaryQuery.toLocaleLowerCase()}`;
      if (primaryQueriesByLocale.has(queryKey)) {
        errors.push(`Duplicate primary query: ${page.seoAssignment.primaryQuery} (${page.locale}) on ${page.url} and ${primaryQueriesByLocale.get(queryKey)}`);
      }
      primaryQueriesByLocale.set(queryKey, page.url);
    }
  }

  for (const locale of locales) {
    for (const page of ledger.pages.filter((candidate) => candidate.locale === locale && candidate.type === 'hub')) {
      if (!page.description) warnings.push(`Hub needs an editorial description: ${page.url}`);
    }
  }

  return { errors, warnings };
}

const ledger = buildPageLedger();
const result = verify(ledger);
console.log(JSON.stringify({ summary: ledger.summary, errors: result.errors.length, warnings: result.warnings.length }, null, 2));
for (const warning of result.warnings.slice(0, 40)) console.warn(`⚠ ${warning}`);
if (result.warnings.length > 40) console.warn(`⚠ ... and ${result.warnings.length - 40} more warnings`);
for (const error of result.errors) console.error(`✗ ${error}`);

if (process.argv.includes('--write')) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(ledger, null, 2)}\n`);
  console.log(`Wrote ${path.relative(path.resolve(astroRoot, '..'), outputPath)}`);
}

if (process.argv.includes('--check') && result.errors.length > 0) process.exitCode = 1;

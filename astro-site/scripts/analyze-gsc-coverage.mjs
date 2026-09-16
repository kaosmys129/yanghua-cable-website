import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const astroRoot = process.cwd();
const repoRoot = path.resolve(astroRoot, '..');
const distRoot = path.resolve(astroRoot, 'dist/client');
const defaultOutputDir = path.resolve(repoRoot, 'exports/seo-content-governance');
const astroConfig = fs.readFileSync(path.resolve(astroRoot, 'astro.config.mjs'), 'utf8');
const configuredRedirects = new Map(
  [...astroConfig.matchAll(/['"]([^'"]+)['"]:\s*\{\s*status:\s*(?:301|308),\s*destination:\s*['"]([^'"]+)['"]/g)]
    .map((match) => [normalizePath(match[1]), match[2]]),
);

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function readCoverageRows(zipPath) {
  const csv = execFileSync('unzip', ['-p', zipPath, '*.csv'], { encoding: 'utf8' });
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.match(/^(https?:\/\/[^,]+),(\d{4}-\d{2}-\d{2})/))
    .filter(Boolean)
    .map((match) => ({ url: match[1], lastCrawl: match[2] }));
}

function normalizePath(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const url = new URL(raw, 'https://www.yhflexiblebusbar.com');
  const pathname = decodeURIComponent(url.pathname).replace(/\/+$/, '');
  return pathname || '/';
}

function outputFileFor(url) {
  const pathname = normalizePath(url);
  const relative = pathname === '/' ? 'index.html' : `${pathname.slice(1)}/index.html`;
  return path.join(distRoot, relative);
}

function inspectBuiltRoute(url) {
  const file = outputFileFor(url);
  if (!fs.existsSync(file)) return { built: false, file: null, canonical: null, robots: null, refresh: false };
  const html = fs.readFileSync(file, 'utf8');
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1] || null;
  const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i)?.[1] || null;
  return {
    built: true,
    file: path.relative(repoRoot, file),
    canonical,
    robots,
    refresh: /http-equiv=["']refresh["']/i.test(html),
  };
}

function contentType(url) {
  const pathname = normalizePath(url);
  if (/\/articles?\//.test(pathname) || /\/articulos?\//.test(pathname) || /\/artigos?\//.test(pathname)) return 'article';
  if (/\/solutions?\//.test(pathname) || /\/soluciones?\//.test(pathname) || /\/solucoes?\//.test(pathname)) return 'solution';
  if (/\/products?\//.test(pathname) || /\/productos?\//.test(pathname) || /\/produtos?\//.test(pathname)) return 'product';
  if (/\/projects?\b/.test(pathname) || /\/proyectos?\b/.test(pathname) || /\/projetos?\b/.test(pathname)) return 'project';
  if (/\/contact|\/services?|\/servicios|\/servicos/.test(pathname)) return 'utility';
  return 'index-or-category';
}

function classify(row, state) {
  const type = contentType(row.url);
  if (/canonical/i.test(state)) {
    if (row.redirectTarget) return 'one-hop-redirect-to-canonical-target';
    if (!row.built) return 'inspect-legacy-route-before-canonical-change';
    if (row.refresh) return 'replace-internal-link-and-remove-redirect-from-sitemap';
    return 'verify-google-selected-canonical-with-url-inspection';
  }
  if (row.redirectTarget) return 'one-hop-redirect-to-canonical-target';
  if (!row.built) return 'inspect-legacy-route-before-content-decision';
  if (type === 'article' || type === 'product' || type === 'solution') return 'retain-and-improve-evidence-and-internal-links';
  if (type === 'utility' || type === 'index-or-category') return 'review-page-purpose-and-indexing-eligibility';
  return 'review-project-evidence-and-unique-value';
}

function makeRows(zipPath, state) {
  return readCoverageRows(zipPath).map((row) => {
    const built = inspectBuiltRoute(row.url);
    const normalized = normalizePath(row.url);
    const redirectTarget = configuredRedirects.get(normalized) || null;
    const canonicalMatches = built.canonical ? normalizePath(built.canonical) === normalized : null;
    return {
      url: row.url,
      normalizedPath: normalized,
      locale: normalized.match(/^\/(en|es|pt)(?=\/|$)/)?.[1] || 'root',
      type: contentType(row.url),
      state,
      lastCrawl: row.lastCrawl,
      builtRoute: built.built,
      builtFile: built.file,
      builtCanonical: built.canonical,
      builtCanonicalMatchesUrl: canonicalMatches,
      builtRobots: built.robots,
      builtRefreshDocument: built.refresh,
      configuredRedirectTarget: redirectTarget,
      redirectTarget,
      recommendedAction: classify({ ...row, ...built, redirectTarget }, state),
      source: 'Google Search Console coverage export 2026-09-16',
    };
  });
}

const canonicalZip = arg('--canonical-zip');
const crawledZip = arg('--crawled-zip');
if (!canonicalZip || !crawledZip) {
  throw new Error('Usage: node scripts/analyze-gsc-coverage.mjs --canonical-zip <zip> --crawled-zip <zip>');
}

const canonicalRows = makeRows(canonicalZip, 'Duplicate, Google chose different canonical than user');
const crawledRows = makeRows(crawledZip, 'Crawled - currently not indexed');
const allRows = [...canonicalRows, ...crawledRows];
const uniqueByPath = new Map();
for (const row of allRows) uniqueByPath.set(`${row.state}:${row.normalizedPath}`, row);

const snapshotPath = path.join(defaultOutputDir, 'gsc-url-snapshot.json');
const reportPath = path.join(defaultOutputDir, 'gsc-coverage-analysis.json');
const snapshot = {
  generatedAt: new Date().toISOString(),
  source: 'Google Search Console coverage exports downloaded 2026-09-16',
  rows: [...uniqueByPath.values()].map((row) => ({
    url: row.url,
    state: row.state,
    lastCrawl: row.lastCrawl,
    source: row.source,
  })),
};
const report = {
  generatedAt: snapshot.generatedAt,
  source: snapshot.source,
  summary: {
    canonicalRowsExported: canonicalRows.length,
    crawledNotIndexedRowsExported: crawledRows.length,
    canonicalRowsUniqueByPath: new Set(canonicalRows.map((row) => row.normalizedPath)).size,
    crawledNotIndexedRowsUniqueByPath: new Set(crawledRows.map((row) => row.normalizedPath)).size,
    canonicalBuiltRoutes: canonicalRows.filter((row) => row.builtRoute).length,
    canonicalMissingBuildRoutes: canonicalRows.filter((row) => !row.builtRoute).length,
    crawledBuiltRoutes: crawledRows.filter((row) => row.builtRoute).length,
    crawledMissingBuildRoutes: crawledRows.filter((row) => !row.builtRoute).length,
    canonicalBuiltSelfCanonical: canonicalRows.filter((row) => row.builtCanonicalMatchesUrl === true).length,
    canonicalBuiltNonSelfCanonical: canonicalRows.filter((row) => row.builtCanonicalMatchesUrl === false).length,
    crawledBuiltNoindex: crawledRows.filter((row) => /noindex/i.test(row.builtRobots || '')).length,
  },
  canonical: canonicalRows,
  crawledNotIndexed: crawledRows,
};

fs.mkdirSync(defaultOutputDir, { recursive: true });
fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ snapshotPath, reportPath, summary: report.summary }, null, 2));

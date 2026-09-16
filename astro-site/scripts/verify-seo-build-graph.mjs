import fs from 'node:fs';
import path from 'node:path';

const distRoot = path.resolve(process.cwd(), 'dist/client');
const siteOrigin = 'https://www.yhflexiblebusbar.com';
const errors = [];
const warnings = [];

if (!fs.existsSync(distRoot)) {
  console.error(`Build output does not exist: ${distRoot}`);
  process.exit(1);
}

function read(relativePath) {
  return fs.readFileSync(path.join(distRoot, relativePath), 'utf8');
}

function normalizePath(value) {
  const url = new URL(value, siteOrigin);
  let pathname = url.pathname;
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');
  return pathname || '/';
}

function fileForPath(pathname) {
  const normalized = normalizePath(pathname);
  return normalized === '/'
    ? path.join(distRoot, 'index.html')
    : path.join(distRoot, normalized.slice(1), 'index.html');
}

function htmlForPath(pathname) {
  const file = fileForPath(pathname);
  if (!fs.existsSync(file)) return null;
  return { file, html: fs.readFileSync(file, 'utf8') };
}

function sitemapUrls() {
  const indexPath = path.join(distRoot, 'sitemap-index.xml');
  if (!fs.existsSync(indexPath)) {
    errors.push('Missing sitemap-index.xml');
    return [];
  }

  const childNames = [...read('sitemap-index.xml').matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((match) => path.basename(new URL(match[1]).pathname));
  const urls = [];
  for (const childName of childNames) {
    const childPath = path.join(distRoot, childName);
    if (!fs.existsSync(childPath)) {
      errors.push(`Sitemap child is missing: ${childName}`);
      continue;
    }
    urls.push(...[...fs.readFileSync(childPath, 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)]
      .map((match) => match[1]));
  }
  return urls;
}

function canonicalFrom(html) {
  return html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1] ?? null;
}

function robotsFrom(html) {
  return html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i)?.[1]?.toLowerCase() ?? '';
}

function hreflangFrom(html) {
  return [...html.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/gi)]
    .map((match) => ({ lang: match[1], href: match[2] }));
}

function internalHref(value) {
  if (!value || value.startsWith('#') || /^(?:mailto|tel|javascript):/i.test(value)) return null;
  try {
    const url = new URL(value, siteOrigin);
    if (url.origin !== siteOrigin) return null;
    return url;
  } catch {
    return null;
  }
}

function isRedirectHtml(html) {
  return /http-equiv=["']refresh["']/i.test(html);
}

function checkTarget(from, rawHref, sitemapSet) {
  const url = internalHref(rawHref);
  if (!url) return;
  const targetPath = normalizePath(url.href);
  if (url.search) errors.push(`${from}: internal link contains query parameters: ${rawHref}`);

  if (/\.(?:txt|xml|json)$/i.test(targetPath)) {
    const resource = path.join(distRoot, targetPath.slice(1));
    if (!fs.existsSync(resource)) errors.push(`${from}: missing internal resource ${rawHref}`);
    return;
  }

  const target = htmlForPath(targetPath);
  if (!target) {
    errors.push(`${from}: internal link does not resolve to a built page: ${rawHref}`);
    return;
  }
  if (isRedirectHtml(target.html)) errors.push(`${from}: internal link points to a redirect page: ${rawHref}`);
  if (!sitemapSet.has(`${siteOrigin}${targetPath}`) && targetPath !== '/404') {
    warnings.push(`${from}: internal link target is not in the canonical sitemap: ${rawHref}`);
  }
}

const urls = sitemapUrls();
const sitemapSet = new Set(urls);
if (sitemapSet.size !== urls.length) errors.push('Sitemap contains duplicate URLs');

for (const url of urls) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    errors.push(`Invalid sitemap URL: ${url}`);
    continue;
  }

  if (parsed.origin !== siteOrigin) errors.push(`Sitemap URL has the wrong origin: ${url}`);
  if (parsed.search || parsed.hash) errors.push(`Sitemap URL contains query/hash: ${url}`);
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) errors.push(`Sitemap URL has trailing slash: ${url}`);

  const pathname = normalizePath(url);
  const page = htmlForPath(pathname);
  if (!page) {
    errors.push(`Sitemap URL has no built HTML: ${url}`);
    continue;
  }
  if (isRedirectHtml(page.html)) errors.push(`Sitemap URL is a redirect page: ${url}`);
  const robots = robotsFrom(page.html);
  if (robots.includes('noindex') || !robots.includes('index')) errors.push(`Sitemap URL is not indexable: ${url}`);
  const canonical = canonicalFrom(page.html);
  if (!canonical || canonical !== url) errors.push(`${url}: canonical is not self-referencing (${canonical ?? 'missing'})`);

  for (const alternate of hreflangFrom(page.html)) {
    if (!sitemapSet.has(alternate.href)) errors.push(`${url}: hreflang target is outside the canonical sitemap: ${alternate.href}`);
  }

  const links = [...page.html.matchAll(/<a\s+[^>]*href=["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const href of links) checkTarget(url, href, sitemapSet);
  const breadcrumb = page.html.match(/<nav[^>]+aria-label=["']Breadcrumb["'][\s\S]*?<\/nav>/i)?.[0] ?? '';
  for (const href of [...breadcrumb.matchAll(/<a\s+[^>]*href=["']([^"']+)["']/gi)].map((match) => match[1])) {
    checkTarget(`${url} breadcrumb`, href, sitemapSet);
  }
}

console.log(JSON.stringify({ sitemapUrls: urls.length, errors: errors.length, warnings: warnings.length }, null, 2));
if (warnings.length) {
  console.warn(warnings.slice(0, 30).join('\n'));
  if (warnings.length > 30) console.warn(`... and ${warnings.length - 30} more warnings`);
}
if (errors.length) {
  console.error(errors.slice(0, 100).join('\n'));
  if (errors.length > 100) console.error(`... and ${errors.length - 100} more errors`);
  process.exitCode = 1;
}

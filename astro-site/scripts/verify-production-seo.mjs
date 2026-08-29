const SITE_ORIGIN = (process.env.SEO_SITE_ORIGIN || 'https://www.yhflexiblebusbar.com').replace(/\/+$/, '');
const CONCURRENCY = Number(process.env.SEO_VERIFY_CONCURRENCY || 12);
const REQUEST_TIMEOUT_MS = Number(process.env.SEO_VERIFY_TIMEOUT_MS || 20_000);

const expectedRedirects = new Map([
  ['/', '/en'],
  ['/blog', '/en/articles'],
  ['/products', '/en/products'],
  ['/solutions', '/en/solutions'],
  ['/projects', '/en/projects'],
  ['/articles', '/en/articles'],
  ['/es/articles', '/es/articulos'],
  ['/es/productos/category/fire-resistant', '/es/productos/categoria/cables-resistentes-al-fuego'],
  ['/es/productos/categoria/general', '/es/productos/categoria/cables-de-proposito-general'],
  [
    '/en/articles/work-resumes-with-good-fortune-everything-is-promising',
    '/en/articles/work-resumes-with-good-fortune-everything-is-promising-532350',
  ],
  [
    '/en/articles/2024-yanghuasti-dongguan-alliance-partner-high-current-flexible-busbar-product-promotion-tomorrow-coming-strong',
    '/en/articles/2024-yanghuasti-dongguan-alliance-partner-high-current-flexible-busbar-product-promotion-tomorrow-coming-strong-507559',
  ],
  [
    '/en/articles/first-academic-monograph-in-fire-resistant-cable-field-yanghuasti-chief-technical-expert-du-jinbiao-and-chief-engineer-hu-runyi-participate-in-writing',
    '/en/articles/first-academic-monograph-in-fire-resistant-cable-field-yanghuasti-chief-technical-expert-du-jinbiao-and-chief-engineer-hu-runyi-participate-in-writing-501651',
  ],
  [
    '/es/articulos/yanghuasti-2024-annual-review-es',
    '/es/articulos/revision-anual-de-yanghuasti-2024-528905',
  ],
  [
    '/es/articles/work-resumes-with-good-fortune-everything-is-promising-es',
    '/es/articulos/reanudacion-del-trabajo-con-buena-fortuna-todo-es-prometedor-532350',
  ],
  ['/services', '/en/services'],
  ['/sitemap.xml', '/sitemap-index.xml'],
  ['/en/products/category/general', '/en/products/category/general-purpose-cables'],
  ['/es/projetos/64', '/es/proyectos/64'],
  ['/pt/proyectos/64', '/pt/projetos/64'],
  ['/es/artigos/hub/custom-busbar-systems', '/es/articulos/hub/custom-busbar-systems'],
  ['/en/products/categoria/fire-resistant', '/en/products/category/fire-resistant-cables'],
  [
    '/en/articles/flexible-busbar-industry-solutions-solar-pv-with-complete-manual-download-instructions',
    '/en/articles/flexible-busbar-industry-solutions-solar-pv-with-complete-manual-download-instructions-517369',
  ],
  [
    '/es/articulos/digital-energy-pioneer-smart-innovation-future-high-current-flexible-busbar-exhibition-highlights-es',
    '/es/articulos/pionero-de-energia-digital-futuro-de-innovacion-inteligente-destacados-de-la-exposicion-de-busbar-de-alta-corriente-flexible-512155',
  ],
  [
    '/es/articulos/shenzhen-china-southern-power-grid-shenzhen-hong-kong-technology-innovation-co-ltd-leadership-visits-yanghuasti-for-exchange-es',
    '/es/articulos/liderazgo-de-shenzhen-china-southern-power-grid-shenzhen-hong-kong-technology-innovation-co-ltd-visita-yanghuasti-para-intercambio-508737',
  ],
  [
    '/es/articulos/2024-yanghuasti-dongguan-alliance-partner-high-current-flexible-busbar-product-promotion-tomorrow-coming-strong-es',
    '/en/articles/2024-yanghuasti-dongguan-alliance-partner-high-current-flexible-busbar-product-promotion-tomorrow-coming-strong-507559',
  ],
  [
    '/en/articles/bendicion-del-ano-de-la-serpiente-prosperidad-y-alegria-deseando-a-todos-un-feliz-ano-nuevo-505792',
    '/es/articulos/bendicion-del-ano-de-la-serpiente-prosperidad-y-alegria-deseando-a-todos-un-feliz-ano-nuevo-505792',
  ],
  [
    '/es/productos/categoria/low-smoke-halogen-free-cables',
    '/es/productos/categoria/cables-libres-de-humo-y-halogenos',
  ],
  [
    '/es/articulos/as-spring-festival-approaches-yanghuasti-wishes-you-a-happy-new-year-es',
    '/en/articles/as-spring-festival-approaches-yanghuasti-wishes-you-a-happy-new-year-532956',
  ],
]);

function canonicalFrom(html) {
  return html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] ?? null;
}

function hreflangAlternatesFrom(html) {
  return [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/gi)]
    .map((match) => ({ hreflang: match[1], href: match[2] }));
}

function seoMetaFrom(html) {
  const decodeHtmlEntities = (value) => value.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
  return {
    title: decodeHtmlEntities(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? ''),
    description: decodeHtmlEntities(html.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? ''),
  };
}

function xmlLocations(xml) {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
}

async function fetchWithTimeout(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      'user-agent': 'Yanghua-SEO-Production-Verifier/1.0',
      ...(options.headers ?? {}),
    },
  });
  return response;
}

async function mapConcurrent(items, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, run));
  return results;
}

const errors = [];
const sitemapIndexResponse = await fetchWithTimeout(`${SITE_ORIGIN}/sitemap-index.xml`);
if (sitemapIndexResponse.status !== 200) {
  throw new Error(`sitemap index returned ${sitemapIndexResponse.status}`);
}

const sitemapIndexXml = await sitemapIndexResponse.text();
const sitemapUrls = xmlLocations(sitemapIndexXml);
if (!sitemapUrls.length) throw new Error('sitemap index contains no child sitemaps');

const sitemapDocuments = await mapConcurrent(sitemapUrls, async (sitemapUrl) => {
  const response = await fetchWithTimeout(sitemapUrl);
  if (response.status !== 200) throw new Error(`${sitemapUrl} returned ${response.status}`);
  return response.text();
});

const urls = sitemapDocuments.flatMap(xmlLocations);
const urlSet = new Set(urls);
if (urlSet.size !== urls.length) errors.push('sitemap contains duplicate URLs');
for (const path of ['/pt', '/pt/produtos', '/pt/projetos', '/pt/artigos']) {
  const expectedUrl = `${SITE_ORIGIN}${path}`;
  if (!urlSet.has(expectedUrl)) errors.push(`sitemap is missing ${expectedUrl}`);
}

const pages = await mapConcurrent(urls, async (url) => {
  try {
    const response = await fetchWithTimeout(url, { redirect: 'manual' });
    const html = await response.text();
    if (response.status !== 200) errors.push(`${url}: expected 200, got ${response.status}`);
    if (canonicalFrom(html) !== url) errors.push(`${url}: self-canonical mismatch (${canonicalFrom(html)})`);
    if (!/<meta name="robots" content="index, follow">/i.test(html)) errors.push(`${url}: missing index, follow robots meta`);
    if (/http-equiv="refresh"/i.test(html)) errors.push(`${url}: contains meta refresh`);
    const { title, description } = seoMetaFrom(html);
    if (!title) errors.push(`${url}: missing title`);
    if (Array.from(title).length > 60) errors.push(`${url}: title exceeds 60 Unicode characters`);
    if (!description) errors.push(`${url}: missing meta description`);
    if (Array.from(description).length > 160) errors.push(`${url}: meta description exceeds 160 Unicode characters`);
    return { url, html, alternates: hreflangAlternatesFrom(html) };
  } catch (error) {
    errors.push(`${url}: fetch failed (${error.message})`);
    return { url, html: '', alternates: [] };
  }
});

const pageByUrl = new Map(pages.map((page) => [page.url, page]));
for (const page of pages) {
  for (const alternate of page.alternates) {
    if (!urlSet.has(alternate.href)) {
      errors.push(`${page.url}: hreflang target is outside canonical sitemap (${alternate.href})`);
      continue;
    }
    if (alternate.hreflang === 'x-default') continue;
    const target = pageByUrl.get(alternate.href);
    if (!target?.alternates.some((candidate) => candidate.href === page.url)) {
      errors.push(`${page.url}: hreflang target does not link back (${alternate.href})`);
    }
  }
}

for (const [source, expectedDestination] of expectedRedirects) {
  const response = await fetchWithTimeout(`${SITE_ORIGIN}${source}`, { redirect: 'manual' });
  const location = response.headers.get('location');
  if (![301, 308].includes(response.status)) {
    errors.push(`${source}: expected permanent redirect, got ${response.status}`);
  }
  if (location !== expectedDestination) {
    errors.push(`${source}: expected Location ${expectedDestination}, got ${location}`);
  }
}

const missingResponse = await fetchWithTimeout(`${SITE_ORIGIN}/seo-verifier-not-found-${Date.now()}`, { redirect: 'manual' });
const missingHtml = await missingResponse.text();
if (missingResponse.status !== 404) errors.push(`404 probe returned ${missingResponse.status}`);
if (!/<meta name="robots" content="noindex, follow">/i.test(missingHtml)) errors.push('404 probe is missing noindex, follow');
if (canonicalFrom(missingHtml)) errors.push(`404 probe exposes canonical ${canonicalFrom(missingHtml)}`);

const result = {
  site: SITE_ORIGIN,
  checkedAt: new Date().toISOString(),
  sitemapFiles: sitemapUrls.length,
  sitemapUrls: urls.length,
  pagesFetched: pages.length,
  redirectsChecked: expectedRedirects.size,
  errors: errors.length,
};

console.log(JSON.stringify(result, null, 2));
if (errors.length) {
  console.error(errors.slice(0, 100).join('\n'));
  if (errors.length > 100) console.error(`... ${errors.length - 100} more errors`);
  process.exitCode = 1;
}

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const SITE_URL = 'https://www.yhflexiblebusbar.com';
const outputRoot = new URL('../.vercel/output/', import.meta.url);
const staticRoot = new URL('static/', outputRoot);
const vercelConfigUrl = new URL('../vercel.json', import.meta.url);

function readOutput(relativePath) {
  return readFileSync(new URL(relativePath, staticRoot), 'utf8');
}

function canonicalFrom(html) {
  return html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] ?? null;
}

function hreflangAlternatesFrom(html) {
  return [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/gi)]
    .map((match) => ({ hreflang: match[1], href: match[2] }));
}

function jsonLdNodesFrom(html) {
  return [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      const value = JSON.parse(match[1]);
      return value['@graph'] ?? [value];
    });
}

function allStringValues(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(allStringValues);
  if (value && typeof value === 'object') return Object.values(value).flatMap(allStringValues);
  return [];
}

test('build emits server-side permanent redirects before static files', () => {
  const config = JSON.parse(readFileSync(new URL('config.json', outputRoot), 'utf8'));
  const filesystemIndex = config.routes.findIndex((route) => route.handle === 'filesystem');
  assert.ok(filesystemIndex > 0, 'redirect routes must run before the filesystem handler');

  const redirects = config.routes.slice(0, filesystemIndex).filter((route) => route.status === 301 || route.status === 308);
  const destinations = redirects.map((route) => route.headers?.Location ?? route.headers?.location ?? route.dest);

  for (const redirect of redirects) {
    const destination = redirect.headers?.Location ?? redirect.headers?.location ?? redirect.dest;
    assert.notEqual(redirect.src, `^${destination}$`, `redirect loop: ${redirect.src}`);
  }

  assert.ok(destinations.includes('/en'), 'root must permanently redirect to /en');
  assert.ok(destinations.includes('/en/articles'), '/blog must permanently redirect to /en/articles');
  assert.ok(destinations.includes('/en/services'), '/services must permanently redirect to /en/services');
  assert.ok(destinations.includes('/sitemap-index.xml'), 'legacy /sitemap.xml must redirect to the canonical sitemap index');
});

test('Vercel exact section redirects run before zero-segment wildcard redirects', () => {
  const config = JSON.parse(readFileSync(vercelConfigUrl, 'utf8'));
  const expected = new Map([
    ['/blog', '/en/articles'],
    ['/products', '/en/products'],
    ['/solutions', '/en/solutions'],
    ['/projects', '/en/projects'],
    ['/articles', '/en/articles'],
    ['/es/products', '/es/productos'],
    ['/es/products/category', '/es/productos'],
    ['/es/solutions', '/es/soluciones'],
    ['/es/projects', '/es/proyectos'],
    ['/pt/products', '/pt/produtos'],
    ['/pt/products/category', '/pt/produtos'],
    ['/pt/solutions', '/pt/solucoes'],
    ['/pt/projects', '/pt/projetos'],
  ]);

  for (const [source, destination] of expected) {
    const exactIndex = config.redirects.findIndex((redirect) => redirect.source === source);
    const wildcardIndex = config.redirects.findIndex((redirect) => redirect.source === `${source}/:path+`);
    assert.ok(exactIndex >= 0, `missing exact Vercel redirect: ${source}`);
    assert.equal(config.redirects[exactIndex].destination, destination);
    assert.equal(config.redirects[exactIndex].statusCode, 301);
    assert.equal(
      config.redirects.some((redirect) => redirect.source === `${source}/:path*`),
      false,
      `zero-segment wildcard would intercept exact redirect: ${source}`
    );
    assert.ok(wildcardIndex < 0 || exactIndex < wildcardIndex, `exact redirect must precede wildcard: ${source}`);
  }
});

test('Vercel retires Search Console legacy Spanish paths with one-hop permanent redirects', () => {
  const config = JSON.parse(readFileSync(vercelConfigUrl, 'utf8'));
  const expected = new Map([
    ['/es/articles', '/es/articulos'],
    ['/es/productos/category', '/es/productos'],
    ['/es/productos/categoria/general', '/es/productos/categoria/cables-de-proposito-general'],
    ['/es/productos/categoria/flame-retardant', '/es/productos/categoria/cables-retardantes-de-llama'],
    ['/es/productos/category/fire-resistant', '/es/productos/categoria/cables-resistentes-al-fuego'],
    ['/es/productos/category/cables-libres-de-humo-y-halogenos', '/es/productos/categoria/cables-libres-de-humo-y-halogenos'],
    [
      '/en/articles/2024-yanghuasti-dongguan-alliance-partner-high-current-flexible-busbar-product-promotion-tomorrow-coming-strong',
      '/en/articles/2024-yanghuasti-dongguan-alliance-partner-high-current-flexible-busbar-product-promotion-tomorrow-coming-strong-507559',
    ],
    [
      '/en/articles/first-academic-monograph-in-fire-resistant-cable-field-yanghuasti-chief-technical-expert-du-jinbiao-and-chief-engineer-hu-runyi-participate-in-writing',
      '/en/articles/first-academic-monograph-in-fire-resistant-cable-field-yanghuasti-chief-technical-expert-du-jinbiao-and-chief-engineer-hu-runyi-participate-in-writing-501651',
    ],
    [
      '/es/:legacySection(articles|articulos)/yanghuasti-2024-annual-review-es',
      '/es/articulos/revision-anual-de-yanghuasti-2024-528905',
    ],
    [
      '/es/:legacySection(articles|articulos)/work-resumes-with-good-fortune-everything-is-promising-es',
      '/es/articulos/reanudacion-del-trabajo-con-buena-fortuna-todo-es-prometedor-532350',
    ],
  ]);

  for (const [source, destination] of expected) {
    const redirect = config.redirects.find((candidate) => candidate.source === source);
    assert.ok(redirect, `missing legacy redirect: ${source}`);
    assert.equal(redirect.destination, destination, source);
    assert.ok(
      redirect.statusCode === 301 || redirect.permanent === true,
      `legacy redirect must be permanent: ${source}`
    );
  }

  const spanishArticlesWildcard = config.redirects.find(
    (redirect) => redirect.source === '/es/articles/:path+'
  );
  assert.equal(spanishArticlesWildcard?.destination, '/es/articulos/:path*');
  assert.equal(spanishArticlesWildcard?.permanent, true);
});

test('Vercel preserves exact GSC legacy equivalents with one-hop permanent redirects', () => {
  const config = JSON.parse(readFileSync(vercelConfigUrl, 'utf8'));
  const expected = new Map([
    ['/es/projetos/64', '/es/proyectos/64'],
    ['/pt/proyectos/64', '/pt/projetos/64'],
    ['/es/artigos/hub/custom-busbar-systems', '/es/articulos/hub/custom-busbar-systems'],
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
    ['/en/products/categoria/fire-resistant', '/en/products/category/fire-resistant-cables'],
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

  for (const [source, destination] of expected) {
    const redirect = config.redirects.find((candidate) => candidate.source === source);
    assert.ok(redirect, `missing exact GSC legacy redirect: ${source}`);
    assert.equal(redirect.destination, destination, source);
    assert.ok(redirect.statusCode === 301 || redirect.permanent === true, source);
  }
});

test('build publishes one canonical sitemap set covering every locale', () => {
  assert.equal(existsSync(new URL('sitemap.xml', staticRoot)), false);
  assert.equal(existsSync(new URL('sitemap-index.xml', staticRoot)), true);
  assert.equal(existsSync(new URL('sitemap-0.xml', staticRoot)), true);

  const indexXml = readOutput('sitemap-index.xml');
  assert.match(indexXml, new RegExp(`<loc>${SITE_URL}/sitemap-0\\.xml</loc>`));

  const xml = readOutput('sitemap-0.xml');
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.ok(urls.length > 0);
  assert.equal(new Set(urls).size, urls.length, 'sitemap URLs must be unique');
  assert.ok(urls.every((url) => /^https:\/\/www\.yhflexiblebusbar\.com\/(en|es|pt)(\/|$)/.test(url)),
    'sitemap must contain canonical locale pages only');
  assert.ok(urls.every((url) => !new URL(url).pathname.endsWith('/')),
    'canonical sitemap URLs must not end with a slash');
  assert.ok(urls.includes(`${SITE_URL}/en/products`));
  assert.ok(urls.includes(`${SITE_URL}/en/projects/1`));
  assert.ok(urls.includes(`${SITE_URL}/es/productos`));
  assert.ok(urls.includes(`${SITE_URL}/pt/produtos`));

  const robots = readOutput('robots.txt');
  assert.match(robots, new RegExp(`Sitemap: ${SITE_URL}/sitemap-index\\.xml`));
});

test('indexable pages expose canonicals matching the no-trailing-slash policy', () => {
  const cases = [
    ['en/index.html', `${SITE_URL}/en`],
    ['en/products/index.html', `${SITE_URL}/en/products`],
    ['en/articles/index.html', `${SITE_URL}/en/articles`],
    ['es/index.html', `${SITE_URL}/es`],
    ['pt/index.html', `${SITE_URL}/pt`],
  ];

  for (const [path, expected] of cases) {
    assert.equal(canonicalFrom(readOutput(path)), expected, path);
  }
});

test('404 output is explicitly non-indexable and has no canonical URL', () => {
  const html = readOutput('404.html');
  assert.match(html, /<meta name="robots" content="noindex, follow">/i);
  assert.equal(canonicalFrom(html), null);
});

test('structured data uses one canonical origin and a crawlable local organization logo', () => {
  const cases = [
    'en/products/flexible-busbar-1500a/index.html',
    'en/projects/1/index.html',
    'en/solutions/data-center/index.html',
    'es/proyectos/1/index.html',
    'pt/solucoes/data-center/index.html',
  ];

  for (const path of cases) {
    const nodes = jsonLdNodesFrom(readOutput(path));
    const organization = nodes.find((node) => node['@type'] === 'Organization');
    assert.equal(organization?.['@id'], `${SITE_URL}/#organization`, path);
    assert.equal(organization?.logo?.url, `${SITE_URL}/favicon.svg`, path);
    assert.ok(existsSync(new URL('favicon.svg', staticRoot)), 'organization logo must exist in build output');

    for (const value of allStringValues(nodes)) {
      if (!value.startsWith(`${SITE_URL}/`)) continue;
      assert.equal(new URL(value).pathname.startsWith('//'), false, `${path}: ${value}`);
    }
  }
});

test('project and solution detail pages identify their visible main entities', () => {
  const projectNodes = jsonLdNodesFrom(readOutput('en/projects/1/index.html'));
  assert.deepEqual(
    projectNodes.map((node) => node['@type']),
    ['Organization', 'WebPage', 'Project', 'BreadcrumbList'],
  );
  assert.equal(projectNodes[1].mainEntity['@id'], `${SITE_URL}/en/projects/1#project`);
  assert.equal(projectNodes[2].name, 'Huawei Data Center Expansion');

  const solutionNodes = jsonLdNodesFrom(readOutput('en/solutions/data-center/index.html'));
  assert.deepEqual(
    solutionNodes.map((node) => node['@type']),
    ['Organization', 'WebPage', 'Service', 'BreadcrumbList'],
  );
  assert.equal(solutionNodes[1].mainEntity['@id'], `${SITE_URL}/en/solutions/data-center#service`);
  assert.equal(solutionNodes[2].name, 'Data Center Flexible Busbar Solutions');
});

test('every sitemap URL is an indexable self-canonical page with reciprocal hreflang targets', () => {
  const xml = readOutput('sitemap-0.xml');
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const urlSet = new Set(urls);

  for (const url of urls) {
    const pathname = decodeURIComponent(new URL(url).pathname).replace(/^\//, '');
    const html = readOutput(`${pathname}/index.html`);
    assert.equal(canonicalFrom(html), url, `self-canonical mismatch: ${url}`);
    assert.match(html, /<meta name="robots" content="index, follow">/i, `not indexable: ${url}`);
    assert.doesNotMatch(html, /http-equiv="refresh"/i, `HTML redirect leaked into sitemap: ${url}`);

    const alternates = hreflangAlternatesFrom(html);
    for (const alternate of alternates) {
      assert.ok(urlSet.has(alternate.href), `hreflang target is not a canonical sitemap URL: ${url} -> ${alternate.href}`);
      if (alternate.hreflang === 'x-default') continue;

      const targetPath = decodeURIComponent(new URL(alternate.href).pathname).replace(/^\//, '');
      const targetAlternates = hreflangAlternatesFrom(readOutput(`${targetPath}/index.html`));
      assert.ok(
        targetAlternates.some((targetAlternate) => targetAlternate.href === url),
        `hreflang target does not link back: ${url} -> ${alternate.href}`
      );
    }

    const headAlternates = new Map(
      alternates
        .filter((alternate) => alternate.hreflang !== 'x-default')
        .map((alternate) => [alternate.hreflang, alternate.href])
    );
    const languageSwitches = [...html.matchAll(/<a href="([^"]+)" hreflang="(en|es|pt)"/gi)]
      .map((match) => ({ href: match[1], hreflang: match[2] }));
    const currentLocale = new URL(url).pathname.split('/')[1];
    assert.deepEqual(
      [...new Set(languageSwitches.map((languageSwitch) => languageSwitch.hreflang))].sort(),
      [...headAlternates.keys()].filter((locale) => locale !== currentLocale).sort(),
      `language switch locales conflict with head alternates: ${url}`
    );
    for (const languageSwitch of languageSwitches) {
      assert.equal(
        new URL(languageSwitch.href, SITE_URL).href,
        headAlternates.get(languageSwitch.hreflang),
        `language switch conflicts with hreflang: ${url} -> ${languageSwitch.href}`
      );
    }
  }
});

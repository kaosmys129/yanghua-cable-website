import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

type Locale = 'en' | 'es';

// Locale-specific path mapping (aligned with middleware pathnames)
const PATHS: Array<{ key: string; en: string; es: string }> = [
  { key: 'home', en: '/', es: '/' },
  { key: 'about', en: '/about', es: '/acerca-de' },
  { key: 'products', en: '/products', es: '/productos' },
  { key: 'solutions', en: '/solutions', es: '/soluciones' },
  { key: 'services', en: '/services', es: '/servicios' },
  { key: 'projects', en: '/projects', es: '/proyectos' },
  { key: 'contact', en: '/contact', es: '/contacto' },
  { key: 'articles', en: '/articles', es: '/articulos' },
];

function buildUrl(baseURL: string, locale: Locale, p: { en: string; es: string }) {
  const localizedPath = p[locale];
  const suffix = localizedPath === '/' ? '' : localizedPath; // /en + '' for home, otherwise /en/products
  return `${baseURL}/${locale}${suffix}`;
}

function toHostIndependent(url: string) {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return url;
  }
}

interface PageResult {
  url: string;
  locale: Locale;
  pathKey: string;
  actualLang: string;
  passLang: boolean;
  hreflangEntries: Array<{ hreflang: string; href: string }>;
  hasEnAlternate: boolean;
  hasEsAlternate: boolean;
  notes?: string;
}

const results: PageResult[] = [];

test.describe('html[lang] & hreflang validation (EN/ES)', () => {
  const locales: Locale[] = ['en', 'es'];

  for (const locale of locales) {
    for (const p of PATHS) {
      const name = `${locale.toUpperCase()} ${p.key}`;
      test(name, async ({ page, baseURL }) => {
        const target = buildUrl(baseURL!, locale, p);
        const response = await page.goto(target, { waitUntil: 'networkidle' });
        expect(response?.status()).toBeGreaterThanOrEqual(200);
        expect(response?.status()).toBeLessThan(400);

        // Extract lang and hreflang
        const data = await page.evaluate(() => {
          const htmlLang = document.documentElement.lang || '';
          const alternates = Array.from(
            document.querySelectorAll('link[rel="alternate"][hreflang]')
          ).map((el) => ({
            hreflang: (el as HTMLLinkElement).hreflang,
            href: (el as HTMLLinkElement).href,
          }));
          return { htmlLang, alternates };
        });

        const hasEn = data.alternates.some((a) => a.hreflang.toLowerCase() === 'en');
        const hasEs = data.alternates.some((a) => a.hreflang.toLowerCase() === 'es');

        const record: PageResult = {
          url: target,
          locale,
          pathKey: p.key,
          actualLang: data.htmlLang,
          passLang: data.htmlLang.toLowerCase() === locale,
          hreflangEntries: data.alternates.map((a) => ({
            hreflang: a.hreflang,
            href: toHostIndependent(a.href),
          })),
          hasEnAlternate: hasEn,
          hasEsAlternate: hasEs,
          notes: !hasEn || !hasEs ? 'Missing one or more hreflang alternates' : undefined,
        };

        results.push(record);

        // Expectations
        expect(record.passLang, `Expected html[lang] to be "${locale}" but got "${record.actualLang}" at ${target}`).toBeTruthy();
        expect(hasEn, `Missing hreflang=en at ${target}`).toBeTruthy();
        expect(hasEs, `Missing hreflang=es at ${target}`).toBeTruthy();
      });
    }
  }

  test.afterAll(async () => {
    // Use process.cwd() to be compatible with ESM test environment
    const outDir = path.resolve(process.cwd(), 'test-results');
    await fs.mkdir(outDir, { recursive: true });
    const jsonPath = path.join(outDir, 'lang-hreflang-validation.json');
    await fs.writeFile(jsonPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2), 'utf-8');

    const htmlPath = path.join(outDir, 'lang-hreflang-validation.html');
    const rows = results
      .map((r) => {
        const hreflangList = r.hreflangEntries
          .map((e) => `${e.hreflang}: ${e.href}`)
          .join('<br/>');
        return `
          <tr>
            <td>${r.locale}</td>
            <td>${r.pathKey}</td>
            <td>${r.url}</td>
            <td>${r.actualLang}</td>
            <td style="color:${r.passLang ? '#136f2d' : '#b00020'}">${r.passLang ? 'PASS' : 'FAIL'}</td>
            <td>${hreflangList || '—'}</td>
            <td>${r.hasEnAlternate && r.hasEsAlternate ? 'OK' : 'Missing'}</td>
            <td>${r.notes || ''}</td>
          </tr>`;
      })
      .join('\n');

    const html = `<!doctype html>
<meta charset="utf-8" />
<title>Lang & Hreflang Validation Report</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif; padding: 24px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
  th { background: #f7f7f7; text-align: left; }
  h1 { margin: 0 0 16px; font-size: 20px; }
  .meta { color: #555; font-size: 12px; margin-bottom: 12px; }
</style>
<h1>Lang & Hreflang Validation Report</h1>
<div class="meta">Generated: ${new Date().toLocaleString()}</div>
<table>
  <thead>
    <tr>
      <th>Locale</th>
      <th>Path</th>
      <th>URL</th>
      <th>html[lang]</th>
      <th>Lang Check</th>
      <th>hreflang alternates</th>
      <th>hreflang Check</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>`;

    await fs.writeFile(htmlPath, html, 'utf-8');
  });
});
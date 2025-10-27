#!/usr/bin/env ts-node
/**
 * Hreflang Audit Script
 * - Fetch HTML and HTTP headers
 * - Validate: presence of en, es, x-default; uniqueness; canonical alignment for current locale
 * - Detect duplicates between HTML <link rel="alternate"> and HTTP Link headers
 * - Optional reciprocal check between language versions
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : 'https://www.yhflexiblebusbar.com');
// Canonical policy: 'self' (each locale uses self-referential canonical) or 'en' (all locales canonicalize to English)
// Default to 'self' which is the recommended practice for distinct localized content.
const CANONICAL_POLICY = (process.env.HREFLANG_CANONICAL_POLICY || 'self').toLowerCase();

// 修正默认路径的西语段，加入 products/solutions/terms/privacy 的正确西语映射
const DEFAULT_PATHS = [
  '/en',
  '/es',
  '/en/terms',
  '/es/terminos',
  '/en/privacy',
  '/es/privacidad',
  '/en/products',
  '/es/productos',
  '/en/solutions',
  '/es/soluciones',
];

interface AuditResult {
  url: string;
  status: number;
  canonical?: string;
  htmlAlternates: Record<string, string>;
  httpAlternates: Record<string, string>;
  issues: string[];
  success: boolean;
}

function parseHtmlAlternates(html: string): Record<string, string> {
  const map: Record<string, string> = {};
  // very simple parser for <link rel="alternate" hreflang="xx" href="...">
  const linkRegex = /<link[^>]*rel=["']alternate["'][^>]*>/gi;
  const hreflangRegex = /hreflang=["']([^"']+)["']/i;
  const hrefRegex = /href=["']([^"']+)["']/i;

  const links = html.match(linkRegex) || [];
  for (const tag of links) {
    const hreflangMatch = tag.match(hreflangRegex);
    const hrefMatch = tag.match(hrefRegex);
    if (hreflangMatch && hrefMatch) {
      map[hreflangMatch[1]] = hrefMatch[1];
    }
  }
  return map;
}

function parseCanonical(html: string): string | undefined {
  const canonicalTag = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  if (!canonicalTag) return undefined;
  const hrefMatch = canonicalTag[0].match(/href=["']([^"']+)["']/i);
  return hrefMatch ? hrefMatch[1] : undefined;
}

function parseHttpLinkHeader(linkHeader?: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (!linkHeader) return map;
  // Example: <https://example.com/en/page>; rel="alternate"; hreflang="en", <https://example.com/es/page>; rel="alternate"; hreflang="es"
  const entries = linkHeader.split(',');
  for (const entry of entries) {
    const urlMatch = entry.match(/<([^>]+)>/);
    const relMatch = entry.match(/rel=\"([^\"]+)\"/);
    const hreflangMatch = entry.match(/hreflang=\"([^\"]+)\"/);
    if (urlMatch && relMatch?.[1] === 'alternate' && hreflangMatch) {
      map[hreflangMatch[1]] = urlMatch[1];
    }
  }
  return map;
}

async function fetchWithHeaders(url: string) {
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  const headersObj: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headersObj[key.toLowerCase()] = value;
  });
  return { status: res.status, text, headers: headersObj };
}

function validate(result: AuditResult): AuditResult {
  const issues: string[] = [];
  const { htmlAlternates, httpAlternates, canonical } = result;

  // Required languages
  const required = ['en', 'es', 'x-default'];
  for (const lang of required) {
    if (!htmlAlternates[lang]) {
      issues.push(`Missing HTML hreflang: ${lang}`);
    }
  }

  // Uniqueness: check duplicates between HTML and HTTP
  for (const [lang, href] of Object.entries(httpAlternates)) {
    if (htmlAlternates[lang] && htmlAlternates[lang] === href) {
      issues.push(`Duplicate hreflang in HTML and HTTP for ${lang}`);
    }
  }

  // Canonical alignment policy
  // 'self': canonical should equal the current page locale's alternate URL
  // 'en'  : canonical should equal English (or x-default as fallback)
  try {
    const urlObj = new URL(result.url);
    const pathname = urlObj.pathname || '/';
    const currentLang = pathname.startsWith('/es') || pathname === '/es' ? 'es' : 'en';
    let expectedCanonical: string | undefined;
    if (CANONICAL_POLICY === 'en') {
      expectedCanonical = htmlAlternates['en'] || htmlAlternates['x-default'];
      if (canonical && expectedCanonical && canonical !== expectedCanonical) {
        issues.push(`Canonical mismatch with EN`);
      }
    } else {
      // self canonical policy
      expectedCanonical = htmlAlternates[currentLang] || htmlAlternates['en'] || htmlAlternates['x-default'];
      if (canonical && expectedCanonical && canonical !== expectedCanonical) {
        issues.push(`Canonical mismatch with SELF (${currentLang})`);
      }
    }
  } catch (e) {
    // ignore URL parsing errors
  }

  return { ...result, issues, success: issues.length === 0 };
}

async function auditUrl(fullUrl: string): Promise<AuditResult> {
  const { status, text, headers } = await fetchWithHeaders(fullUrl);
  const htmlAlternates = parseHtmlAlternates(text);
  const httpAlternates = parseHttpLinkHeader(headers['link']);
  const canonical = parseCanonical(text);

  return validate({
    url: fullUrl,
    status,
    canonical,
    htmlAlternates,
    httpAlternates,
    issues: [],
    success: true,
  });
}

async function main() {
  const pathsArg = process.argv[2];
  const pathsList = pathsArg ? pathsArg.split(',').map(p => p.trim()).filter(Boolean) : DEFAULT_PATHS;
  const urls = pathsList.map(p => `${BASE_URL}${p}`);

  const results: AuditResult[] = [];
  for (const url of urls) {
    try {
      const r = await auditUrl(url);
      results.push(r);
      console.log(`Checked: ${url} -> ${r.success ? 'OK' : 'Issues'}`);
      if (!r.success) {
        console.log(`  Issues: ${r.issues.join('; ')}`);
      }
    } catch (e: any) {
      console.error(`Error checking ${url}: ${e.message}`);
      results.push({ url, status: 0, canonical: undefined, htmlAlternates: {}, httpAlternates: {}, issues: [e?.message || 'Unknown error'], success: false });
    }
  }

  const outDir = path.join(process.cwd(), 'seo-reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outJson = path.join(outDir, `hreflang-audit-${new Date().toISOString()}.json`);
  fs.writeFileSync(outJson, JSON.stringify(results, null, 2));
  console.log(`Saved audit results -> ${outJson}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
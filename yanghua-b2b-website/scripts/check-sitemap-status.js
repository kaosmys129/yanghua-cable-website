#!/usr/bin/env node
/**
 * Check sitemap URLs status codes and response times
 * Usage:
 *   node scripts/check-sitemap-status.js --url https://www.yhflexiblebusbar.com/sitemap.xml --concurrency 8 --timeout 7000
 * Defaults:
 *   url: https://www.yhflexiblebusbar.com/sitemap.xml
 *   concurrency: 8
 *   timeout: 7000 ms
 */

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
function getArg(name, def) {
  const idx = argv.findIndex(a => a === `--${name}`);
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  const kv = argv.find(a => a.startsWith(`--${name}=`));
  if (kv) return kv.split('=')[1];
  return def;
}

const SITEMAP_URL = getArg('url', 'https://www.yhflexiblebusbar.com/sitemap.xml');
const CONCURRENCY = parseInt(getArg('concurrency', '8'), 10) || 8;
const TIMEOUT_MS = parseInt(getArg('timeout', '7000'), 10) || 7000;

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'SitemapStatusChecker/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...options.headers,
      },
    });
    const text = await res.text();
    return { res, text };
  } finally {
    clearTimeout(id);
  }
}

async function headUrl(url, options = {}) {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.yhflexiblebusbar.com/',
        ...(options.headers || {}),
      },
    });
    clearTimeout(id);
    const durationMs = Math.round(performance.now() - start);
    const finalUrl = res.url || url;
    const contentType = res.headers.get('content-type') || '';
    return { status: res.status, ok: res.ok, durationMs, contentType, finalUrl };
  } catch (err) {
    // fallback to GET minimal
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.yhflexiblebusbar.com/',
          ...(options.headers || {}),
        },
      });
      clearTimeout(id);
      const durationMs = Math.round(performance.now() - start);
      const finalUrl = res.url || url;
      const contentType = res.headers.get('content-type') || '';
      return { status: res.status, ok: res.ok, durationMs, contentType, finalUrl, error: String(err) };
    } catch (err2) {
      const durationMs = Math.round(performance.now() - start);
      return { status: 0, ok: false, durationMs, contentType: '', finalUrl: url, error: String(err2) };
    }
  }
}

function parseLocs(xml) {
  const locs = [];
  const re = /<loc>([^<]+)<\/loc>/gmi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const u = m[1].trim();
    if (u) locs.push(u);
  }
  // Deduplicate
  return Array.from(new Set(locs));
}

async function pMapLimit(items, limit, mapper) {
  const ret = [];
  let i = 0;
  const active = new Set();
  async function run() {
    if (i >= items.length) return;
    const idx = i++;
    const p = (async () => mapper(items[idx], idx))();
    active.add(p);
    try {
      const val = await p;
      ret[idx] = val;
    } finally {
      active.delete(p);
      await run();
    }
  }
  const starters = Math.min(limit, items.length);
  for (let s = 0; s < starters; s++) await run();
  await Promise.all(Array.from(active));
  return ret;
}

async function main() {
  console.log(`Fetching sitemap: ${SITEMAP_URL}`);
  const { res: sitemapRes, text: xml } = await fetchText(SITEMAP_URL);
  if (!sitemapRes.ok) {
    console.error(`Failed to fetch sitemap: ${sitemapRes.status}`);
    process.exit(1);
  }
  const locs = parseLocs(xml);
  console.log(`Found ${locs.length} URLs in sitemap.`);

  const results = await pMapLimit(locs, CONCURRENCY, async (url, idx) => {
    const r = await headUrl(url);
    console.log(`${idx + 1}/${locs.length} ${r.status} ${r.ok ? 'OK' : 'ERR'} ${r.durationMs}ms - ${url}`);
    return { url, ...r };
  });

  const byStatus = results.reduce((acc, r) => {
    const k = r.status;
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const okCount = results.filter(r => r.ok).length;
  const errorItems = results.filter(r => !r.ok);

  const summary = {
    sitemapUrl: SITEMAP_URL,
    timestamp: new Date().toISOString(),
    total: results.length,
    okCount,
    errorCount: errorItems.length,
    byStatus,
    results,
  };

  const outDir = path.join(process.cwd(), 'test-results');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'sitemap-status.json');
  const mdPath = path.join(outDir, 'sitemap-status.md');

  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  const md = [
    `# Sitemap Status Report`,
    `- Sitemap: ${SITEMAP_URL}`,
    `- Timestamp: ${summary.timestamp}`,
    `- Total URLs: ${summary.total}`,
    `- OK: ${summary.okCount}`,
    `- Errors: ${summary.errorCount}`,
    `- Status Breakdown: ${Object.entries(byStatus).map(([s, n]) => `${s}: ${n}`).join(', ')}`,
    '',
    '## Error URLs',
    ...errorItems.map(r => `- ${r.status} (${r.durationMs}ms) ${r.url} ${r.error ? `Error: ${r.error}` : ''}`),
  ].join('\n');
  fs.writeFileSync(mdPath, md, 'utf8');

  console.log(`\nReport saved:`);
  console.log(`- ${jsonPath}`);
  console.log(`- ${mdPath}`);

  // Exit code reflects success/failure for CI usage
  if (errorItems.length > 0) {
    console.error(`\nFound ${errorItems.length} error URLs.`);
    process.exitCode = 2;
  } else {
    console.log('\nAll URLs responded OK.');
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
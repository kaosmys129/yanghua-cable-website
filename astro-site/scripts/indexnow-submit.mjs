#!/usr/bin/env node

import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://www.yhflexiblebusbar.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY_LOCATION = `${SITE_ORIGIN}/664b51f681d527165b2b9ddfa0baa0d3941c8392135481d74ac3d0278eda514d.txt`;

const DEFAULT_URLS = [
  '/en',
  '/es',
  '/pt',
  '/en/products',
  '/es/productos',
  '/pt/produtos',
  '/en/solutions',
  '/es/soluciones',
  '/pt/solucoes',
  '/en/projects',
  '/es/proyectos',
  '/pt/projetos',
  '/en/articles',
  '/es/articulos',
  '/pt/artigos',
];

function normalizeUrl(value) {
  const url = new URL(value, SITE_ORIGIN);
  if (url.origin !== SITE_ORIGIN) {
    throw new Error(`IndexNow URL must belong to ${SITE_ORIGIN}: ${value}`);
  }
  url.hash = '';
  return url.href.replace(/\/$/, '') || `${SITE_ORIGIN}/`;
}

function parseUrls(input = process.env.INDEXNOW_URLS) {
  const values = input
    ? input.split(/[\n,]+/).map((value) => value.trim()).filter(Boolean)
    : DEFAULT_URLS.map((path) => `${SITE_ORIGIN}${path}`);
  return [...new Set(values.map(normalizeUrl))];
}

export function parseSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1]);
}

async function loadSubmissionUrls(fetchImpl = fetch) {
  if (!process.env.INDEXNOW_SITEMAP_URL) return parseUrls();
  const response = await fetchImpl(process.env.INDEXNOW_SITEMAP_URL);
  if (!response.ok) {
    throw new Error(`Unable to read IndexNow sitemap with HTTP ${response.status}`);
  }
  const urls = parseSitemapUrls(await response.text());
  if (urls.length === 0) throw new Error('IndexNow sitemap contains no URLs');
  return urls;
}

export function buildIndexNowPayload({ key, urls = parseUrls(), keyLocation = KEY_LOCATION }) {
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key || '')) {
    throw new Error('INDEXNOW_KEY must contain 8-128 letters, numbers, or dashes');
  }
  const normalizedUrls = [...new Set(urls.map(normalizeUrl))];
  if (normalizedUrls.length === 0 || normalizedUrls.length > 10000) {
    throw new Error('IndexNow accepts between 1 and 10,000 URLs per request');
  }
  return {
    host: new URL(SITE_ORIGIN).host,
    key,
    keyLocation,
    urlList: normalizedUrls,
  };
}

export async function submitIndexNow({
  key,
  urls,
  keyLocation = process.env.INDEXNOW_KEY_LOCATION || KEY_LOCATION,
  fetchImpl = fetch,
}) {
  const payload = buildIndexNowPayload({ key, urls, keyLocation });
  const response = await fetchImpl(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`IndexNow submission failed with HTTP ${response.status}`);
  }
  return { status: response.status, count: payload.urlList.length, payload };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const key = process.env.INDEXNOW_KEY;
  loadSubmissionUrls()
    .then((urls) => submitIndexNow({ key, urls }))
    .then(({ status, count }) => {
      console.log(`IndexNow accepted ${count} URLs (HTTP ${status}).`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

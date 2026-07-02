// GEOFlow API 冒烟测试脚本
// 用法：node scripts/smoke-test-geoflow-api.mjs [--base-url http://localhost:3011]
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const baseUrl = args.includes('--base-url')
  ? args[args.indexOf('--base-url') + 1]
  : 'http://localhost:3011';

function rawBodyHash(body) {
  return crypto.createHash('sha256').update(body, 'utf8').digest('hex');
}

function createSignature({ method, pathname, timestamp, nonce, bodyHash, secret }) {
  const canonical = [method.toUpperCase(), pathname, timestamp, nonce, bodyHash].join('\n');
  return `sha256=${crypto.createHmac('sha256', secret).update(canonical, 'utf8').digest('hex')}`;
}

const KEY_ID = 'gapi_yanghua_next_local';
const SECRET = process.env.GEOFLOW_SMOKE_TEST_SECRET || '8bf55f6a9b4f288addf5ce0ef10fbf856268fae004f9a45fe5272608ccef0b3d';

async function run() {
  let passed = 0;
  let failed = 0;

  // --- Test 1: Health Check ---
  console.log('\n[Test 1] GET /api/geoflow/v1/health');
  const healthRes = await fetch(`${baseUrl}/api/geoflow/v1/health`);
  const health = await healthRes.json();
  if (healthRes.status === 200 && health.ok && health.site === 'Yanghua Cable') {
    console.log('  ✅ PASS:', JSON.stringify(health));
    passed++;
  } else {
    console.log('  ❌ FAIL:', healthRes.status, JSON.stringify(health));
    failed++;
  }

  // --- Test 2: Missing HMAC headers returns 401 ---
  console.log('\n[Test 2] POST /api/geoflow/v1/articles (no HMAC headers)');
  const noAuthRes = await fetch(`${baseUrl}/api/geoflow/v1/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: true }),
  });
  const noAuth = await noAuthRes.json();
  if (noAuthRes.status === 401 && noAuth.error === 'missing_signature_headers') {
    console.log('  ✅ PASS: correctly rejected with 401');
    passed++;
  } else {
    console.log('  ❌ FAIL:', noAuthRes.status, JSON.stringify(noAuth));
    failed++;
  }

  // --- Test 3: Valid HMAC article ingestion ---
  console.log('\n[Test 3] POST /api/geoflow/v1/articles (valid HMAC)');
  const idempotencyKey = `smoke-test-${Date.now()}`;
  const payload = {
    geoflowArticleId: `smoke-${Date.now()}`,
    locale: 'en',
    slug: `smoke-test-article-${Date.now()}`,
    title: 'Smoke Test: Flexible Busbar Selection Guide',
    description: 'A smoke test article for GEOFlow API connectivity verification.',
    bodyMarkdown: `## Quick Answer

Flexible busbars are preferred over parallel cables for high-current routes exceeding 1600A when space, heat distribution, and installation repeatability matter.

<!-- yanghua-geo-json
{
  "geo": {
    "targetQueries": ["flexible busbar vs cable", "when to use flexible busbar"],
    "answerSummary": "For routes above 1600A, flexible busbar simplifies installation compared to multiple parallel cables while providing better heat distribution.",
    "faqs": [{"question": "When should I use flexible busbar instead of cable?", "answer": "Use flexible busbar when current exceeds 1600A and routing space is constrained."}],
    "citations": [{"label": "Yanghua engineering knowledge base", "note": "Smoke test source"}],
    "sourceMaterials": ["Yanghua product catalog"],
    "buyerIntent": "selection",
    "relatedProductIds": ["flexible-busbar"],
    "relatedSolutionIds": ["energy-storage"]
  },
  "seo": {
    "title": "Flexible Busbar Selection Guide | Yanghua",
    "description": "Smoke test for GEOFlow API connectivity.",
    "keywords": ["flexible busbar", "high current"]
  }
}
-->`,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { name: 'Technical Guides', slug: 'technical-guides' },
    author: { name: 'Yanghua Engineering Team', email: 'engineering@yhflexiblebusbar.com' },
    targetQueries: ['flexible busbar vs cable', 'when to use flexible busbar'],
    answerSummary: 'For routes above 1600A, flexible busbar simplifies installation compared to multiple parallel cables while providing better heat distribution.',
    faqs: [{ question: 'When should I use flexible busbar instead of cable?', answer: 'Use flexible busbar when current exceeds 1600A and routing space is constrained.' }],
    citations: [{ label: 'Yanghua engineering knowledge base', note: 'Smoke test source' }],
    sourceMaterials: ['Yanghua product catalog'],
    buyerIntent: 'selection',
    relatedProductIds: ['flexible-busbar'],
    relatedSolutionIds: ['energy-storage'],
    seoTitle: 'Flexible Busbar Selection Guide | Yanghua',
    seoDescription: 'Smoke test for GEOFlow API connectivity.',
    keywords: ['flexible busbar', 'high current'],
    cover: { src: '/placeholder.svg?height=400&width=600', alt: 'Smoke test cover' },
  };
  const body = JSON.stringify(payload);
  const timestamp = new Date().toISOString();
  const nonce = crypto.randomBytes(12).toString('hex');
  const bodyHash = `sha256=${rawBodyHash(body)}`;
  const signature = createSignature({
    method: 'POST',
    pathname: '/api/geoflow/v1/articles',
    timestamp,
    nonce,
    bodyHash,
    secret: SECRET,
  });

  const importRes = await fetch(`${baseUrl}/api/geoflow/v1/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-geoflow-key-id': KEY_ID,
      'x-geoflow-timestamp': timestamp,
      'x-geoflow-nonce': nonce,
      'x-geoflow-body-sha256': bodyHash,
      'x-geoflow-signature': signature,
      'x-geoflow-idempotency-key': idempotencyKey,
    },
    body,
  });
  const importResult = await importRes.json();

  if (importResult.ok) {
    console.log('  ✅ PASS:', JSON.stringify(importResult));
    passed++;
  } else {
    console.log('  ❌ FAIL:', importRes.status, JSON.stringify(importResult));
    failed++;
  }

  // --- Test 4: Idempotency (same idempotency key returns duplicate) ---
  if (importResult.ok) {
    console.log('\n[Test 4] Idempotency check (same idempotency key)');
    const nonce2 = crypto.randomBytes(12).toString('hex');
    const timestamp2 = new Date().toISOString();
    const bodyHash2 = `sha256=${rawBodyHash(body)}`;
    const signature2 = createSignature({
      method: 'POST', pathname: '/api/geoflow/v1/articles',
      timestamp: timestamp2, nonce: nonce2, bodyHash: bodyHash2, secret: SECRET,
    });
    const dupRes = await fetch(`${baseUrl}/api/geoflow/v1/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-geoflow-key-id': KEY_ID,
        'x-geoflow-timestamp': timestamp2,
        'x-geoflow-nonce': nonce2,
        'x-geoflow-body-sha256': bodyHash2,
        'x-geoflow-signature': signature2,
        'x-geoflow-idempotency-key': idempotencyKey,
      },
      body,
    });
    const dupResult = await dupRes.json();
    if (dupResult.status === 'duplicate') {
      console.log('  ✅ PASS: correctly returned duplicate status');
      passed++;
    } else {
      console.log('  ❌ FAIL:', JSON.stringify(dupResult));
      failed++;
    }
  }

  // --- Test 5: Verify file created in articles/en/ with approved reviewStatus ---
  console.log('\n[Test 5] Verify article written to articles/en/ with approved status');
  const articleDir = path.join(process.cwd(), 'content', 'articles', 'en');
  const expectedFile = fs.readdirSync(articleDir).find(f => f.startsWith('smoke-test-article'));
  if (expectedFile) {
    const content = fs.readFileSync(path.join(articleDir, expectedFile), 'utf8');
    const hasApproved = /reviewStatus:\s*approved/.test(content);
    if (hasApproved) {
      console.log('  ✅ PASS: article written to articles/en/ with reviewStatus: approved');
      passed++;
    } else {
      console.log('  ❌ FAIL: file found but reviewStatus is not approved');
      failed++;
    }
  } else {
    console.log('  ❌ FAIL: no article file found in articles/en/');
    failed++;
  }

  // --- Summary ---
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);

  // Cleanup: remove smoke test files
  if (expectedFile) {
    fs.unlinkSync(path.join(articleDir, expectedFile));
    console.log('Cleaned up smoke test file.');
  }
}

run().catch(err => { console.error(err); process.exit(1); });

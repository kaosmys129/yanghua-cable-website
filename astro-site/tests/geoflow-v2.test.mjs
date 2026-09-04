import test from 'node:test';
import assert from 'node:assert/strict';
import { handleGeoflowV2Request, signV2Request } from '../src/lib/geoflow/v2-handler.mjs';

function payload(overrides = {}) {
  return {
    geoflowArticleId: 'article-123', translationKey: 'flexible-busbar-guide', locale: 'en', slug: 'flexible-busbar-guide',
    title: 'Flexible Busbar Guide', description: 'A verified guide to flexible busbar selection.', bodyMarkdown: '# Flexible Busbar Guide\n\nVerified content.',
    publishedAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-02T00:00:00.000Z', category: { name: 'Technical Guides', slug: 'technical-guides' },
    author: { name: 'Yanghua Editorial Team' }, authorId: 'editorial-team', authorManifest: { kind: 'organization', displayName: 'Yanghua Editorial Team', authorId: 'editorial-team', approvalStatus: 'approved' },
    reviewStatus: 'approved', contentOwnership: { system: 'geoflow', durableSource: 'astro-mdx', runtimeWrites: 'disallowed' },
    evidenceRefs: [{ label: 'Engineering source', url: 'https://example.com/source', evidenceGrade: 'A', approvalStatus: 'approved', visibility: 'public' }], evidenceManifest: { summaryGrade: 'A' },
    seo: { title: 'Flexible Busbar Guide', description: 'A verified guide to flexible busbar selection.', keywords: ['flexible busbar'] }, geo: { targetQueries: ['flexible busbar guide'], faqs: [] },
    ...overrides,
  };
}

function requestFor(data, nonce = Math.random().toString(36).slice(2)) {
  const body = JSON.stringify(data);
  return new Request('https://example.com/api/geoflow/v2/articles', { method: 'POST', headers: { ...signV2Request({ body, nonce, secret: 'test-secret' }), 'idempotency-key': nonce }, body });
}

function publisher() {
  const calls = [];
  return { calls, async findExistingRevision() { return null; }, async publish(input) { calls.push(input); return { branch: input.branch, prUrl: 'https://github.com/example/repo/pull/1', changedPaths: input.files.map((file) => file.path) }; } };
}

test('opens a PR for approved, evidenced content without filesystem writes', async () => {
  const pub = publisher();
  const result = await handleGeoflowV2Request(requestFor(payload()), { publisher: pub, secrets: { test: 'test-secret' } });
  assert.equal(result.status, 201);
  const body = await result.json();
  assert.equal(body.status, 'pr_opened');
  assert.match(body.prUrl, /pull\/1$/);
  assert.equal(pub.calls.length, 1);
  assert.match(pub.calls[0].files[0].path, /astro-site\/src\/data\/legacy-content\/content\/articles\/en\/flexible-busbar-guide\.mdx$/);
});

test('returns duplicate for an existing revision and does not publish again', async () => {
  const pub = { async findExistingRevision() { return { prUrl: 'https://github.com/example/repo/pull/9' }; }, async publish() { throw new Error('must not publish'); } };
  const result = await handleGeoflowV2Request(requestFor(payload(), 'duplicate-key'), { publisher: pub, secrets: { test: 'test-secret' } });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).status, 'duplicate');
});

test('rejects unapproved review status and evidence before GitHub', async () => {
  const pub = publisher();
  const result = await handleGeoflowV2Request(requestFor(payload({ reviewStatus: 'needs_review' })), { publisher: pub, secrets: { test: 'test-secret' } });
  assert.equal(result.status, 422);
  assert.equal(pub.calls.length, 0);
});

test('returns a controlled failure when GitHub publishing fails', async () => {
  const pub = { async findExistingRevision() { return null; }, async publish() { throw new Error('github_pr_failed_500'); } };
  const result = await handleGeoflowV2Request(requestFor(payload(), 'failure-key'), { publisher: pub, secrets: { test: 'test-secret' } });
  assert.equal(result.status, 503);
  assert.equal((await result.json()).error, 'github_pr_failed_500');
});

test('rejects replayed nonce before article validation', async () => {
  const pub = publisher();
  const first = requestFor(payload(), 'replay-key');
  const firstResult = await handleGeoflowV2Request(first, { publisher: pub, secrets: { test: 'test-secret' } });
  assert.equal(firstResult.status, 201);
  const second = requestFor(payload(), 'replay-key');
  const secondResult = await handleGeoflowV2Request(second, { publisher: pub, secrets: { test: 'test-secret' } });
  assert.equal(secondResult.status, 409);
});

import { createBodyHash, createGeoflowSignature, parseGeoflowSecrets, verifyGeoflowRequest } from './security-runtime.mjs';
import { createGitHubAppPublisher, prepareV2Publication } from './v2-publish.mjs';

const memoryReplay = new Map();
const jsonHeaders = { 'content-type': 'application/json; charset=utf-8' };

export async function handleGeoflowV2Request(request, dependencies = {}) {
  const body = await request.text();
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers.entries());
  const replayStore = dependencies.replayStore || createMemoryReplayStore();
  const verification = await verifyGeoflowRequest({
    method: request.method,
    pathname: url.pathname,
    body,
    headers,
    secrets: dependencies.secrets || parseGeoflowSecrets(),
    replayStore,
    now: dependencies.now,
  });
  if (!verification.ok) return response({ ok: false, error: verification.code }, verification.status);

  const idempotencyKey = headers['x-geoflow-idempotency-key'] || headers['idempotency-key'] || '';
  if (!idempotencyKey) return response({ ok: false, error: 'missing_idempotency_key' }, 400);
  let payload;
  try { payload = JSON.parse(body); } catch { return response({ ok: false, error: 'invalid_json' }, 400); }

  const prepared = prepareV2Publication(payload, idempotencyKey);
  if (!prepared.ok) return response({ ok: false, status: 'rejected', revisionId: payload?.revisionId || null, errors: prepared.errors }, 422);
  const publisher = dependencies.publisher || createGitHubAppPublisher();
  try {
    const existing = publisher.findExistingRevision ? await publisher.findExistingRevision(prepared) : null;
    if (existing) return response({ ok: true, status: 'duplicate', revisionId: prepared.revisionId, branch: prepared.branch, prUrl: existing.prUrl, changedPaths: [] }, 200);
    const published = await publisher.publish({
      branch: prepared.branch,
      files: prepared.files,
      title: prepared.article.title,
      body: `GeoFlow revision ${prepared.revisionId} for ${prepared.article.locale}/${prepared.article.slug}`,
      revisionId: prepared.revisionId,
    });
    return response({ ok: true, status: 'pr_opened', revisionId: prepared.revisionId, branch: published.branch || prepared.branch, prUrl: published.prUrl, changedPaths: published.changedPaths || [] }, 201);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'github_publish_failed';
    return response({ ok: false, status: 'rejected', revisionId: prepared.revisionId, error: code.startsWith('github_') ? code : 'github_publish_failed' }, 503);
  }
}

export function createMemoryReplayStore() {
  return {
    async has(key) {
      const expiry = memoryReplay.get(key);
      if (!expiry || expiry <= Date.now()) { memoryReplay.delete(key); return false; }
      return true;
    },
    async set(key, expiresAt) { memoryReplay.set(key, (expiresAt || new Date(Date.now() + 600000)).getTime()); },
  };
}

export function signV2Request({ method = 'POST', pathname = '/api/geoflow/v2/articles', body, timestamp = String(Math.floor(Date.now() / 1000)), nonce = cryptoRandom(), keyId = 'test', secret = 'test-secret' }) {
  const bodyHash = createBodyHash(body);
  return {
    'x-geoflow-key-id': keyId,
    'x-geoflow-timestamp': timestamp,
    'x-geoflow-nonce': nonce,
    'x-geoflow-body-sha256': bodyHash,
    'x-geoflow-signature': createGeoflowSignature({ method, pathname, timestamp, nonce, bodyHash, secret }),
  };
}

function response(value, status) { return new Response(JSON.stringify(value), { status, headers: jsonHeaders }); }
function cryptoRandom() { return Math.random().toString(36).slice(2); }

import crypto from 'node:crypto';

export function createBodyHash(body) { return `sha256=${crypto.createHash('sha256').update(body, 'utf8').digest('hex')}`; }
export function createGeoflowSignature({ method, pathname, timestamp, nonce, bodyHash, secret }) {
  const canonical = [method.toUpperCase(), pathname, timestamp, nonce, bodyHash].join('\n');
  return `sha256=${crypto.createHmac('sha256', secret).update(canonical, 'utf8').digest('hex')}`;
}
export function parseGeoflowSecrets(value = process.env.GEOFLOW_HMAC_KEYS || '') {
  const trimmed = String(value).trim();
  if (!trimmed) return {};
  if (trimmed.startsWith('{')) return Object.fromEntries(Object.entries(JSON.parse(trimmed)).filter(([, secret]) => Boolean(secret)));
  return Object.fromEntries(trimmed.split(',').map((entry) => entry.trim()).filter(Boolean).map((entry) => {
    const separator = entry.indexOf(':');
    return separator === -1 ? [entry, ''] : [entry.slice(0, separator).trim(), entry.slice(separator + 1).trim()];
  }).filter(([, secret]) => Boolean(secret)));
}
export async function verifyGeoflowRequest({ method, pathname, body, headers, secrets, now = new Date(), maxAgeSeconds = 600, replayStore }) {
  const normalized = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
  const keyId = normalized['x-geoflow-key-id'];
  const timestamp = normalized['x-geoflow-timestamp'];
  const nonce = normalized['x-geoflow-nonce'];
  const bodyHash = normalized['x-geoflow-body-sha256'] || normalized['x-geoflow-payload-sha256'];
  const signature = normalized['x-geoflow-signature'];
  if (!keyId || !timestamp || !nonce || !bodyHash || !signature) return { ok: false, status: 401, code: 'missing_signature_headers' };
  const secret = secrets[keyId];
  if (!secret) return { ok: false, status: 401, code: 'unknown_key_id' };
  const parsedTime = /^\d+$/.test(timestamp) ? new Date(Number(timestamp) * 1000) : new Date(timestamp);
  if (Number.isNaN(parsedTime.getTime())) return { ok: false, status: 401, code: 'invalid_timestamp' };
  if (Math.abs(now.getTime() - parsedTime.getTime()) / 1000 > maxAgeSeconds) return { ok: false, status: 401, code: 'expired_timestamp' };
  if (!safeEqual(stripPrefix(bodyHash), crypto.createHash('sha256').update(body, 'utf8').digest('hex'))) return { ok: false, status: 400, code: 'body_hash_mismatch' };
  const replayKey = `${keyId}:${nonce}`;
  if (await replayStore.has(replayKey)) return { ok: false, status: 409, code: 'replayed_nonce' };
  const expected = createGeoflowSignature({ method, pathname, timestamp, nonce, bodyHash, secret });
  if (!safeEqual(stripPrefix(signature), stripPrefix(expected))) return { ok: false, status: 401, code: 'invalid_signature' };
  await replayStore.set(replayKey, new Date(now.getTime() + maxAgeSeconds * 1000));
  return { ok: true, keyId };
}
function stripPrefix(value) { return String(value).startsWith('sha256=') ? String(value).slice(7) : String(value); }
function safeEqual(left, right) { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && crypto.timingSafeEqual(a, b); }

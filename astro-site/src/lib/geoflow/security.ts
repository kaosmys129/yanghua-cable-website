import crypto from 'crypto';

export type ReplayStore = {
  has(key: string): Promise<boolean>;
  set(key: string, expiresAt?: Date): Promise<void>;
};

export type GeoflowVerificationResult =
  | { ok: true; keyId: string }
  | { ok: false; status: number; code: string };

type SignatureInput = {
  method: string;
  pathname: string;
  timestamp: string;
  nonce: string;
  bodyHash: string;
  secret: string;
};

type VerifyInput = {
  method: string;
  pathname: string;
  body: string;
  headers: Record<string, string | undefined>;
  secrets: Record<string, string>;
  now?: Date;
  maxAgeSeconds?: number;
  replayStore: ReplayStore;
};

export function createBodyHash(body: string) {
  return `sha256=${createRawBodyHash(body)}`;
}

export function createRawBodyHash(body: string) {
  return crypto.createHash('sha256').update(body, 'utf8').digest('hex');
}

export function createGeoflowSignature(input: SignatureInput) {
  const canonical = [
    input.method.toUpperCase(),
    input.pathname,
    input.timestamp,
    input.nonce,
    input.bodyHash,
  ].join('\n');

  return `sha256=${crypto.createHmac('sha256', input.secret).update(canonical, 'utf8').digest('hex')}`;
}

export async function verifyGeoflowRequest(input: VerifyInput): Promise<GeoflowVerificationResult> {
  const headers = normalizeHeaders(input.headers);
  const keyId = headers['x-geoflow-key-id'];
  const timestamp = headers['x-geoflow-timestamp'];
  const nonce = headers['x-geoflow-nonce'];
  const bodyHash = headers['x-geoflow-body-sha256'] || headers['x-geoflow-payload-sha256'];
  const signature = headers['x-geoflow-signature'];

  if (!keyId || !timestamp || !nonce || !bodyHash || !signature) {
    return { ok: false, status: 401, code: 'missing_signature_headers' };
  }

  const secret = input.secrets[keyId];
  if (!secret) {
    return { ok: false, status: 401, code: 'unknown_key_id' };
  }

  const requestTime = parseTimestamp(timestamp);
  if (Number.isNaN(requestTime.getTime())) {
    return { ok: false, status: 401, code: 'invalid_timestamp' };
  }

  const now = input.now || new Date();
  const maxAgeSeconds = input.maxAgeSeconds ?? 600;
  const ageSeconds = Math.abs(now.getTime() - requestTime.getTime()) / 1000;
  if (ageSeconds > maxAgeSeconds) {
    return { ok: false, status: 401, code: 'expired_timestamp' };
  }

  const expectedBodyHash = createRawBodyHash(input.body);
  if (!safeEqual(normalizeSha256Value(bodyHash), expectedBodyHash)) {
    return { ok: false, status: 400, code: 'body_hash_mismatch' };
  }

  const replayKey = `${keyId}:${nonce}`;
  if (await input.replayStore.has(replayKey)) {
    return { ok: false, status: 409, code: 'replayed_nonce' };
  }

  const expectedSignature = createGeoflowSignature({
    method: input.method,
    pathname: input.pathname,
    timestamp,
    nonce,
    bodyHash,
    secret,
  });

  if (!safeEqual(normalizeSha256Value(signature), normalizeSha256Value(expectedSignature))) {
    return { ok: false, status: 401, code: 'invalid_signature' };
  }

  await input.replayStore.set(replayKey, new Date(now.getTime() + maxAgeSeconds * 1000));
  return { ok: true, keyId };
}

export function parseGeoflowSecrets(value = import.meta.env.GEOFLOW_HMAC_KEYS || process.env.GEOFLOW_HMAC_KEYS || ''): Record<string, string> {
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }

  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed) as Record<string, string>;
    return Object.fromEntries(Object.entries(parsed).filter(([, secret]) => Boolean(secret)));
  }

  return Object.fromEntries(
    trimmed
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separator = entry.indexOf(':');
        if (separator === -1) {
          return [entry, ''] as const;
        }
        return [entry.slice(0, separator).trim(), entry.slice(separator + 1).trim()] as const;
      })
      .filter(([, secret]) => Boolean(secret))
  );
}

function normalizeHeaders(headers: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  ) as Record<string, string | undefined>;
}

function parseTimestamp(value: string) {
  if (/^\d+$/.test(value)) {
    const seconds = Number.parseInt(value, 10);
    return new Date(seconds * 1000);
  }

  return new Date(value);
}

function normalizeSha256Value(value: string) {
  return value.startsWith('sha256=') ? value.slice('sha256='.length) : value;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

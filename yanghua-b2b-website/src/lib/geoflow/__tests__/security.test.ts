import { describe, expect, it } from '@jest/globals';
import crypto from 'crypto';
import {
  createBodyHash,
  createGeoflowSignature,
  verifyGeoflowRequest,
  type ReplayStore,
} from '../security';

class MemoryReplayStore implements ReplayStore {
  private seen = new Set<string>();

  async has(key: string) {
    return this.seen.has(key);
  }

  async set(key: string) {
    this.seen.add(key);
  }
}

describe('GEOFlow request security', () => {
  const body = JSON.stringify({ geoflowArticleId: 'geo-1', title: 'Flexible Busbar Guide' });
  const timestamp = '2026-06-30T10:00:00.000Z';
  const nonce = 'nonce-1';
  const keyId = 'primary';
  const secret = 'top-secret';
  const pathname = '/api/geoflow/v1/articles';

  it('accepts a request with matching body hash and HMAC signature', async () => {
    const bodyHash = createBodyHash(body);
    const signature = createGeoflowSignature({
      method: 'POST',
      pathname,
      timestamp,
      nonce,
      bodyHash,
      secret,
    });

    await expect(
      verifyGeoflowRequest({
        method: 'POST',
        pathname,
        body,
        headers: {
          'x-geoflow-key-id': keyId,
          'x-geoflow-timestamp': timestamp,
          'x-geoflow-nonce': nonce,
          'x-geoflow-body-sha256': bodyHash,
          'x-geoflow-signature': signature,
        },
        secrets: { [keyId]: secret },
        now: new Date('2026-06-30T10:03:00.000Z'),
        replayStore: new MemoryReplayStore(),
      })
    ).resolves.toEqual({ ok: true, keyId });
  });

  it('accepts GEOFlow generic HTTP raw hex body hashes and signatures', async () => {
    const unixTimestamp = Math.floor(new Date(timestamp).getTime() / 1000).toString();
    const bodyHash = crypto.createHash('sha256').update(body, 'utf8').digest('hex');
    const canonical = ['POST', pathname, unixTimestamp, nonce, bodyHash].join('\n');
    const signature = crypto.createHmac('sha256', secret).update(canonical, 'utf8').digest('hex');

    await expect(
      verifyGeoflowRequest({
        method: 'POST',
        pathname,
        body,
        headers: {
          'x-geoflow-key-id': keyId,
          'x-geoflow-timestamp': unixTimestamp,
          'x-geoflow-nonce': nonce,
          'x-geoflow-payload-sha256': bodyHash,
          'x-geoflow-signature': signature,
        },
        secrets: { [keyId]: secret },
        now: new Date('2026-06-30T10:03:00.000Z'),
        replayStore: new MemoryReplayStore(),
      })
    ).resolves.toEqual({ ok: true, keyId });
  });

  it('rejects replayed nonces', async () => {
    const replayStore = new MemoryReplayStore();
    const bodyHash = createBodyHash(body);
    const signature = createGeoflowSignature({
      method: 'POST',
      pathname,
      timestamp,
      nonce,
      bodyHash,
      secret,
    });
    const request = {
      method: 'POST',
      pathname,
      body,
      headers: {
        'x-geoflow-key-id': keyId,
        'x-geoflow-timestamp': timestamp,
        'x-geoflow-nonce': nonce,
        'x-geoflow-body-sha256': bodyHash,
        'x-geoflow-signature': signature,
      },
      secrets: { [keyId]: secret },
      now: new Date('2026-06-30T10:03:00.000Z'),
      replayStore,
    };

    await expect(verifyGeoflowRequest(request)).resolves.toEqual({ ok: true, keyId });
    await expect(verifyGeoflowRequest(request)).resolves.toEqual({
      ok: false,
      status: 409,
      code: 'replayed_nonce',
    });
  });

  it('rejects expired timestamps', async () => {
    const bodyHash = createBodyHash(body);
    const signature = createGeoflowSignature({
      method: 'POST',
      pathname,
      timestamp,
      nonce,
      bodyHash,
      secret,
    });

    await expect(
      verifyGeoflowRequest({
        method: 'POST',
        pathname,
        body,
        headers: {
          'x-geoflow-key-id': keyId,
          'x-geoflow-timestamp': timestamp,
          'x-geoflow-nonce': nonce,
          'x-geoflow-body-sha256': bodyHash,
          'x-geoflow-signature': signature,
        },
        secrets: { [keyId]: secret },
        now: new Date('2026-06-30T10:16:00.000Z'),
        replayStore: new MemoryReplayStore(),
      })
    ).resolves.toEqual({
      ok: false,
      status: 401,
      code: 'expired_timestamp',
    });
  });
});

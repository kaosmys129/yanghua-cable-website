import { NextRequest, NextResponse } from 'next/server';
import { parseGeoflowSecrets, verifyGeoflowRequest } from '@/lib/geoflow/security';
import { FileReplayStore, receiveGeoflowArticle } from '@/lib/geoflow/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const url = new URL(request.url);
  const secrets = parseGeoflowSecrets();
  const verification = await verifyGeoflowRequest({
    method: request.method,
    pathname: url.pathname,
    body,
    headers: Object.fromEntries(request.headers.entries()),
    secrets,
    replayStore: new FileReplayStore(),
  });

  if (!verification.ok) {
    return NextResponse.json(
      { ok: false, error: verification.code },
      { status: verification.status }
    );
  }

  const idempotencyKey =
    request.headers.get('x-geoflow-idempotency-key') ||
    request.headers.get('idempotency-key') ||
    request.headers.get('x-idempotency-key') ||
    '';
  if (!idempotencyKey) {
    return NextResponse.json(
      { ok: false, error: 'missing_idempotency_key' },
      { status: 400 }
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400 }
    );
  }

  try {
    const result = await receiveGeoflowArticle({
      payload: payload as any,
      idempotencyKey,
    });

    return NextResponse.json(result, { status: result.status === 'duplicate' ? 200 : 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'invalid_article_payload',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 422 }
    );
  }
}

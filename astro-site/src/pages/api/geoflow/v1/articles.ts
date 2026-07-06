import type { APIRoute } from 'astro';
import { parseGeoflowSecrets, verifyGeoflowRequest } from '../../../../lib/geoflow/security';
import { FileReplayStore, receiveGeoflowArticle, deleteGeoflowArticle } from '../../../../lib/geoflow/storage';

export const prerender = false;

// 1. 处理分发发布与更新 (POST)
export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const url = new URL(request.url);
  const secrets = parseGeoflowSecrets();
  
  // HMAC 签名校验
  const verification = await verifyGeoflowRequest({
    method: request.method,
    pathname: url.pathname,
    body,
    headers: Object.fromEntries(request.headers.entries()),
    secrets,
    replayStore: new FileReplayStore(),
  });

  if (!verification.ok) {
    console.error(`[geoflow-import] 签名验证失败: ${verification.code}`);
    return new Response(
      JSON.stringify({ ok: false, error: verification.code }),
      {
        status: verification.status,
        headers: { 'content-type': 'application/json' }
      }
    );
  }

  const idempotencyKey =
    request.headers.get('x-geoflow-idempotency-key') ||
    request.headers.get('idempotency-key') ||
    request.headers.get('x-idempotency-key') ||
    '';
  if (!idempotencyKey) {
    return new Response(
      JSON.stringify({ ok: false, error: 'missing_idempotency_key' }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' }
      }
    );
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: 'invalid_json' }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' }
      }
    );
  }

  try {
    // 检查是否为更新操作
    const isUpdate = payload.event === 'article.update';
    console.log(`[geoflow-import] 接收到分发请求，类型: ${isUpdate ? '更新' : '发布'}, Key: ${idempotencyKey}`);

    const result = await receiveGeoflowArticle({
      payload,
      idempotencyKey,
      isUpdate,
    });

    return new Response(
      JSON.stringify(result),
      {
        status: result.status === 'duplicate' ? 200 : 201,
        headers: { 'content-type': 'application/json' }
      }
    );
  } catch (error) {
    console.error(`[geoflow-import] 文章写入失败:`, error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'invalid_article_payload',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 422,
        headers: { 'content-type': 'application/json' }
      }
    );
  }
};

// 2. 处理分发删除 (DELETE)
export const DELETE: APIRoute = async ({ request }) => {
  const body = await request.text();
  const url = new URL(request.url);
  const secrets = parseGeoflowSecrets();
  
  // HMAC 签名校验
  const verification = await verifyGeoflowRequest({
    method: request.method,
    pathname: url.pathname,
    body,
    headers: Object.fromEntries(request.headers.entries()),
    secrets,
    replayStore: new FileReplayStore(),
  });

  if (!verification.ok) {
    console.error(`[geoflow-delete] 签名验证失败: ${verification.code}`);
    return new Response(
      JSON.stringify({ ok: false, error: verification.code }),
      {
        status: verification.status,
        headers: { 'content-type': 'application/json' }
      }
    );
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: 'invalid_json' }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' }
      }
    );
  }

  const slug = payload.article?.slug || payload.slug;
  const articleId = payload.article?.id || payload.id;
  if (!slug) {
    return new Response(
      JSON.stringify({ ok: false, error: 'missing_slug' }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' }
      }
    );
  }

  try {
    console.log(`[geoflow-delete] 接收到删除请求，Slug: ${slug}, ID: ${articleId}`);
    const result = await deleteGeoflowArticle(slug, articleId ? String(articleId) : undefined);

    return new Response(
      JSON.stringify({ ok: true, message: 'Article deleted successfully' }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }
    );
  } catch (error) {
    console.error(`[geoflow-delete] 删除失败:`, error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'delete_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' }
      }
    );
  }
};

import { NextRequest, NextResponse } from 'next/server';
import { logApiError, logError } from '@/lib/error-logger';

// 强制动态，避免静态缓存导致分页和实时数据问题
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// WordPress REST API 基础地址（通过 .env 可配置）
const WP_API_BASE = process.env.WORDPRESS_API_INTERNAL || 'http://localhost:8080/wp-json/wp/v2';

/**
 * GET /api/wordpress/posts
 * 支持查询参数：
 * - page: 页码（默认 1）
 * - per_page: 每页数量（默认 9，最大 100）
 * - type: 文章类型（默认 'yanghua_article'，不存在时回退到 'posts'）
 * - _fields: 字段选择（可选，按需优化响应体大小）
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params = url.searchParams;
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(params.get('per_page') || '9', 10)));
  const type = params.get('type') || 'yanghua_article';
  const fields = params.get('_fields') || '';

  // 构建查询参数
  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('per_page', String(perPage));
  qs.set('_embed', '1');
  if (fields) qs.set('_fields', fields);

  const makeEndpoint = (postType: string) => `${WP_API_BASE}/${postType}?${qs.toString()}`;

  try {
    // 首先尝试自定义文章类型
    let endpoint = makeEndpoint(type);
    let postsRes = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    // 如果自定义类型不可用（404），回退到标准 posts
    if (postsRes.status === 404) {
      endpoint = makeEndpoint('posts');
      postsRes = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
    }

    // 分类仅在需要时获取（为兼容旧前端，这里仍然获取）
    const categoriesRes = await fetch(`${WP_API_BASE}/categories?per_page=100`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!postsRes.ok || !categoriesRes.ok) {
      const info = {
        postsStatus: postsRes.status,
        postsStatusText: postsRes.statusText,
        categoriesStatus: categoriesRes.status,
        categoriesStatusText: categoriesRes.statusText,
        endpoint,
      };

      logApiError(endpoint, 'GET', postsRes.status || 0, new Error(`WordPress API error: ${postsRes.statusText}`));
      return NextResponse.json({ error: 'WordPress API error', info }, { status: 502 });
    }

    const posts = await postsRes.json();
    const categories = await categoriesRes.json();

    // 从响应头收集分页信息
    const total = Number(
      postsRes.headers.get('X-WP-Total') || postsRes.headers.get('x-wp-total') || '0'
    );
    const totalPages = Number(
      postsRes.headers.get('X-WP-TotalPages') || postsRes.headers.get('x-wp-totalpages') || '0'
    );

    return NextResponse.json(
      {
        posts,
        categories,
        meta: { total, totalPages, page, perPage },
      },
      { status: 200 }
    );
  } catch (err: any) {
    // 统一错误日志
    logError('[wp-proxy] Failed to fetch articles', err, {
      type: 'api',
      endpointBase: WP_API_BASE,
      query: { page, perPage, type },
    });

    return NextResponse.json(
      {
        error: 'Proxy fetch failed',
        message: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
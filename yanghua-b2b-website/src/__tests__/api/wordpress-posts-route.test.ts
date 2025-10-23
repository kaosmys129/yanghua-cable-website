/**
 * @jest-environment node
 */

// 显式引入 Jest 的全局方法，避免 TypeScript 在测试文件中无法识别 describe/test/expect/jest 等名称
import { describe, test, expect, afterEach, jest } from '@jest/globals';
import { GET } from '@/app/api/wordpress/posts/route';

// Helper to create Response like WordPress
function createJsonResponse(body: any, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  return new Response(JSON.stringify(body), {
    status: init?.status || 200,
    statusText: init?.statusText,
    headers,
  });
}

describe('API /api/wordpress/posts', () => {
  const ORIGINAL_FETCH = global.fetch as any;

  afterEach(() => {
    // Restore fetch after each test
    global.fetch = ORIGINAL_FETCH;
    jest.clearAllMocks();
  });

  test('returns posts with meta and categories (fallback to /posts when custom type 404)', async () => {
    const mockFetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/does_not_exist')) {
        // simulate custom type 404
        return createJsonResponse([], { status: 404, statusText: 'Not Found' });
      }
      if (url.includes('/posts')) {
        const headers = new Headers({ 'X-WP-Total': '1', 'X-WP-TotalPages': '1' });
        return new Response(
          JSON.stringify([
            {
              id: 1,
              title: { rendered: 'Test Article' },
              excerpt: { rendered: '' },
              content: { rendered: '' },
              date: '2025-01-01T00:00:00',
              modified: '2025-01-01T00:00:00',
              status: 'publish',
              link: 'http://localhost:8080/?p=1',
              author: 1,
              categories: [1],
              tags: [],
              featured_media: 0,
              _embedded: {},
            },
          ]),
          { status: 200, headers }
        );
      }
      if (url.includes('/categories')) {
        return createJsonResponse([{ id: 1, name: 'General', slug: 'general' }], { status: 200 });
      }
      return createJsonResponse([], { status: 500 });
    });

    global.fetch = mockFetch as any;

    const req = new Request('http://localhost:3000/api/wordpress/posts?page=1&per_page=9&type=does_not_exist');
    const res = await GET(req as any);

    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.meta).toEqual({ total: 1, totalPages: 1, page: 1, perPage: 9 });
    expect(Array.isArray(json.posts)).toBe(true);
    expect(json.posts.length).toBe(1);
    expect(json.categories[0].name).toBe('General');

    // Verify fallback behavior attempted both endpoints
    const calledUrls = mockFetch.mock.calls.map((c: any[]) => c[0]);
    expect(calledUrls.some((u: string) => u.includes('/does_not_exist'))).toBe(true);
    expect(calledUrls.some((u: string) => u.includes('/posts'))).toBe(true);
    expect(calledUrls.some((u: string) => u.includes('/categories'))).toBe(true);
  });

  test('returns 502 when posts request fails', async () => {
    const mockFetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/yanghua_article')) {
        return createJsonResponse([], { status: 500, statusText: 'Server Error' });
      }
      if (url.includes('/categories')) {
        return createJsonResponse([], { status: 200 });
      }
      return createJsonResponse([], { status: 500 });
    });

    global.fetch = mockFetch as any;
    const req = new Request('http://localhost:3000/api/wordpress/posts?page=1&per_page=9&type=yanghua_article');
    const res = await GET(req as any);

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe('WordPress API error');
  });
});
import { test, expect } from '@playwright/test';

test.describe('API: csrf + email', () => {
  test('POST /api/email/send without csrf cookie returns 403', async ({ request }) => {
    const res = await request.post('/api/email/send', {
      data: {
        type: 'contact',
        locale: 'en',
        name: 'Test User',
        email: 'test@example.com',
        company: 'Test Company',
        country: 'CN',
        subject: 'other',
        message: 'Hello, this is a test message.',
      },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.code).toBe('CSRF_VALIDATION_FAILED');
  });

  test('GET /api/csrf sets csrf-token cookie', async ({ request }) => {
    const res = await request.get('/api/csrf');
    expect(res.status()).toBe(200);
    const setCookie = res.headers()['set-cookie'] || '';
    expect(setCookie.toLowerCase()).toContain('csrf-token=');
  });
});


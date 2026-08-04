import type { APIRoute } from 'astro';
import { applySecurityHeaders, CSRFProtection } from '../../lib/yanghua/server/security';

export const prerender = false;

function json(payload: unknown, status = 200): Response {
  const response = new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
  return applySecurityHeaders(response);
}

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const token = CSRFProtection.generateToken();

    cookies.set(CSRFProtection.COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: import.meta.env.PROD,
      maxAge: 60 * 60,
    });

    return json({
      success: true,
      message: 'CSRF token has been set in cookie.',
    });
  } catch (error) {
    return json(
      {
        success: false,
        error: 'Failed to generate CSRF token',
        debug: import.meta.env.DEV ? String(error) : undefined,
      },
      500,
    );
  }
};

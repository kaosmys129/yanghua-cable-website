import type { APIRoute } from 'astro';
import { applySecurityHeaders, CSRFProtection } from '../../lib/yanghua/server/security';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const token = CSRFProtection.generateToken();

    cookies.set(CSRFProtection.COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: import.meta.env.PROD,
      maxAge: 60 * 60, // 1h
    });

    const response = new Response(
      JSON.stringify({
        success: true,
        message: 'CSRF token has been set in cookie.',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
    return applySecurityHeaders(response);
  } catch (err) {
    const response = new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to generate CSRF token',
        debug: import.meta.env.DEV ? String(err) : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
    return applySecurityHeaders(response);
  }
};

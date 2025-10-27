/**
 * Centralized site URL helper.
 * Priority:
 * 1) NEXT_PUBLIC_SITE_URL (explicit, recommended)
 * 2) VERCEL_URL (on Vercel without explicit base URL)
 * 3) Development default http://localhost:3000
 * 4) Production fallback https://www.yhflexiblebusbar.com
 *
 * Always returns a normalized origin string without trailing slash.
 */
export function getSiteUrl(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (fromEnv) {
    return normalizeOrigin(fromEnv);
  }

  const vercelUrl = (process.env.VERCEL_URL || '').trim();
  if (vercelUrl) {
    // VERCEL_URL is domain only (e.g., my-app.vercel.app) – ensure protocol
    const origin = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
    return normalizeOrigin(origin);
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // Final safe fallback (production domain)
  return 'https://www.yhflexiblebusbar.com';
}

/**
 * Join an origin and a path safely (ensures exactly one slash between).
 */
export function createAbsoluteUrl(pathname: string): string {
  const origin = getSiteUrl();
  const path = `/${(pathname || '').replace(/^\/+/, '')}`;
  return `${origin}${path}`.replace(/(?<!:)\/+/g, '/');
}

function normalizeOrigin(input: string): string {
  try {
    const url = new URL(input);
    return url.origin;
  } catch {
    // If input is domain only without protocol, assume https
    const assumed = input.startsWith('http') ? input : `https://${input}`;
    try {
      const url = new URL(assumed);
      return url.origin;
    } catch {
      return 'https://www.yhflexiblebusbar.com';
    }
  }
}
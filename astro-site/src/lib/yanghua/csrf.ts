import crypto from 'node:crypto';

export const CSRF_COOKIE_NAME = 'csrf-token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function isCsrfValid(opts: {
  cookieToken?: string;
  headerToken?: string | null;
}): boolean {
  const cookieToken = opts.cookieToken ?? '';
  if (!cookieToken) return false;

  // 若客户端发送了 header token，则必须匹配 cookie；否则仅要求 cookie 存在（与旧站行为一致）。
  if (opts.headerToken) {
    return opts.headerToken === cookieToken;
  }
  return true;
}


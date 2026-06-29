import type { Locale } from './loaders';

type Dict = Record<string, any>;

function getByPath(obj: Dict, path: string): any {
  const parts = path.split('.');
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * 极简 i18n：兼容旧站 next-intl 的 JSON 结构（用 `a.b.c` 访问深层 key）。
 * - 若 key 缺失，返回 fallback（或 key 本身）。
 */
export function t(messages: Dict, key: string, fallback?: string): string {
  const v = getByPath(messages, key);
  if (typeof v === 'string') return v;
  return fallback ?? key;
}

export function tRaw<T = any>(messages: Dict, key: string, fallback?: T): T {
  const v = getByPath(messages, key);
  return (v ?? fallback) as T;
}

export type { Locale };


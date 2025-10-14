import { cookies } from 'next/headers';

/**
 * 统一获取服务端 CSRF Token（从 cookies 中读取）。
 * 若不存在则返回空字符串，客户端仍会通过 credentials: 'include' 自动附带 CSRF cookie。
 */
export function getCsrfToken(): string {
  try {
    return cookies().get('csrf-token')?.value || '';
  } catch (err) {
    // 在某些构建/运行环境下可能无法读取 cookies（例如纯客户端环境），兜底为空字符串
    return '';
  }
}

/**
 * 异步版本，便于在需要异步接口的页面（如服务器组件）中使用 await。
 */
export async function getCsrfTokenAsync(): Promise<string> {
  try {
    return cookies().get('csrf-token')?.value || '';
  } catch {
    return '';
  }
}
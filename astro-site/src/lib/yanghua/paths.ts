import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 统一管理“旧站内容/数据文件”的路径，避免散落在各页面里手写相对路径。
 *
 * 注意：Astro 的 `import.meta.url` 在构建与 dev 时都可用。
 */

/**
 * 旧站内容路径解析策略（必须在 dev / build / preview 都稳定）：
 * - 优先基于 `process.cwd()` 推断（dev/preview 时 cwd 通常是 astro-site）
 * - 在多个候选中选择第一个真实存在 `content/settings/site.json` 的目录
 */
function resolveLegacyNextRoot(): string {
  const candidates = [
    // 1) cwd = astro-site
    resolve(process.cwd(), '..', 'yanghua-b2b-website'),
    // 2) cwd = repo root
    resolve(process.cwd(), 'yanghua-b2b-website'),
    // 3) 兜底：再往上一层
    resolve(process.cwd(), '..', '..', 'yanghua-b2b-website'),
  ];
  for (const c of candidates) {
    if (existsSync(resolve(c, 'content', 'settings', 'site.json'))) return c;
  }
  // 最终兜底（保持旧行为）
  return resolve(process.cwd(), '..', 'yanghua-b2b-website');
}

export const astroSiteRoot = process.cwd();
export const legacyNextRoot = resolveLegacyNextRoot();
export const repoRoot = resolve(legacyNextRoot, '..');
export const legacyContentRoot = resolve(legacyNextRoot, 'content');
export const legacyMessagesRoot = resolve(legacyNextRoot, 'src', 'messages');
export const legacyPublicDataRoot = resolve(legacyNextRoot, 'public', 'data');
export const legacyPublicImagesRoot = resolve(legacyNextRoot, 'public', 'images');

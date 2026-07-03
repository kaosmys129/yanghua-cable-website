import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 统一管理"旧站内容/数据文件"的路径，避免散落在各页面里手写相对路径。
 *
 * 注意：Astro 的 `import.meta.url` 在构建与 dev 时都可用。
 */

/**
 * 旧站内容路径解析策略（必须在 dev / build / preview 都稳定）：
 * - 优先检查 prebuild 复制到 src/data/legacy-content/ 的内容（Vercel 构建兼容）
 * - 其次基于 `process.cwd()` 推断（dev/preview 时 cwd 通常是 astro-site）
 * - 在多个候选中选择第一个真实存在 `content/settings/site.json` 的目录
 */
function resolveLegacyNextRoot(): string {
  const cwd = process.cwd();

  const candidates = [
    // 0) prebuild 复制到项目内的内容（Vercel 构建环境优先）
    resolve(cwd, 'src', 'data', 'legacy-content'),
    // 1) cwd = astro-site, 旧站在兄弟目录
    resolve(cwd, '..', 'yanghua-b2b-website'),
    // 2) cwd = repo root
    resolve(cwd, 'yanghua-b2b-website'),
    // 3) 兜底：再往上一层
    resolve(cwd, '..', '..', 'yanghua-b2b-website'),
  ];
  for (const c of candidates) {
    if (existsSync(resolve(c, 'content', 'settings', 'site.json'))) return c;
  }
  // 最终兜底（保持旧行为）
  return resolve(cwd, '..', 'yanghua-b2b-website');
}

export const astroSiteRoot = process.cwd();

/**
 * 旧站根目录（包含 content/ 和 src/messages/）
 * 但是 prebuild 模式下 legacy-content 没有 src/messages/ 子目录
 * 所以我们需要独立解析 messages 路径
 */
const _resolvedLegacyNext = resolveLegacyNextRoot();
const _isPrebuildPath = _resolvedLegacyNext.includes('legacy-content');

export const legacyNextRoot = _resolvedLegacyNext;
export const repoRoot = resolve(legacyNextRoot, '..');
export const legacyContentRoot = resolve(legacyNextRoot, 'content');

// messages 独立解析：prebuild 模式下消息也放在 legacy-content 内
export const legacyMessagesRoot = _isPrebuildPath
  ? resolve(legacyNextRoot, 'messages')
  : resolve(legacyNextRoot, 'src', 'messages');

export const legacyPublicDataRoot = resolve(legacyNextRoot, 'public', 'data');

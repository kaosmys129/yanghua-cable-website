import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * 统一管理“旧站内容/数据文件”的路径，避免散落在各页面里手写相对路径。
 *
 * 注意：Astro 的 `import.meta.url` 在构建与 dev 时都可用。
 */

export const astroSiteRoot = fileURLToPath(new URL('../../../../', import.meta.url));
export const repoRoot = fileURLToPath(new URL('../../../../../', import.meta.url));

export const legacyNextRoot = resolve(repoRoot, 'yanghua-b2b-website');
export const legacyContentRoot = resolve(legacyNextRoot, 'content');
export const legacyMessagesRoot = resolve(legacyNextRoot, 'src', 'messages');
export const legacyPublicDataRoot = resolve(legacyNextRoot, 'public', 'data');
export const legacyPublicImagesRoot = resolve(legacyNextRoot, 'public', 'images');


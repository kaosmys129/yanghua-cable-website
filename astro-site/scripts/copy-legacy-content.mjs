/**
 * prebuild: 将旧 Next.js 项目的内容文件复制到 astro-site 内部。
 * 
 * 这样 Vercel 构建时可以访问所有内容，不依赖项目根目录外的文件。
 * 复制目标结构: 
 *   src/data/legacy-content/content/{articles,hubs,pages,settings}/
 *   src/data/legacy-content/messages/{en,es}.json
 * 与原始 yanghua-b2b-website/ 结构保持一致。
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const astroRoot = resolve(__dirname, '..');
const destLegacyRoot = resolve(astroRoot, 'src', 'data', 'legacy-content');

// 候选源路径
const sourceNextRoot = resolve(astroRoot, '..', 'yanghua-b2b-website');
const sourceContentRoot = resolve(sourceNextRoot, 'content');
const sourceMessagesRoot = resolve(sourceNextRoot, 'src', 'messages');

let copied = false;

// 复制 content/ 目录
if (existsSync(resolve(sourceContentRoot, 'settings', 'site.json'))) {
  console.log(`[prebuild] 从源复制内容: ${sourceContentRoot}`);
  const destContentRoot = resolve(destLegacyRoot, 'content');

  const subdirs = ['pages', 'articles', 'hubs', 'settings'];
  for (const sub of subdirs) {
    const src = resolve(sourceContentRoot, sub);
    const dest = resolve(destContentRoot, sub);
    if (existsSync(src)) {
      mkdirSync(dest, { recursive: true });
      cpSync(src, dest, { recursive: true, force: true });
      console.log(`[prebuild] ✓ 已复制: content/${sub}`);
    } else {
      console.warn(`[prebuild] ⚠ 未找到: content/${sub}`);
    }
  }
  copied = true;
} else {
  console.warn('[prebuild] ⚠ 未找到旧站内容源。如果这是 Vercel 构建，请确认内容已就位。');
  console.warn(`[prebuild] 检查路径: ${sourceContentRoot}`);
}

// 复制 messages/ 目录
if (existsSync(sourceMessagesRoot)) {
  console.log(`[prebuild] 从源复制消息: ${sourceMessagesRoot}`);
  const destMessagesRoot = resolve(destLegacyRoot, 'messages');
  mkdirSync(destMessagesRoot, { recursive: true });
  cpSync(sourceMessagesRoot, destMessagesRoot, { recursive: true, force: true });
  console.log('[prebuild] ✓ 已复制: messages');
  copied = true;
}

if (!copied) {
  console.warn('[prebuild] ⚠ 没有复制任何内容。如果这是 Vercel 构建，请确认内容源路径正确。');
  // 不报错退出，让构建继续
}

console.log('[prebuild] ✓ 内容复制完成');

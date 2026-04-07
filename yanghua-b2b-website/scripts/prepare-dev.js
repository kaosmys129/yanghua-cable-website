import { access, rm } from 'node:fs/promises';
import path from 'node:path';

const nextDir = path.join(process.cwd(), '.next-dev');

async function main() {
  try {
    await access(nextDir);
  } catch {
    return;
  }

  await rm(nextDir, { recursive: true, force: true });
  console.log('[prepare-dev] Removed stale .next-dev directory before next dev');
}

main().catch((error) => {
  console.error('[prepare-dev] Failed to prepare dev environment:', error);
  process.exit(1);
});

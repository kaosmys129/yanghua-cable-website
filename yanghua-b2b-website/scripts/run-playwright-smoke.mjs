import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const projectRoot = process.cwd();
const devLogPath = path.join(projectRoot, 'dev.log');
const candidatePorts = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];

async function extractBaseUrlFromLog() {
  try {
    const log = await readFile(devLogPath, 'utf8');
    const matches = [...log.matchAll(/- Local:\s*(http:\/\/localhost:\d+)/g)];
    return matches.at(-1)?.[1] ?? null;
  } catch {
    return null;
  }
}

async function canReach(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/api/health`, {
      method: 'HEAD',
      headers: { 'user-agent': 'Playwright Smoke Runner' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function resolveBaseUrl() {
  if (process.env.PLAYWRIGHT_BASE_URL) {
    return process.env.PLAYWRIGHT_BASE_URL;
  }

  const fromLog = await extractBaseUrlFromLog();
  if (fromLog && await canReach(fromLog)) {
    return fromLog.replace('localhost', '127.0.0.1');
  }

  for (const port of candidatePorts) {
    const candidate = `http://127.0.0.1:${port}`;
    if (await canReach(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function main() {
  const baseUrl = await resolveBaseUrl();
  const args = ['playwright', 'test', '-c', 'playwright.smoke.config.ts', ...process.argv.slice(2)];
  const env = { ...process.env };

  if (baseUrl) {
    env.PLAYWRIGHT_BASE_URL = baseUrl;
    console.log(`[playwright-smoke] Reusing running dev server: ${baseUrl}`);
  } else {
    console.log('[playwright-smoke] No running dev server detected. Playwright will start an isolated server on port 3011.');
  }

  const child = spawn('npx', args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error('[playwright-smoke] Failed to start:', error);
  process.exit(1);
});

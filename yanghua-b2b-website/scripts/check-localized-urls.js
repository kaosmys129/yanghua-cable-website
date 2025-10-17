#!/usr/bin/env node
/**
 * Continuous check for hard-coded Spanish URLs using English segments.
 * Scans source code and reports any occurrences of `/es/(products|solutions|services|projects|articles|about|contact)`
 * and `/es/products/category` outside of allowlisted files.
 *
 * Exit code:
 * - 0: No violations found
 * - 1: Violations detected
 */

import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const SRC_DIR = path.join(projectRoot, 'src');

// Files where English segments under /es are intentionally present (redirects/rewrite/disallow lists)
const ALLOWLIST_PATHS = new Set([
  path.join(SRC_DIR, 'middleware.ts'),
  path.join(SRC_DIR, 'app', 'robots.ts'),
]);

// File extensions to scan
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.md']);

// Regex patterns to detect unwanted /es/<english-segment>
const MAIN_PATTERN = /\/es\/(products|solutions|services|projects|articles|about|contact)(\/|\b)/gi;
const CATEGORY_PATTERN = /\/es\/products\/category(\/|\b)/gi;

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Skip some known directories
      if (e.name === '.next' || e.name === 'public' || e.name === '__mocks__') continue;
      walk(full, out);
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (EXTS.has(ext)) out.push(full);
    }
  }
  return out;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  const violations = [];

  function collectMatches(regex) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const idx = match.index;
      const prefix = content.slice(0, idx);
      const lineNumber = (prefix.match(/\n/g) || []).length + 1;
      violations.push({ line: lineNumber, match: match[0] });
    }
  }

  collectMatches(MAIN_PATTERN);
  collectMatches(CATEGORY_PATTERN);

  return violations;
}

function run() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('[check-localized-urls] src directory not found:', SRC_DIR);
    process.exit(1);
  }

  const files = walk(SRC_DIR);
  const results = [];

  for (const f of files) {
    if (ALLOWLIST_PATHS.has(f)) continue;
    const v = scanFile(f);
    if (v.length) {
      results.push({ file: path.relative(projectRoot, f), violations: v });
    }
  }

  if (results.length === 0) {
    console.log('[check-localized-urls] OK: No hard-coded /es/<english-segment> URLs found.');
    process.exit(0);
  } else {
    console.error('[check-localized-urls] Violations detected:');
    for (const r of results) {
      console.error(`\nFile: ${r.file}`);
      for (const v of r.violations) {
        console.error(`  Line ${v.line}: ${v.match}`);
      }
    }
    console.error(`\nTotal files with violations: ${results.length}`);
    process.exit(1);
  }
}

run();
#!/usr/bin/env node
/**
 * csv_to_jsonl.mjs
 *
 * 用法：
 *   node scripts/csv_to_jsonl.mjs \
 *     --csv path/to/file.csv \
 *     --collection products \
 *     --out import/entities_00001.jsonl
 *
 * 功能：
 *   1. 读取 CSV 文件（首行作为列名）。
 *   2. 将每行转换为符合 Strapi import 要求的 JSON 对象，并写入 JSON Lines 文件（一行一个 JSON）。
 *   3. 对象格式示例：
 *        {
 *          "__collection__": "products",
 *          "title": "Product A",
 *          "price": 19.99
 *        }
 *      Strapi 在导入时会根据 __collection__ 字段将条目放入对应的 collection。
 *   4. 输出文件路径不存在时自动创建目录。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseCsv } from 'csv-parse/sync';

// ------------------------- CLI 参数解析 -------------------------
function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key || !value) break;
    args[key.replace(/^--/, '')] = value;
  }
  return args;
}

const { csv, collection, out } = parseArgs();
if (!csv || !collection || !out) {
  console.error(
    '\u001b[31mMissing required arguments.\u001b[0m\n' +
      'Usage: node scripts/csv_to_jsonl.mjs --csv <file.csv> --collection <name> --out <output.jsonl>'
  );
  process.exit(1);
}

// ------------------------- 读取 CSV -------------------------
let input;
try {
  input = fs.readFileSync(csv, 'utf8');
} catch (err) {
  console.error(`Cannot read CSV file at ${csv}:`, err.message);
  process.exit(1);
}

const records = parseCsv(input, {
  columns: true,
  skip_empty_lines: true,
});

// ------------------------- 写入 JSONL -------------------------
const jsonlLines = records
  .map((row) =>
    JSON.stringify({
      __collection__: collection,
      ...row,
    })
  )
  .join('\n');

// 确保输出目录存在
const outDir = path.dirname(out);
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(out, jsonlLines, 'utf8');
console.log(`\u001b[32m✔ Wrote ${records.length} records to ${out}\u001b[0m`);
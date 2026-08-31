import { readdirSync, readFileSync, statSync } from 'node:fs';
import matter from 'gray-matter';
import { findSpanishArticleIssues } from '../src/lib/yanghua/spanish-article-policy.mjs';

const projectRoot = new URL('..', import.meta.url);
const articleDir = new URL('./src/data/legacy-content/content/articles/es/', projectRoot);
const publicDir = new URL('./public/', projectRoot);
const files = readdirSync(articleDir).filter((file) => file.endsWith('.mdx')).sort();
const failures = [];

for (const file of files) {
  const fileUrl = new URL(file, articleDir);
  const source = readFileSync(fileUrl, 'utf8');
  const parsed = matter(source);
  const issues = findSpanishArticleIssues({
    source,
    body: parsed.content,
    frontmatter: parsed.data,
  });

  const coverSrc = parsed.data.cover?.src;
  if (!/^\/storage\/uploads\/images\/articles\/es\//.test(String(coverSrc || ''))) {
    issues.push('cover is not a local Spanish article asset');
  } else {
    const coverPath = new URL(`.${coverSrc}`, publicDir);
    try {
      if (!statSync(coverPath).isFile()) issues.push('cover asset is not a file');
    } catch {
      issues.push('cover asset is missing');
    }
  }

  if (issues.length > 0) {
    failures.push(`${file}: ${issues.join(', ')}`);
  }
}

if (failures.length > 0) {
  console.error('Spanish article validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${files.length} Spanish articles.`);
}

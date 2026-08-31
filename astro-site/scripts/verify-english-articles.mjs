import { readdirSync, readFileSync, statSync } from 'node:fs';
import matter from 'gray-matter';

const projectRoot = new URL('..', import.meta.url);
const articleDir = new URL('./src/data/legacy-content/content/articles/en/', projectRoot);
const publicDir = new URL('./public/', projectRoot);
const files = readdirSync(articleDir).filter((file) => file.endsWith('.mdx')).sort();
const failures = [];

function publicAssetPath(src) {
  return new URL(`.${src}`, publicDir);
}

function markdownImageSources(body) {
  return [...body.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)].map((match) => match[1]);
}

for (const file of files) {
  const fileUrl = new URL(file, articleDir);
  const source = readFileSync(fileUrl, 'utf8');
  const parsed = matter(source);
  const coverSrc = parsed.data.cover?.src;

  if (!coverSrc || typeof coverSrc !== 'string' || !coverSrc.startsWith('/')) {
    failures.push(`${file}: cover is missing or not a local root-relative path: ${coverSrc}`);
  } else {
    try {
      const coverPath = publicAssetPath(coverSrc);
      const st = statSync(coverPath);
      if (!st.isFile() || st.size === 0) {
        failures.push(`${file}: cover asset is invalid or empty: ${coverSrc}`);
      }
    } catch {
      failures.push(`${file}: cover asset does not exist: ${coverSrc}`);
    }
  }

  const bodyImages = markdownImageSources(parsed.content);
  for (const imgSrc of bodyImages) {
    if (!imgSrc || typeof imgSrc !== 'string' || !imgSrc.startsWith('/')) {
      failures.push(`${file}: body image is not a local root-relative path: ${imgSrc}`);
    } else {
      try {
        const imgPath = publicAssetPath(imgSrc);
        const st = statSync(imgPath);
        if (!st.isFile() || st.size === 0) {
          failures.push(`${file}: body image is invalid or empty: ${imgSrc}`);
        }
      } catch {
        failures.push(`${file}: body image does not exist: ${imgSrc}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('English article validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${files.length} English articles successfully.`);
}

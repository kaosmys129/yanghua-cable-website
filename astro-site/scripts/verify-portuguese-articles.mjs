import { readdirSync, readFileSync, statSync } from 'node:fs';
import matter from 'gray-matter';

const projectRoot = new URL('..', import.meta.url);
const articleDir = new URL('./src/data/legacy-content/content/articles/pt/', projectRoot);
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

  // Ensure no English fallback blocks
  if (/^##\s+(?:Referência em inglês|English Reference)/im.test(source)) {
    failures.push(`${file}: contains legacy English Reference section`);
  }
  if (/fallbackLocale\s*[:"]\s*["']en["']/i.test(source)) {
    failures.push(`${file}: contains fallbackLocale en`);
  }
  if (/bodySource\s*[:"]\s*["']summary\+english-fallback["']/i.test(source)) {
    failures.push(`${file}: contains summary+english-fallback bodySource`);
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
  console.error('Portuguese article validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${files.length} Portuguese articles successfully.`);
}

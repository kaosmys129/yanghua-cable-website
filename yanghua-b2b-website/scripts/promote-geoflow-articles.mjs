import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentRoot = path.join(process.cwd(), 'content');
const incomingRoot = path.join(contentRoot, 'articles', '_incoming');
const overwrite = process.argv.includes('--overwrite');

const result = {
  promoted: [],
  skipped: [],
};

for (const locale of ['en', 'es']) {
  const localeIncomingRoot = path.join(incomingRoot, locale);
  if (!fs.existsSync(localeIncomingRoot)) {
    continue;
  }

  for (const entry of fs.readdirSync(localeIncomingRoot)) {
    if (!entry.endsWith('.mdx')) {
      continue;
    }

    const sourcePath = path.join(localeIncomingRoot, entry);
    const raw = fs.readFileSync(sourcePath, 'utf8');
    const parsed = matter(raw);
    if (parsed.data.geoflow?.reviewStatus === 'needs_geo_metadata') {
      result.skipped.push(`${path.relative(process.cwd(), sourcePath)} (needs_geo_metadata)`);
      continue;
    }

    const slug = String(parsed.data.slug || path.basename(entry, '.mdx').replace(/^geoflow-/, ''));
    const targetLocale = parsed.data.locale === 'es' ? 'es' : 'en';
    const targetDir = path.join(contentRoot, 'articles', targetLocale);
    const targetPath = path.join(targetDir, `${slug}.mdx`);

    if (fs.existsSync(targetPath) && !overwrite) {
      result.skipped.push(path.relative(process.cwd(), targetPath));
      continue;
    }

    fs.mkdirSync(targetDir, { recursive: true });
    fs.renameSync(sourcePath, targetPath);
    result.promoted.push(path.relative(process.cwd(), targetPath));
  }
}

console.log(JSON.stringify(result, null, 2));

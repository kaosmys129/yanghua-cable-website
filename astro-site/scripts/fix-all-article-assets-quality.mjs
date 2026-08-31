import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join } from 'node:path';
import matter from 'gray-matter';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const enDir = join(projectRoot, 'src/data/legacy-content/content/articles/en');
const esDir = join(projectRoot, 'src/data/legacy-content/content/articles/es');
const ptDir = join(projectRoot, 'src/data/legacy-content/content/articles/pt');
const publicDir = join(projectRoot, 'public');

const noImageBuf = readFileSync(join(publicDir, 'images/no-image-available.webp'));
const noImageCopyPath = join(publicDir, 'images/no-image-available-copy.webp');
const noImageCopyBuf = existsSync(noImageCopyPath) ? readFileSync(noImageCopyPath) : null;

function getQualityAssets(dir) {
  let list = [];
  if (!existsSync(dir)) return list;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      list = list.concat(getQualityAssets(full));
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(ent.name)) {
      const size = statSync(full).size;
      if (
        size > 20000 &&
        !full.includes('no-image-available') &&
        !full.includes('placeholder') &&
        !full.includes('/images/news/') &&
        !full.includes('/images/products/')
      ) {
        list.push(full);
      }
    }
  }
  return list;
}

const verifiedPool = [
  ...getQualityAssets(join(publicDir, 'storage/uploads/images/2026/07')),
  ...getQualityAssets(join(publicDir, 'images/yanghua-products')),
  ...getQualityAssets(join(publicDir, 'images/projects')),
  ...getQualityAssets(join(publicDir, 'images/solutions')),
  ...getQualityAssets(join(publicDir, 'images/product-center')),
  ...getQualityAssets(join(publicDir, 'images/homepage')),
];

function getPoolAsset(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % verifiedPool.length;
  return verifiedPool[index];
}

function isInvalidAsset(filePath) {
  if (!existsSync(filePath)) return true;
  try {
    const st = statSync(filePath);
    if (!st.isFile() || st.size < 10000) return true;
    const buf = readFileSync(filePath);
    if (buf.equals(noImageBuf) || (noImageCopyBuf && buf.equals(noImageCopyBuf))) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

function processLocaleDir(dirName, dirPath) {
  const files = readdirSync(dirPath).filter((f) => f.endsWith('.mdx'));
  let fixedCovers = 0;
  let fixedBodyImgs = 0;

  for (const file of files) {
    const mdxPath = join(dirPath, file);
    const raw = readFileSync(mdxPath, 'utf8');
    const parsed = matter(raw);
    const slug = parsed.data.slug || file.replace(/\.mdx$/, '');
    let updatedRaw = raw;

    // Check cover
    const coverSrc = parsed.data.cover?.src || '';
    const coverAbs = coverSrc.startsWith('/') ? join(publicDir, coverSrc.replace(/^\//, '')) : '';

    if (!coverSrc || isInvalidAsset(coverAbs)) {
      const replacementAsset = getPoolAsset(`${slug}-cover`);
      const ext = extname(replacementAsset) || '.jpg';
      const targetRel = `/storage/uploads/images/articles/${dirName}/${slug}/cover${ext}`;
      const targetAbs = join(publicDir, `storage/uploads/images/articles/${dirName}/${slug}/cover${ext}`);

      mkdirSync(dirname(targetAbs), { recursive: true });
      copyFileSync(replacementAsset, targetAbs);

      if (coverSrc) {
        updatedRaw = updatedRaw.replace(coverSrc, targetRel);
      } else {
        updatedRaw = updatedRaw.replace(
          /^---\n/m,
          `---\n  "cover": {\n    "src": "${targetRel}",\n    "alt": "${parsed.data.title || slug}"\n  },\n`
        );
      }
      fixedCovers++;
    }

    // Check body images
    const bodyImages = [...parsed.content.matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)];
    bodyImages.forEach((m, idx) => {
      const altText = m[1];
      const src = m[2];
      const imgAbs = src.startsWith('/') ? join(publicDir, src.replace(/^\//, '')) : '';

      if (!src || isInvalidAsset(imgAbs)) {
        const replacementAsset = getPoolAsset(`${slug}-body-${idx + 1}`);
        const ext = extname(replacementAsset) || '.jpg';
        const targetRel = `/storage/uploads/images/articles/${dirName}/${slug}/body-${idx + 1}${ext}`;
        const targetAbs = join(publicDir, `storage/uploads/images/articles/${dirName}/${slug}/body-${idx + 1}${ext}`);

        mkdirSync(dirname(targetAbs), { recursive: true });
        copyFileSync(replacementAsset, targetAbs);

        updatedRaw = updatedRaw.replace(src, targetRel);
        fixedBodyImgs++;
      }
    });

    writeFileSync(mdxPath, updatedRaw, 'utf8');
  }

  console.log(`[${dirName}] Finished: ${fixedCovers} covers fixed, ${fixedBodyImgs} body images fixed.`);
}

console.log(`Using verified pool of ${verifiedPool.length} high-quality assets.`);
processLocaleDir('en', enDir);
processLocaleDir('es', esDir);
processLocaleDir('pt', ptDir);

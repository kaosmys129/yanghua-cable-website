import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import matter from 'gray-matter';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const ptArticleDir = join(projectRoot, 'src/data/legacy-content/content/articles/pt');
const esArticleDir = join(projectRoot, 'src/data/legacy-content/content/articles/es');
const generatedDir = join(projectRoot, 'public/images/ai-generated');
const outputDir = join(projectRoot, 'public/storage/uploads/images/articles/pt');
const publicDir = join(projectRoot, 'public');

const placeholderText =
  'Atualização de notícias de Yanghua. O conteúdo completo do artigo não estava disponível na exportação original, portanto esta página mostra o resumo e os metadatos disponíveis.';

function isNonEmptyFile(filePath) {
  try {
    return statSync(filePath).isFile() && statSync(filePath).size > 0;
  } catch {
    return false;
  }
}

function getAllImages(dir) {
  let results = [];
  if (!existsSync(dir)) return results;
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getAllImages(full));
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(item.name)) {
      results.push(full);
    }
  }
  return results;
}

const fallbackPool = [
  ...getAllImages(join(publicDir, 'images/yanghua-products')),
  ...getAllImages(join(publicDir, 'images/products')),
  ...getAllImages(join(publicDir, 'images/news')),
  ...getAllImages(join(publicDir, 'images/solutions')),
  ...getAllImages(join(publicDir, 'images/projects')),
].filter(isNonEmptyFile);

if (fallbackPool.length === 0) {
  fallbackPool.push(join(publicDir, 'images/no-image-available.webp'));
}

// Build Spanish article mapping for cover reuse
const esMap = new Map();
if (existsSync(esArticleDir)) {
  for (const file of readdirSync(esArticleDir).filter((f) => f.endsWith('.mdx'))) {
    const parsed = matter(readFileSync(join(esArticleDir, file), 'utf8'));
    if (parsed.data.translationKey) esMap.set(parsed.data.translationKey, parsed.data);
    if (parsed.data.sourceId) esMap.set(String(parsed.data.sourceId), parsed.data);
  }
}

function getPoolImage(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % fallbackPool.length;
  return fallbackPool[index];
}

const ptFiles = readdirSync(ptArticleDir).filter((f) => f.endsWith('.mdx')).sort();
const tempDir = mkdtempSync(join(tmpdir(), 'yanghua-pt-assets-'));
const changes = [];

try {
  for (const file of ptFiles) {
    const filePath = join(ptArticleDir, file);
    const source = readFileSync(filePath, 'utf8');
    const parsed = matter(source);
    const hasPortugueseSummary = parsed.content.includes('## Resumo');
    const headingIndex = source.search(/^##\s+(?:Referência em inglês|English Reference)/im);
    let migratedSource = source;

    // Clean up English fallback body
    if (headingIndex >= 0) {
      const bodyDivider = source.lastIndexOf('\n---', headingIndex);
      migratedSource = source.slice(0, bodyDivider) + (hasPortugueseSummary ? '\n' : `\n\n${placeholderText}\n`);
      migratedSource = migratedSource.replace(/^\s*"fallbackLocale":\s*"en",?\n/m, '');
      migratedSource = migratedSource.replace(
        /^\s*"bodySource":\s*"summary\+english-fallback"/m,
        `  "bodySource": "${hasPortugueseSummary ? 'summary' : 'placeholder'}"`
      );
    }

    // Ensure locale is 'pt'
    migratedSource = migratedSource.replace(/"locale":\s*"es"/, '"locale": "pt"');

    const slug = parsed.data.slug || file.replace(/\.mdx$/, '');
    const sourceId = String(parsed.data.sourceId || '');
    const translationKey = parsed.data.translationKey || '';
    const articleId = String(translationKey).match(/(\d+)$/)?.[1] || sourceId;

    const coverSrc = parsed.data.cover?.src || '';

    // Handle Cover Image
    if (/^https?:\/\//i.test(coverSrc) || /^\/\//i.test(coverSrc)) {
      const esMatch = (translationKey && esMap.get(translationKey)) || (sourceId && esMap.get(sourceId));
      let coverSourceFile = null;

      if (esMatch?.cover?.src) {
        const candidate = join(publicDir, esMatch.cover.src.replace(/^\//, ''));
        if (isNonEmptyFile(candidate)) {
          coverSourceFile = candidate;
        }
      }

      if (!coverSourceFile && existsSync(generatedDir)) {
        const generated = readdirSync(generatedDir).find(
          (c) => (articleId && c.endsWith(`-${articleId}-cover.jpg`)) || c.startsWith(`${slug}-cover`)
        );
        if (generated && isNonEmptyFile(join(generatedDir, generated))) {
          coverSourceFile = join(generatedDir, generated);
        }
      }

      if (!coverSourceFile) {
        coverSourceFile = getPoolImage(`${slug}-cover-pt`);
      }

      const ext = extname(coverSourceFile) || '.jpg';
      const targetRelPath = `/storage/uploads/images/articles/pt/${slug}/cover${ext}`;
      const targetAbsPath = join(outputDir, slug, `cover${ext}`);

      migratedSource = migratedSource.replace(coverSrc, targetRelPath);
      changes.push({
        sourceFile: coverSourceFile,
        targetFile: targetAbsPath,
      });
    }

    writeFileSync(filePath, migratedSource, 'utf8');
  }

  // Execute all asset copies
  for (const change of changes) {
    mkdirSync(dirname(change.targetFile), { recursive: true });
    const staged = join(tempDir, `stage-${Date.now()}-${Math.random().toString(36).slice(2)}${extname(change.targetFile)}`);
    copyFileSync(change.sourceFile, staged);
    if (!isNonEmptyFile(staged)) {
      throw new Error(`Asset failed copy validation: ${change.sourceFile} -> ${change.targetFile}`);
    }
    renameSync(staged, change.targetFile);
  }

  console.log(`Successfully migrated ${changes.length} Portuguese article covers and cleaned up English fallback content.`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

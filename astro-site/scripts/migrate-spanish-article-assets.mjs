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
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import matter from 'gray-matter';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const articleDir = join(projectRoot, 'src/data/legacy-content/content/articles/es');
const generatedDir = join(projectRoot, 'public/images/ai-generated');
const outputDir = join(projectRoot, 'public/storage/uploads/images/articles/es');
const placeholderText =
  'Actualizacion de noticias de Yanghua. El contenido completo del articulo no estaba disponible en la exportacion original, por lo que esta pagina muestra el resumen y los metadatos disponibles.';

const files = readdirSync(articleDir).filter((file) => file.endsWith('.mdx')).sort();
const changes = [];
const tempDir = mkdtempSync(join(tmpdir(), 'yanghua-es-assets-'));

function isNonEmptyFile(filePath) {
  try {
    return statSync(filePath).isFile() && statSync(filePath).size > 0;
  } catch {
    return false;
  }
}

function localAssetPath(src) {
  if (!src.startsWith('/storage/uploads/images/articles/es/')) return null;
  return join(projectRoot, 'public', src.slice(1));
}

function normalizedExtension(src) {
  const extension = extname(new URL(src, 'https://local.invalid').pathname).toLowerCase();
  return extension === '.jpeg' ? '.jpg' : ['.jpg', '.png', '.webp', '.gif', '.avif'].includes(extension) ? extension : '.bin';
}

async function downloadRemoteAsset(src, file) {
  let response;
  try {
    response = await fetch(src, { redirect: 'follow' });
  } catch (error) {
    throw new Error(`Unable to download Spanish article image ${src}: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(`Unable to download Spanish article image ${src}: HTTP ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) {
    throw new Error(`Downloaded Spanish article image is empty: ${src}`);
  }

  const target = join(tempDir, `${file}-${Date.now()}${normalizedExtension(src)}`);
  writeFileSync(target, bytes);
  if (!isNonEmptyFile(target)) {
    throw new Error(`Downloaded Spanish article image failed validation: ${src}`);
  }
  return target;
}

try {
  for (const file of files) {
    const filePath = join(articleDir, file);
    const source = readFileSync(filePath, 'utf8');
    const parsed = matter(source);
    const hasSpanishSummary = parsed.content.includes('## Resumen');
    const headingIndex = source.indexOf('## English Reference');
    let migratedSource = source;

    if (headingIndex >= 0) {
      const bodyDivider = source.lastIndexOf('\n---', headingIndex);
      migratedSource = source.slice(0, bodyDivider) + (hasSpanishSummary ? '\n' : `\n\n${placeholderText}\n`);
      migratedSource = migratedSource.replace(/^\s*"fallbackLocale":\s*"en",\n/m, '');
      migratedSource = migratedSource.replace(
        /^\s*"bodySource":\s*"summary\+english-fallback"/m,
        `  "bodySource": "${hasSpanishSummary ? 'summary' : 'placeholder'}"`
      );
    }

    if (/!\[[^\]]*\]\(https?:\/\//i.test(migratedSource)) {
      throw new Error(`Spanish article still contains a remote Markdown image: ${file}`);
    }

    const { slug, sourceId, translationKey, cover } = parsed.data;
    if (!slug || !sourceId || !cover?.src) {
      throw new Error(`Spanish article is missing slug, sourceId, or cover: ${file}`);
    }

    const articleId = String(translationKey || '').match(/(\d+)$/)?.[1] || String(sourceId);
    const generated = readdirSync(generatedDir).find((candidate) => candidate.endsWith(`-${articleId}-cover.jpg`));
    const existingLocal = localAssetPath(cover.src);
    const assetSource = generated
      ? join(generatedDir, generated)
      : existingLocal && isNonEmptyFile(existingLocal)
        ? existingLocal
        : /^https?:\/\//i.test(cover.src)
          ? await downloadRemoteAsset(cover.src, slug)
          : null;

    if (!assetSource || !isNonEmptyFile(assetSource)) {
      throw new Error(`Spanish article image is unavailable or empty: ${file}`);
    }

    const extension = generated ? '.jpg' : normalizedExtension(cover.src) === '.bin' ? '.webp' : normalizedExtension(cover.src);
    const relativeAsset = `/storage/uploads/images/articles/es/${slug}/cover${extension}`;

    migratedSource = migratedSource.replace(cover.src, relativeAsset);
    changes.push({
      filePath,
      source: migratedSource,
      slug,
      assetSource,
      assetTarget: join(outputDir, slug, `cover${extension}`),
    });
  }

  for (const change of changes) {
    mkdirSync(dirname(change.assetTarget), { recursive: true });
    const stagedTarget = join(tempDir, `${change.slug}-${Date.now()}${extname(change.assetTarget)}`);
    copyFileSync(change.assetSource, stagedTarget);
    if (!isNonEmptyFile(stagedTarget)) {
      throw new Error(`Spanish article image failed final validation: ${change.filePath}`);
    }
    renameSync(stagedTarget, change.assetTarget);
    const staleWebp = join(dirname(change.assetTarget), 'cover.webp');
    if (change.assetTarget.endsWith('.jpg') && existsSync(staleWebp)) unlinkSync(staleWebp);
    writeFileSync(change.filePath, change.source, 'utf8');
  }

  console.log(`Migrated ${changes.length} Spanish article covers and removed legacy English fallbacks.`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

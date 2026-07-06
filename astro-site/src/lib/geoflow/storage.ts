import fs from 'fs';
import path from 'path';
import {
  buildIncomingArticleMdx,
  getArticleRelativeUrl,
  normalizeGeoflowArticlePayload,
  type GeoflowArticlePayload,
} from './article';
import type { ReplayStore } from './security';

type ReceiveInput = {
  payload: GeoflowArticlePayload;
  idempotencyKey: string;
  contentRoot?: string;
  now?: Date;
  isUpdate?: boolean;
};

type ReceiveResult = {
  ok: true;
  remoteId: string;
  remoteUrl: string;
  status: 'imported' | 'duplicate';
};

type ImportLogEntry = ReceiveResult & {
  idempotencyKey: string;
  geoflowArticleId: string;
  locale: string;
  slug: string;
  incomingPath: string;
  importedAt: string;
  targetQueries: string[];
  reviewStatus: 'approved' | 'needs_review' | 'needs_geo_metadata';
};

// 健壮的目录解析逻辑，支持在不同 cwd 下定位双重目录
function resolveContentRoots() {
  const cwd = process.cwd();
  let astroContentRoot = '';
  let legacyContentRoot = '';

  // 1. 如果是在 astro-site 目录下
  if (fs.existsSync(path.join(cwd, 'src/data/legacy-content/content'))) {
    astroContentRoot = path.join(cwd, 'src/data/legacy-content/content');
    legacyContentRoot = path.resolve(cwd, '../yanghua-b2b-website/content');
  } 
  // 2. 如果是在 monorepo 根目录下
  else if (fs.existsSync(path.join(cwd, 'astro-site/src/data/legacy-content/content'))) {
    astroContentRoot = path.join(cwd, 'astro-site/src/data/legacy-content/content');
    legacyContentRoot = path.join(cwd, 'yanghua-b2b-website/content');
  }
  // 3. Fallback 回退
  else {
    astroContentRoot = path.join(cwd, 'src/data/legacy-content/content');
    legacyContentRoot = '';
  }

  return { astroContentRoot, legacyContentRoot };
}

export async function receiveGeoflowArticle(input: ReceiveInput): Promise<ReceiveResult> {
  if (!input.idempotencyKey) {
    throw new Error('idempotencyKey is required');
  }

  const { astroContentRoot, legacyContentRoot } = resolveContentRoots();
  const contentRoot = input.contentRoot || astroContentRoot;

  const log = readImportLog(contentRoot);
  const duplicate = log.find((entry) => entry.idempotencyKey === input.idempotencyKey);
  if (duplicate && !input.isUpdate) {
    return {
      ok: true,
      remoteId: duplicate.remoteId,
      remoteUrl: duplicate.remoteUrl,
      status: 'duplicate',
    };
  }

  const article = normalizeGeoflowArticlePayload(input.payload);
  const targetDirAstro = path.join(contentRoot, 'articles', article.locale);
  fs.mkdirSync(targetDirAstro, { recursive: true });

  const fileName = `${article.slug}.mdx`;
  const targetPathAstro = path.join(targetDirAstro, fileName);
  fs.writeFileSync(targetPathAstro, buildIncomingArticleMdx(article), 'utf8');

  // 双重写入：Legacy Next 目录
  let targetPathLegacy = '';
  if (legacyContentRoot && fs.existsSync(path.dirname(legacyContentRoot))) {
    const targetDirLegacy = path.join(legacyContentRoot, 'articles', article.locale);
    fs.mkdirSync(targetDirLegacy, { recursive: true });
    targetPathLegacy = path.join(targetDirLegacy, fileName);
    try {
      fs.writeFileSync(targetPathLegacy, buildIncomingArticleMdx(article), 'utf8');
    } catch (e) {
      console.warn(`[geoflow-import] 写入 legacy 目录失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const result: ReceiveResult = {
    ok: true,
    remoteId: `geoflow-${article.slug}`,
    remoteUrl: getArticleRelativeUrl(article.locale, article.slug),
    status: 'imported',
  };

  const newLogEntry: ImportLogEntry = {
    ...result,
    idempotencyKey: input.idempotencyKey,
    geoflowArticleId: article.geoflow.articleId,
    locale: article.locale,
    slug: article.slug,
    incomingPath: path.relative(contentRoot, targetPathAstro).replace(/\\/g, '/'),
    importedAt: (input.now || new Date()).toISOString(),
    targetQueries: article.geo.targetQueries,
    reviewStatus: article.geoflow.reviewStatus,
  };

  // 写入 Astro 日志
  let updatedLog: ImportLogEntry[];
  if (duplicate) {
    updatedLog = log.map((entry) => entry.idempotencyKey === input.idempotencyKey ? newLogEntry : entry);
  } else {
    updatedLog = [...log, newLogEntry];
  }
  writeImportLog(contentRoot, updatedLog);

  // 如果有 legacy 目录，同步写入 legacy 日志
  if (legacyContentRoot && fs.existsSync(legacyContentRoot)) {
    try {
      const legacyLog = readImportLog(legacyContentRoot);
      const duplicateLegacy = legacyLog.find((entry) => entry.idempotencyKey === input.idempotencyKey);
      
      const newLegacyEntry: ImportLogEntry = {
        ...result,
        idempotencyKey: input.idempotencyKey,
        geoflowArticleId: article.geoflow.articleId,
        locale: article.locale,
        slug: article.slug,
        incomingPath: targetPathLegacy 
          ? path.relative(legacyContentRoot, targetPathLegacy).replace(/\\/g, '/')
          : `articles/${article.locale}/${fileName}`,
        importedAt: (input.now || new Date()).toISOString(),
        targetQueries: article.geo.targetQueries,
        reviewStatus: article.geoflow.reviewStatus,
      };

      let updatedLegacyLog: ImportLogEntry[];
      if (duplicateLegacy) {
        updatedLegacyLog = legacyLog.map((entry) => entry.idempotencyKey === input.idempotencyKey ? newLegacyEntry : entry);
      } else {
        updatedLegacyLog = [...legacyLog, newLegacyEntry];
      }
      writeImportLog(legacyContentRoot, updatedLegacyLog);
    } catch (e) {
      console.warn(`[geoflow-import] 同步 legacy 日志失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return result;
}

export class FileReplayStore implements ReplayStore {
  private contentRoot: string;

  constructor(contentRoot?: string) {
    this.contentRoot = contentRoot || resolveContentRoots().astroContentRoot;
  }

  async has(key: string) {
    const entries = this.readEntries();
    const now = Date.now();
    return entries.some((entry) => entry.key === key && new Date(entry.expiresAt).getTime() > now);
  }

  async set(key: string, expiresAt = new Date(Date.now() + 10 * 60 * 1000)) {
    const entries = this.readEntries().filter((entry) => new Date(entry.expiresAt).getTime() > Date.now());
    entries.push({ key, expiresAt: expiresAt.toISOString() });
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(entries, null, 2), 'utf8');
  }

  private get filePath() {
    return path.join(this.contentRoot, 'articles', '_incoming', '.geoflow-nonces.json');
  }

  private readEntries(): Array<{ key: string; expiresAt: string }> {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

export function getGeoflowImportLog(contentRoot?: string) {
  const root = contentRoot || resolveContentRoots().astroContentRoot;
  return readImportLog(root);
}

function readImportLog(contentRoot: string): ImportLogEntry[] {
  const logPath = getImportLogPath(contentRoot);
  if (!fs.existsSync(logPath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeImportLog(contentRoot: string, entries: ImportLogEntry[]) {
  const logPath = getImportLogPath(contentRoot);
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(entries, null, 2), 'utf8');
}

function getImportLogPath(contentRoot: string) {
  return path.join(contentRoot, 'articles', '_incoming', 'geoflow-import-log.json');
}

export async function deleteGeoflowArticle(slug: string, geoflowArticleId?: string): Promise<{ ok: boolean }> {
  const { astroContentRoot, legacyContentRoot } = resolveContentRoots();
  const locales = ['en', 'es', 'pt'];
  
  // 优先从 Astro 日志中检索真实的映射 Slug
  let targetSlug = slug;
  if (astroContentRoot) {
    const log = readImportLog(astroContentRoot);
    const entry = log.find(
      (e) =>
        (geoflowArticleId && String(e.geoflowArticleId) === String(geoflowArticleId)) ||
        e.slug === slug
    );
    if (entry) {
      targetSlug = entry.slug;
      console.log(`[geoflow-delete] 日志映射成功: ${slug} (ID: ${geoflowArticleId}) -> 真实Slug: ${targetSlug}`);
    }
  }

  // 1. 删除 Astro 本地文件
  if (astroContentRoot) {
    for (const locale of locales) {
      const filePath = path.join(astroContentRoot, 'articles', locale, `${targetSlug}.mdx`);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`[geoflow-delete] 已删除 Astro 文件: ${filePath}`);
        } catch (e) {
          console.warn(`[geoflow-delete] 删除 Astro 本地文件失败: ${filePath}`, e);
        }
      }
    }
  }

  // 2. 删除 Legacy Next 文件
  if (legacyContentRoot) {
    for (const locale of locales) {
      const filePath = path.join(legacyContentRoot, 'articles', locale, `${targetSlug}.mdx`);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`[geoflow-delete] 已删除 Legacy 文件: ${filePath}`);
        } catch (e) {
          console.warn(`[geoflow-delete] 删除 Legacy 文件失败: ${filePath}`, e);
        }
      }
    }
  }

  // 3. 更新日志（从日志中移除该文章）
  const updateLog = (root: string) => {
    const log = readImportLog(root);
    const newLog = log.filter((entry) => entry.slug !== targetSlug);
    writeImportLog(root, newLog);
  };

  if (astroContentRoot) {
    try {
      updateLog(astroContentRoot);
    } catch (e) {}
  }
  if (legacyContentRoot && fs.existsSync(legacyContentRoot)) {
    try {
      updateLog(legacyContentRoot);
    } catch (e) {}
  }

  return { ok: true };
}

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
  const getCwd = () => process.env.SITE_ROOT || process.cwd();
  const cwd = getCwd();
  let astroContentRoot = '';
  let legacyContentRoot = '';

  const pathAstro = [cwd, 'src', 'data', 'legacy-content', 'content'].join(path.sep);
  const pathMonorepoAstro = [cwd, 'astro-site', 'src', 'data', 'legacy-content', 'content'].join(path.sep);

  if (fs.existsSync(pathAstro)) {
    astroContentRoot = pathAstro;
    legacyContentRoot = path.resolve(cwd, '..', 'yanghua-b2b-website', 'content');
  } else if (fs.existsSync(pathMonorepoAstro)) {
    astroContentRoot = pathMonorepoAstro;
    legacyContentRoot = [cwd, 'yanghua-b2b-website', 'content'].join(path.sep);
  } else {
    astroContentRoot = pathAstro;
    legacyContentRoot = '';
  }

  return { astroContentRoot, legacyContentRoot };
}

// 健壮的 public 目录解析逻辑
function resolvePublicRoots() {
  const getCwd = () => process.env.SITE_ROOT || process.cwd();
  const cwd = getCwd();
  let astroPublicRoot = '';
  let legacyPublicRoot = '';

  const pathPublic = [cwd, 'public'].join(path.sep);
  const pathMonorepoPublic = [cwd, 'astro-site', 'public'].join(path.sep);

  if (fs.existsSync(pathPublic)) {
    astroPublicRoot = pathPublic;
    legacyPublicRoot = path.resolve(cwd, '..', 'yanghua-b2b-website', 'public');
  } else if (fs.existsSync(pathMonorepoPublic)) {
    astroPublicRoot = pathMonorepoPublic;
    legacyPublicRoot = [cwd, 'yanghua-b2b-website', 'public'].join(path.sep);
  } else {
    astroPublicRoot = pathPublic;
  }

  return { astroPublicRoot, legacyPublicRoot };
}

// 保存从 Webhook 传输过来的 base64 图片资源
function saveImageAssets(payload: any) {
  const assets = payload?.assets;
  if (!assets || !Array.isArray(assets.images)) {
    return;
  }

  const { astroPublicRoot, legacyPublicRoot } = resolvePublicRoots();

  for (const image of assets.images) {
    const { source_url, content_base64 } = image;
    if (!source_url || !content_base64) {
      continue;
    }

    let relativeUrlPath = source_url;
    if (source_url.startsWith('http://') || source_url.startsWith('https://')) {
      try {
        const parsed = new URL(source_url);
        relativeUrlPath = parsed.pathname;
      } catch {
        continue;
      }
    }

    const cleanRelativePath = relativeUrlPath.replace(/^\//, '');

    // 仅保存 storage/ 或 uploads/ 目录下的静态图片
    if (!cleanRelativePath.startsWith('storage/') && !cleanRelativePath.startsWith('uploads/')) {
      continue;
    }

    const buffer = Buffer.from(content_base64, 'base64');

    // 双重写入：Astro 站点
    if (astroPublicRoot) {
      const targetPathAstro = path.join(astroPublicRoot, cleanRelativePath);
      try {
        fs.mkdirSync(path.dirname(targetPathAstro), { recursive: true });
        fs.writeFileSync(targetPathAstro, buffer);
        console.log(`[geoflow-import] 已写入 Astro 图片: ${targetPathAstro}`);
      } catch (e) {
        console.warn(`[geoflow-import] 写入 Astro 图片失败: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 双重写入：Legacy Next 站点
    if (legacyPublicRoot && fs.existsSync(path.dirname(legacyPublicRoot))) {
      const targetPathLegacy = path.join(legacyPublicRoot, cleanRelativePath);
      try {
        fs.mkdirSync(path.dirname(targetPathLegacy), { recursive: true });
        fs.writeFileSync(targetPathLegacy, buffer);
        console.log(`[geoflow-import] 已写入 Legacy 图片: ${targetPathLegacy}`);
      } catch (e) {
        console.warn(`[geoflow-import] 写入 Legacy 图片失败: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
}


export async function receiveGeoflowArticle(input: ReceiveInput): Promise<ReceiveResult> {
  if (!input.idempotencyKey) {
    throw new Error('idempotencyKey is required');
  }

  // 保存该文章关联的所有图片素材到 public/storage/ 目录
  try {
    saveImageAssets(input.payload);
  } catch (e) {
    console.warn(`[geoflow-import] 提取并保存图片资源失败: ${e instanceof Error ? e.message : String(e)}`);
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

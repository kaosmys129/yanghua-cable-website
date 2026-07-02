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
  reviewStatus: 'needs_review' | 'needs_geo_metadata';
};

export async function receiveGeoflowArticle(input: ReceiveInput): Promise<ReceiveResult> {
  if (!input.idempotencyKey) {
    throw new Error('idempotencyKey is required');
  }

  const contentRoot = input.contentRoot || path.join(process.cwd(), 'content');
  const log = readImportLog(contentRoot);
  const duplicate = log.find((entry) => entry.idempotencyKey === input.idempotencyKey);
  if (duplicate) {
    return {
      ok: true,
      remoteId: duplicate.remoteId,
      remoteUrl: duplicate.remoteUrl,
      status: 'duplicate',
    };
  }

  const article = normalizeGeoflowArticlePayload(input.payload);
  const incomingDir = path.join(contentRoot, 'articles', '_incoming', article.locale);
  fs.mkdirSync(incomingDir, { recursive: true });

  const fileName = `geoflow-${article.slug}.mdx`;
  const incomingPath = path.join(incomingDir, fileName);
  fs.writeFileSync(incomingPath, buildIncomingArticleMdx(article), 'utf8');

  const result: ReceiveResult = {
    ok: true,
    remoteId: `geoflow-${article.slug}`,
    remoteUrl: getArticleRelativeUrl(article.locale, article.slug),
    status: 'imported',
  };

  writeImportLog(contentRoot, [
    ...log,
    {
      ...result,
      idempotencyKey: input.idempotencyKey,
      geoflowArticleId: article.geoflow.articleId,
      locale: article.locale,
      slug: article.slug,
      incomingPath: path.relative(contentRoot, incomingPath).replace(/\\/g, '/'),
      importedAt: (input.now || new Date()).toISOString(),
      targetQueries: article.geo.targetQueries,
      reviewStatus: article.geoflow.reviewStatus,
    },
  ]);

  return result;
}

export class FileReplayStore implements ReplayStore {
  constructor(private contentRoot = path.join(process.cwd(), 'content')) {}

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

export function getGeoflowImportLog(contentRoot = path.join(process.cwd(), 'content')) {
  return readImportLog(contentRoot);
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

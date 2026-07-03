import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const REQUIRED_FIELDS = ['slug', 'title', 'locale', 'publishedAt'];
const PUBLICATION_STATUSES = new Set(['approved', 'published']);

function relativePath(filePath, cwd = process.cwd()) {
  return path.relative(cwd, filePath) || filePath;
}

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function getStatus(data) {
  return String(data.geoflow?.status || data.geoflow?.reviewStatus || 'needs_review');
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values.filter(Boolean)) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function collectAiImageValues(aiImages) {
  if (!aiImages || typeof aiImages !== 'object') return [];
  return Object.values(aiImages).flatMap((value) => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.filter((item) => typeof item === 'string');
    if (value && typeof value === 'object') {
      return Object.values(value).filter((item) => typeof item === 'string');
    }
    return [];
  });
}

export function validatePromotionCandidate({ raw, data, sourcePath }) {
  const errors = [];
  const warnings = [];
  const source = relativePath(sourcePath);

  if (!raw.trimStart().startsWith('---')) {
    errors.push({ source, message: 'missing frontmatter block' });
  }

  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) {
      errors.push({ source, message: `missing required field: ${field}` });
    }
  }

  if (!['en', 'es'].includes(data.locale)) {
    errors.push({ source, message: 'locale must be en or es' });
  }

  if (!data.seo?.title) {
    errors.push({ source, message: 'missing seo.title' });
  }

  if (!data.seo?.description) {
    errors.push({ source, message: 'missing seo.description' });
  }

  if (!data.geo?.answerSummary) {
    errors.push({ source, message: 'missing geo.answerSummary' });
  }

  if (asArray(data.geo?.targetQueries).length === 0) {
    errors.push({ source, message: 'missing geo.targetQueries' });
  }

  const repeatedAiImages = duplicateValues(collectAiImageValues(data.aiImages));
  if (repeatedAiImages.length > 0) {
    errors.push({ source, message: `duplicate aiImages values: ${repeatedAiImages.join(', ')}` });
  }

  if (!data.geoflow) {
    warnings.push({ source, message: 'missing geoflow metadata; treating as needs_review' });
  }

  if (data.geoflow && !data.geoflow.sourceBatchId) {
    warnings.push({ source, message: 'missing geoflow.sourceBatchId' });
  }

  return { errors, warnings };
}

function applyPublishedState(data, options) {
  const geoflow = {
    ...(data.geoflow || {}),
    status: 'published',
    reviewedAt: data.geoflow?.reviewedAt || options.now(),
    reviewedBy: data.geoflow?.reviewedBy || options.reviewedBy,
  };

  if (options.sourceBatchId && !geoflow.sourceBatchId) {
    geoflow.sourceBatchId = options.sourceBatchId;
  }

  delete geoflow.reviewStatus;

  return {
    ...data,
    geoflow,
  };
}

function parseOptions(options = {}) {
  return {
    contentRoot: options.contentRoot || path.join(process.cwd(), 'content'),
    dryRun: options.dryRun === true,
    overwrite: options.overwrite === true,
    reviewedBy: options.reviewedBy || process.env.GEOFLOW_REVIEWED_BY || 'manual-review',
    sourceBatchId: options.sourceBatchId || process.env.GEOFLOW_SOURCE_BATCH_ID || '',
    now: options.now || (() => new Date().toISOString()),
  };
}

export async function promoteGeoflowArticles(options = {}) {
  const parsedOptions = parseOptions(options);
  const incomingRoot = path.join(parsedOptions.contentRoot, 'articles', '_incoming');
  const result = {
    promoted: [],
    skipped: [],
    blockingErrors: [],
    warnings: [],
  };

  for (const locale of ['en', 'es']) {
    const localeIncomingRoot = path.join(incomingRoot, locale);
    if (!fs.existsSync(localeIncomingRoot)) {
      continue;
    }

    for (const entry of fs.readdirSync(localeIncomingRoot).sort()) {
      if (!entry.endsWith('.mdx')) {
        continue;
      }

      const sourcePath = path.join(localeIncomingRoot, entry);
      const raw = fs.readFileSync(sourcePath, 'utf8');
      const parsed = matter(raw);
      const source = relativePath(sourcePath);
      const status = getStatus(parsed.data);

      if (status === 'needs_geo_metadata') {
        result.skipped.push({ source, reason: 'needs_geo_metadata' });
        continue;
      }

      if (!PUBLICATION_STATUSES.has(status)) {
        result.skipped.push({ source, reason: `not_approved:${status}` });
        continue;
      }

      const validation = validatePromotionCandidate({ raw, data: parsed.data, sourcePath });
      result.warnings.push(...validation.warnings);
      if (validation.errors.length > 0) {
        result.blockingErrors.push(...validation.errors);
        continue;
      }

      const slug = String(parsed.data.slug || path.basename(entry, '.mdx').replace(/^geoflow-/, ''));
      const targetLocale = parsed.data.locale === 'es' ? 'es' : 'en';
      const targetDir = path.join(parsedOptions.contentRoot, 'articles', targetLocale);
      const targetPath = path.join(targetDir, `${slug}.mdx`);
      const target = relativePath(targetPath);

      if (fs.existsSync(targetPath) && !parsedOptions.overwrite) {
        result.skipped.push({ source, target, reason: 'target_exists' });
        continue;
      }

      result.promoted.push({ source, target, dryRun: parsedOptions.dryRun });

      if (parsedOptions.dryRun) {
        continue;
      }

      const nextData = applyPublishedState(parsed.data, parsedOptions);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(targetPath, matter.stringify(parsed.content, nextData));
      fs.rmSync(sourcePath);
    }
  }

  return result;
}

function parseCliArgs(argv) {
  const options = {
    dryRun: false,
    overwrite: false,
    reviewedBy: undefined,
    sourceBatchId: undefined,
  };

  for (const arg of argv) {
    if (arg === '--dry-run') options.dryRun = true;
    if (arg === '--overwrite') options.overwrite = true;
    if (arg.startsWith('--reviewed-by=')) options.reviewedBy = arg.slice('--reviewed-by='.length);
    if (arg.startsWith('--source-batch-id=')) options.sourceBatchId = arg.slice('--source-batch-id='.length);
  }

  return options;
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isCli) {
  const result = await promoteGeoflowArticles(parseCliArgs(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));
  if (result.blockingErrors.length > 0) {
    process.exitCode = 1;
  }
}

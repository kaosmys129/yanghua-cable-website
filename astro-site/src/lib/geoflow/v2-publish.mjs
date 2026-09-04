import crypto from 'node:crypto';

const LOCALES = new Set(['en', 'es', 'pt']);
const APPROVED_GRADES = new Set(['A', 'B']);

export function normalizeV2Payload(payload) {
  const source = isRecord(payload?.article) ? { ...payload, ...payload.article } : payload;
  if (!isRecord(source)) throw new Error('payload must be an object');

  const governance = isRecord(source.contentGovernance) ? source.contentGovernance : {};
  const geo = isRecord(source.geo) ? source.geo : {};
  const seo = isRecord(source.seo) ? source.seo : {};
  const revision = isRecord(source.contentRevision) ? source.contentRevision : {};
  const ownership = isRecord(source.contentOwnership) ? source.contentOwnership : {};
  const authorManifest = isRecord(source.authorManifest) ? source.authorManifest : {};
  const evidenceManifest = isRecord(source.evidenceManifest) ? source.evidenceManifest : {};
  const reviewStatus = source.reviewStatus || governance.reviewStatus || revision.reviewStatus;
  const evidenceRefs = Array.isArray(source.evidenceRefs)
    ? source.evidenceRefs
    : Array.isArray(evidenceManifest.items) ? evidenceManifest.items : [];

  return {
    ...source,
    geoflowArticleId: String(source.geoflowArticleId ?? source.id ?? ''),
    translationKey: String(source.translationKey ?? ''),
    locale: source.locale,
    bodyMarkdown: source.bodyMarkdown ?? source.body ?? '',
    description: source.description ?? seo.description ?? '',
    seoTitle: source.seoTitle ?? seo.title,
    seoDescription: source.seoDescription ?? seo.description,
    keywords: source.keywords ?? seo.keywords,
    targetQueries: source.targetQueries ?? geo.targetQueries,
    answerSummary: source.answerSummary ?? geo.answerSummary,
    faqs: source.faqs ?? geo.faqs,
    citations: source.citations ?? geo.citations,
    sourceMaterials: source.sourceMaterials ?? geo.sourceMaterials,
    buyerIntent: source.buyerIntent ?? geo.buyerIntent,
    relatedProductIds: source.relatedProductIds ?? geo.relatedProductIds,
    relatedSolutionIds: source.relatedSolutionIds ?? geo.relatedSolutionIds,
    reviewStatus: reviewStatus || 'needs_review',
    contentOwnership: source.contentOwnership ?? {
      ...ownership,
      system: ownership.system ?? 'geoflow',
      durableSource: ownership.durableSource ?? 'astro-mdx',
      runtimeWrites: ownership.runtimeWrites ?? 'disallowed',
    },
    contentRevision: source.contentRevision ?? {
      ...revision,
      reviewStatus: reviewStatus || 'needs_review',
    },
    authorManifest: source.authorManifest ?? authorManifest,
    evidenceManifest: source.evidenceManifest ?? {
      ...evidenceManifest,
      items: evidenceRefs,
    },
  };
}

export function validateV2Payload(payload) {
  const source = normalizeV2Payload(payload);
  const errors = [];
  if (!LOCALES.has(source.locale)) errors.push('locale must be en, es, or pt');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(source.slug || ''))) errors.push('slug is invalid');
  if (!source.translationKey) errors.push('translationKey is required');
  if (!source.geoflowArticleId) errors.push('geoflowArticleId is required');
  if (!source.updatedAt || Number.isNaN(Date.parse(source.updatedAt))) errors.push('updatedAt must be an ISO date');
  if (!source.bodyMarkdown || !String(source.bodyMarkdown).trim()) errors.push('body is required');
  if (!source.title || !source.description) errors.push('title and description are required');
  if (!['approved', 'needs_review', 'needs_geo_metadata'].includes(source.reviewStatus)) errors.push('reviewStatus is invalid');
  if (source.contentOwnership?.system !== 'geoflow') errors.push('contentOwnership.system must be geoflow');
  if (source.contentOwnership?.runtimeWrites !== 'disallowed') errors.push('runtimeWrites must be disallowed');
  if (!source.authorId && !source.authorManifest?.authorId) errors.push('authorId is required');
  if (!source.authorManifest?.displayName) errors.push('authorManifest.displayName is required');
  if (!Array.isArray(source.evidenceRefs) && !Array.isArray(source.evidenceManifest?.items)) errors.push('evidenceRefs are required');
  const evidence = Array.isArray(source.evidenceRefs) ? source.evidenceRefs : source.evidenceManifest?.items || [];
  if (evidence.length === 0) errors.push('at least one evidence reference is required');
  if (source.reviewStatus !== 'approved') errors.push('content is not approved for production');
  const grade = source.evidenceManifest?.summaryGrade;
  if (grade && !APPROVED_GRADES.has(grade)) errors.push('evidence grade is not acceptable for production');
  if (evidence.some((item) => item?.approvalStatus === 'approval_needed' || item?.visibility === 'private')) {
    errors.push('public evidence contains unapproved or private items');
  }
  if (Array.isArray(source.images)) {
    for (const image of source.images) {
      if (!isRecord(image) || !safeAssetPath(image.path || image.source_url)) errors.push('image path is invalid');
    }
  }
  return { ok: errors.length === 0, errors, source };
}

export function deriveRevisionId(source, idempotencyKey) {
  if (source.revisionId) return String(source.revisionId);
  const digest = crypto.createHash('sha256').update(JSON.stringify({
    id: source.geoflowArticleId,
    locale: source.locale,
    slug: source.slug,
    title: source.title,
    updatedAt: source.updatedAt,
    idempotencyKey,
  })).digest('hex').slice(0, 16);
  return `geo-${source.geoflowArticleId}-${digest}`;
}

export function prepareV2Publication(payload, idempotencyKey) {
  const validation = validateV2Payload(payload);
  if (!validation.ok) return validation;
  const source = validation.source;
  const revisionId = deriveRevisionId(source, idempotencyKey);
  const article = buildVersionedArticle(source, revisionId);
  const articlePath = `astro-site/src/data/legacy-content/content/articles/${source.locale}/${source.slug}.mdx`;
  const files = [{ path: articlePath, content: buildArticleMdx(article) }];
  for (const image of source.images || []) {
    const path = normalizeAssetPath(image.path || image.source_url);
    if (path && image.content_base64) files.push({ path: `astro-site/public/${path}`, content: Buffer.from(image.content_base64, 'base64') });
  }
  return {
    ok: true,
    source,
    article,
    revisionId,
    branch: `geoflow/article-${safeBranchPart(source.geoflowArticleId)}-${safeBranchPart(revisionId)}`.slice(0, 240),
    files,
  };
}

export function createGitHubAppPublisher(config = {}, fetchImpl = globalThis.fetch) {
  const env = typeof process !== 'undefined' ? process.env : {};
  const repository = config.repository || env.GITHUB_REPOSITORY || '';
  const [owner, repo] = repository.split('/');
  const settings = {
    apiUrl: config.apiUrl || env.GITHUB_API_URL || 'https://api.github.com',
    appId: config.appId || env.GITHUB_APP_ID,
    privateKey: config.privateKey || env.GITHUB_PRIVATE_KEY,
    installationId: config.installationId || env.GITHUB_INSTALLATION_ID,
    owner,
    repo,
    baseBranch: config.baseBranch || env.GITHUB_BASE_BRANCH || 'main',
  };
  return {
    async findExistingRevision({ branch }) {
      const token = await getInstallationToken(settings, fetchImpl);
      const response = await githubFetch(settings, fetchImpl, `/repos/${settings.owner}/${settings.repo}/pulls?state=open&head=${encodeURIComponent(`${settings.owner}:${branch}`)}`, token);
      const pulls = await response.json();
      return Array.isArray(pulls) && pulls[0] ? { prUrl: pulls[0].html_url, branch } : null;
    },
    async publish({ branch, files, title, body }) {
      const token = await getInstallationToken(settings, fetchImpl);
      const base = await githubFetch(settings, fetchImpl, `/repos/${settings.owner}/${settings.repo}/git/ref/heads/${settings.baseBranch}`, token);
      const baseJson = await base.json();
      const refResponse = await githubRequest(settings, fetchImpl, `/repos/${settings.owner}/${settings.repo}/git/refs`, token, 'POST', { ref: `refs/heads/${branch}`, sha: baseJson.object.sha });
      if (!refResponse.ok && refResponse.status !== 422) throw new Error(`github_branch_failed_${refResponse.status}`);
      const changedPaths = [];
      for (const file of files) {
        const encodedPath = file.path.split('/').map(encodeURIComponent).join('/');
        const content = Buffer.isBuffer(file.content) ? file.content.toString('base64') : Buffer.from(String(file.content), 'utf8').toString('base64');
        const response = await githubRequest(settings, fetchImpl, `/repos/${settings.owner}/${settings.repo}/contents/${encodedPath}`, token, 'PUT', { message: title, content, branch });
        if (!response.ok) throw new Error(`github_content_failed_${response.status}`);
        changedPaths.push(file.path);
      }
      const prResponse = await githubRequest(settings, fetchImpl, `/repos/${settings.owner}/${settings.repo}/pulls`, token, 'POST', { title, head: branch, base: settings.baseBranch, body });
      if (!prResponse.ok) throw new Error(`github_pr_failed_${prResponse.status}`);
      const pr = await prResponse.json();
      return { branch, prUrl: pr.html_url, changedPaths };
    },
  };
}

async function getInstallationToken(settings, fetchImpl) {
  if (!settings.appId || !settings.privateKey || !settings.installationId || !settings.owner || !settings.repo) throw new Error('github_not_configured');
  const jwt = createAppJwt(settings.appId, settings.privateKey);
  const response = await githubRequest(settings, fetchImpl, `/app/installations/${settings.installationId}/access_tokens`, jwt, 'POST');
  if (!response.ok) throw new Error(`github_token_failed_${response.status}`);
  const data = await response.json();
  if (!data.token) throw new Error('github_token_missing');
  return data.token;
}

async function githubFetch(settings, fetchImpl, route, token) {
  return githubRequest(settings, fetchImpl, route, token, 'GET');
}

async function githubRequest(settings, fetchImpl, route, token, method, body) {
  const response = await fetchImpl(`${settings.apiUrl}${route}`, {
    method,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return response;
}

function createAppJwt(appId, privateKey) {
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: String(appId) }));
  const input = `${header}.${payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(input);
  return `${input}.${base64Url(signer.sign(privateKey))}`;
}

function safeAssetPath(value) {
  return Boolean(normalizeAssetPath(value));
}
function normalizeAssetPath(value) {
  if (!value) return '';
  let clean = String(value);
  try { clean = new URL(clean).pathname; } catch { /* relative path */ }
  clean = clean.replace(/^\/+/, '');
  return /^(storage|uploads)\/[a-zA-Z0-9._/-]+$/.test(clean) && !clean.includes('..') ? clean : '';
}
function safeBranchPart(value) { return String(value).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'article'; }
function base64Url(value) { return Buffer.from(value).toString('base64url'); }
function isRecord(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }

function buildVersionedArticle(source, revisionId) {
  return {
    ...source,
    translationKey: source.translationKey,
    contentRevision: { ...(source.contentRevision || {}), publicVersion: revisionId },
    geo: { targetQueries: source.targetQueries || [], answerSummary: source.answerSummary || '', faqs: source.faqs || [], citations: source.citations || [], sourceMaterials: source.sourceMaterials || [], buyerIntent: source.buyerIntent || 'awareness', relatedProductIds: source.relatedProductIds || [], relatedSolutionIds: source.relatedSolutionIds || [] },
    seo: { title: source.seoTitle, description: source.seoDescription, keywords: source.keywords || [], canonicalHint: source.canonicalHint },
  };
}

function buildArticleMdx(article) {
  const frontmatter = {
    sourceId: article.geoflowArticleId,
    translationKey: article.translationKey,
    locale: article.locale,
    slug: article.slug,
    title: article.title,
    description: article.description,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    category: article.category,
    author: article.author,
    geoflow: { articleId: article.geoflowArticleId, reviewStatus: article.reviewStatus, revisionId: article.contentRevision.publicVersion },
    geo: article.geo,
    seo: article.seo,
    contentOwnership: article.contentOwnership,
    contentRevision: article.contentRevision,
    authorManifest: article.authorManifest,
    evidenceManifest: article.evidenceManifest,
  };
  return `---\n${JSON.stringify(frontmatter, null, 2)}\n---\n\n${String(article.bodyMarkdown).trim()}\n`;
}

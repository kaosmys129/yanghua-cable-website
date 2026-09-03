import {
  APPROVAL_APPROVED,
  APPROVAL_NEEDED,
  normalizeApprovalStatus,
  normalizeEvidenceGrade,
} from './company-facts.mjs';

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function firstText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function normalizePublicClaim(rawClaim) {
  const claim = asObject(rawClaim);
  return {
    id: firstText(claim.id),
    claim: firstText(claim.claim, claim.text),
    evidenceGrade: normalizeEvidenceGrade(claim.evidenceGrade),
    approvalStatus: normalizeApprovalStatus(claim.approvalStatus),
    note: firstText(claim.note),
  };
}

function deriveEvidenceGrade(items, fallback = 'E') {
  if (!items.length) return fallback;
  return items
    .map((item) => normalizeEvidenceGrade(item.evidenceGrade))
    .sort((left, right) => ['A', 'B', 'C', 'D', 'E'].indexOf(left) - ['A', 'B', 'C', 'D', 'E'].indexOf(right))[0];
}

export function normalizeContentOwnership(frontmatter = {}, path = '') {
  const explicit = asObject(frontmatter.contentOwnership);
  const geoflow = asObject(frontmatter.geoflow);
  const system = firstText(explicit.system, Object.keys(geoflow).length ? 'geoflow' : 'astro');

  return {
    system,
    durableSource: firstText(explicit.durableSource, 'astro-mdx'),
    canonicalPath: firstText(explicit.canonicalPath, path),
    runtimeWrites: firstText(explicit.runtimeWrites, 'disallowed'),
    sourceMode: firstText(explicit.sourceMode, system === 'geoflow' ? 'imported' : 'legacy'),
  };
}

export function normalizeContentRevision(frontmatter = {}, ownership) {
  const explicit = asObject(frontmatter.contentRevision);
  const geoflow = asObject(frontmatter.geoflow);

  return {
    reviewStatus: firstText(explicit.reviewStatus, geoflow.status, geoflow.reviewStatus, ownership.system === 'geoflow' ? 'needs_review' : 'legacy'),
    lastReviewedAt: firstText(explicit.lastReviewedAt, geoflow.reviewedAt, frontmatter.updatedAt, frontmatter.publishedAt),
    lastReviewedBy: firstText(explicit.lastReviewedBy, geoflow.reviewedBy),
    revisionSource: firstText(explicit.revisionSource, ownership.system === 'geoflow' ? 'geoflow' : 'astro'),
    publicVersion: firstText(explicit.publicVersion, ownership.system === 'geoflow' ? 'managed-import' : 'legacy-default'),
  };
}

export function normalizeAuthorManifest(frontmatter = {}, ownership) {
  const explicit = asObject(frontmatter.authorManifest);
  const author = asObject(frontmatter.author);

  return {
    kind: firstText(explicit.kind, author.name ? 'team' : 'organization'),
    displayName: firstText(explicit.displayName, author.name, 'Yanghua Editorial Team'),
    role: firstText(explicit.role, ownership.system === 'geoflow' ? 'editor' : 'legacy-editorial'),
    bio: firstText(explicit.bio, frontmatter.authorBio),
    approvalStatus: firstText(explicit.approvalStatus, 'legacy_default'),
  };
}

export function normalizeEvidenceManifest(frontmatter = {}) {
  const explicit = asObject(frontmatter.evidenceManifest);
  const geo = asObject(frontmatter.geo);
  const rawItems = asArray(explicit.items).length > 0
    ? asArray(explicit.items)
    : asArray(geo.citations).map((citation) => ({
        ...asObject(citation),
        evidenceGrade: citation?.evidenceGrade ?? explicit.summaryGrade ?? 'C',
      }));
  const items = rawItems.map((item) => {
    const normalized = asObject(item);
    const hasExplicitApproval = Object.hasOwn(normalized, 'approvalStatus');
    return {
      label: firstText(normalized.label, normalized.url, 'Source'),
      url: firstText(normalized.url),
      note: firstText(normalized.note),
      evidenceGrade: normalizeEvidenceGrade(normalized.evidenceGrade ?? explicit.summaryGrade ?? 'C'),
      approvalStatus: hasExplicitApproval
        ? normalizeApprovalStatus(normalized.approvalStatus)
        : APPROVAL_APPROVED,
      visibility: firstText(normalized.visibility, 'public'),
    };
  });

  const claims = asArray(explicit.publicClaims).length > 0
    ? asArray(explicit.publicClaims).map(normalizePublicClaim)
    : asArray(frontmatter.publicClaims).map(normalizePublicClaim);
  const approvedPublicClaims = claims.filter((claim) => claim.approvalStatus === APPROVAL_APPROVED && claim.claim);
  const blockedPublicClaims = claims.filter((claim) => claim.approvalStatus !== APPROVAL_APPROVED && claim.claim);
  const publicSources = items.filter((item) => item.visibility !== 'private' && item.approvalStatus === APPROVAL_APPROVED);

  return {
    mode: firstText(explicit.mode, claims.length > 0 || items.length > 0 ? 'manifest' : 'legacy'),
    summaryGrade: normalizeEvidenceGrade(explicit.summaryGrade ?? deriveEvidenceGrade(items, items.length > 0 ? 'C' : 'E')),
    items,
    publicSources,
    publicClaims: claims,
    approvedPublicClaims,
    blockedPublicClaims,
    hasUnapprovedPublicClaims: blockedPublicClaims.length > 0,
    claimApprovalStatus: blockedPublicClaims.length > 0 ? APPROVAL_NEEDED : APPROVAL_APPROVED,
  };
}

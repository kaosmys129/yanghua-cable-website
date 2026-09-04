import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildSeoMetadata, MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from '../src/lib/yanghua/seo-meta.mjs';
import { normalizeContentOwnership, normalizeEvidenceManifest } from '../src/lib/yanghua/article-governance.mjs';

const assignments = JSON.parse(readFileSync(new URL('../src/data/legacy-content/content/seo-page-assignments.json', import.meta.url), 'utf8'));

test('six GEO topic clusters have unique three-locale ownership and evidence state', () => {
  assert.equal(assignments.length, 6);
  assert.equal(new Set(assignments.map((item) => item.translationKey)).size, 6);
  for (const assignment of assignments) {
    assert.deepEqual(Object.keys(assignment.paths).sort(), ['en', 'es', 'pt']);
    assert.ok(assignment.evidenceRefs.length > 0);
    assert.ok(['verified', 'needs_source'].includes(assignment.evidenceStatus));
    assert.equal(assignment.reviewStatus, 'native_review');
  }
});

test('metadata governance keeps title and description bounded without inventing missing copy', () => {
  const metadata = buildSeoMetadata({
    title: `${'Flexible busbar selection guide '.repeat(8)}Yanghua Cable`,
    description: ' ',
    fallbackDescription: 'A verified guide for selecting flexible busbar systems for high-current power distribution projects.',
    protectedPhrases: ['flexible busbar'],
  });
  assert.ok(Array.from(metadata.title).length <= MAX_TITLE_LENGTH);
  assert.ok(Array.from(metadata.description).length <= MAX_DESCRIPTION_LENGTH);
  assert.match(metadata.title.toLocaleLowerCase(), /flexible busbar/);
  assert.ok(!metadata.title.toLocaleLowerCase().includes('yanghua cable — yanghua cable'));
});

test('content governance defaults to durable Astro ownership and hides unapproved evidence', () => {
  const ownership = normalizeContentOwnership({}, 'articles/en/example.mdx');
  assert.equal(ownership.runtimeWrites, 'disallowed');
  assert.equal(ownership.durableSource, 'astro-mdx');
  const evidence = normalizeEvidenceManifest({ evidenceManifest: { summaryGrade: 'C', items: [
    { label: 'Approved source', evidenceGrade: 'B', approvalStatus: 'approved', visibility: 'public' },
    { label: 'Pending source', evidenceGrade: 'A', approvalStatus: 'approval_needed', visibility: 'public' },
  ] } });
  assert.equal(evidence.publicSources.length, 1);
  assert.equal(evidence.hasUnapprovedPublicClaims, false);
});

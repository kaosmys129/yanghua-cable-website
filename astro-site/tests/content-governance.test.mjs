import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const ledger = JSON.parse(readFileSync(new URL('../../exports/seo-content-governance/page-asset-ledger.json', import.meta.url), 'utf8'));
const outputRoot = new URL('../dist/client/', import.meta.url);

function html(pathname) {
  const relative = pathname.replace(/^\//, '').replace(/\/$/, '');
  return readFileSync(new URL(`${relative}/index.html`, outputRoot), 'utf8');
}

test('page asset ledger is unique and carries evidence-first governance fields', () => {
  assert.equal(ledger.policy.strategy, 'evidence-first');
  assert.ok(ledger.summary.totalPages >= 200);
  assert.equal(new Set(ledger.pages.map((page) => page.url)).size, ledger.pages.length);
  assert.ok(ledger.pages.every((page) => page.governance.disposition === 'review'));
  assert.ok(ledger.pages.every((page) => Object.hasOwn(page.governance.gsc, 'impressions')));
});

test('English core templates expose commercial pathways and visible breadcrumbs', () => {
  const article = html('/en/articles/flexible-busbar-vs-multiple-parallel-cables');
  const hub = html('/en/articles/hub/energy-storage-busbar');
  const product = html('/en/products/flexible-busbar-2000a');
  const solution = html('/en/solutions/data-center');

  for (const page of [article, hub, product, solution]) {
    assert.match(page, /aria-label="Breadcrumb"/);
    assert.match(page, /Request|quotation|project/i);
  }

  assert.match(article, /Related Technical Reading/);
  assert.match(article, /href="\/en\/solutions\/new-energy"/);
  assert.match(article, /href="\/en\/projects\/1"/);
  assert.match(hub, /href="\/en\/solutions\/new-energy"/);
  assert.match(hub, /href="\/en\/projects\/2"/);
  assert.match(product, /href="\/en\/articles\/hub\/flexible-busbar-vs-cable"/);
  assert.match(solution, /href="\/en\/articles\/hub\/high-current-power-distribution"/);
});

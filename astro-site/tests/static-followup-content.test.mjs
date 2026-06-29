import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

async function html(pathname) {
  return readFile(new URL(`../dist/client${pathname}`, import.meta.url), 'utf8');
}

test('product category pages preserve legacy structure, specifications, and applications', async () => {
  const en = await html('/en/products/category/general-purpose-cables/index.html');
  assert.match(en, /General Purpose Cables/);
  assert.match(en, /Product Structure/);
  assert.match(en, /Copper wire conductors/);
  assert.match(en, /Core Configurations/);
  assert.match(en, /4-core: A,B,C,N equal cross-section/);
  assert.match(en, /200-6300A/);
  assert.match(en, /IP68/);

  const es = await html('/es/productos/categoria/cables-resistentes-al-fuego/index.html');
  assert.match(es, /Cables Resistentes al Fuego/);
  assert.match(es, /Configuraciones/);
  assert.match(es, /200-6300A/);

  const esAlias = await html('/es/productos/categoria/cables-de-proposito-general/index.html');
  assert.match(esAlias, /Cables de Propósito General/);
});

test('product detail pages preserve legacy product content and inquiry/sidebar sections', async () => {
  const en = await html('/en/products/flexible-busbar-2000a/index.html');
  assert.match(en, /2000A Flexible Busbar System/);
  assert.match(en, /Product Overview/);
  assert.match(en, /High Current Capacity: 2000A/);
  assert.match(en, /Technical Specifications/);
  assert.match(en, /1000V AC\/1500V DC/);
  assert.match(en, /Related Products/);
  assert.match(en, /Inquire About This Product/);
});

test('partners page renders benefit cards when legacy source has no benefit copy', async () => {
  const en = await html('/en/partners/index.html');
  assert.match(en, /Strategic Cooperation/);
  assert.match(en, /Proven Industrial Adoption/);
  assert.match(en, /Reliable Project Support/);
});

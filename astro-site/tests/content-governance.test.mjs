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

test('Spanish and Portuguese core templates expose localized breadcrumbs and commercial pathways', () => {
  const pages = [
    html('/es/articulos/perspectivas-de-yanghua-conexiones-de-cables-multicore-en-plantas-quimicas-causando-problemas-vs-soluciones-faciles-con-busbar-flexible-532260'),
    html('/pt/artigos/perspectivas-de-yanghua-conexiones-de-cables-multicore-en-plantas-quimicas-causando-problemas-vs-soluciones-faciles-con-busbar-flexible-532260'),
    html('/es/articulos/hub/custom-busbar-systems'),
    html('/pt/artigos/hub/custom-busbar-systems'),
    html('/es/productos/flexible-busbar-2500a'),
    html('/pt/produtos/flexible-busbar-2500a'),
    html('/es/soluciones/data-center'),
    html('/pt/solucoes/data-center'),
    html('/es/proyectos/4'),
    html('/pt/projetos/4'),
  ];

  for (const page of pages) {
    assert.match(page, /aria-label="(?:Ruta de navegación|Navegação estrutural)"/);
    assert.match(page, /href="\/(?:es\/contacto|pt\/contato)"/);
    assert.match(page, /href="\/(?:es\/productos|pt\/produtos)"/);
  }

  assert.match(html('/es/articulos/hub/custom-busbar-systems'), /Qué confirmar antes de solicitar un diseño/);
  assert.match(html('/pt/artigos/hub/custom-busbar-systems'), /O que confirmar antes de solicitar um projeto/);
});

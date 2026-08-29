import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSeoMetadata,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  normalizeMetaDescription,
  normalizeSeoTitle,
} from '../src/lib/yanghua/seo-meta.mjs';

test('normalizes titles to the Unicode limit and adds the brand once', () => {
  const metadata = buildSeoMetadata({
    title: 'Flexible Busbar Systems for Energy Storage | Yanghua Cable — Yanghua Cable',
    description: 'A short description.',
  });

  assert.equal(metadata.title, 'Flexible Busbar Systems for Energy Storage — Yanghua Cable');
  assert.ok(Array.from(metadata.title).length <= MAX_TITLE_LENGTH);
  assert.equal(metadata.title.match(/Yanghua Cable/gu)?.length, 1);
});

test('removes a leading brand before appending the canonical brand suffix', () => {
  const title = normalizeSeoTitle('Yanghua Cable - Innovator in low-voltage, high-current power distribution');

  assert.equal(title.match(/Yanghua Cable/gu)?.length, 1);
  assert.ok(Array.from(title).length <= MAX_TITLE_LENGTH);
});

test('truncates Unicode titles and descriptions without splitting surrogate pairs', () => {
  const title = normalizeSeoTitle('高电流柔性母线系统用于储能、光伏、电动汽车充电和工业配电项目的完整技术解决方案');
  const description = normalizeMetaDescription('🔌 '.repeat(200));

  assert.ok(Array.from(title).length <= MAX_TITLE_LENGTH);
  assert.ok(Array.from(description).length <= MAX_DESCRIPTION_LENGTH);
  assert.doesNotMatch(title, /[\uD800-\uDFFF]/u);
  assert.doesNotMatch(description, /[\uD800-\uDFFF]/u);
});

test('uses a fallback description when page metadata is empty', () => {
  const metadata = buildSeoMetadata({
    title: 'Produtos',
    description: '',
    fallbackDescription: 'Soluções de barramento flexível para distribuição de energia de alta corrente.',
  });

  assert.equal(metadata.description, 'Soluções de barramento flexível para distribuição de energia de alta corrente.');
});

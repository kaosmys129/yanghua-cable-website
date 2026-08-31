import { expect, test, type Page } from '@playwright/test';

const placeholderSlug =
  'reanudacion-del-trabajo-con-buena-fortuna-todo-es-prometedor-532350';
const summarySlug =
  'perspectivas-de-yanghua-conexiones-de-cables-multicore-en-plantas-quimicas-causando-problemas-vs-soluciones-faciles-con-busbar-flexible-532260';

async function expectImagesLoaded(page: Page, selector: string) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(async () => page.locator(selector).evaluateAll((images) =>
    images.length > 0 && images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)
  )).toBe(true);
}

test('Spanish article listing renders all local cover images', async ({ page }) => {
  await page.goto('/es/articulos');
  const cards = page.locator('a[href^="/es/articulos/"] img');

  await expect(cards).toHaveCount(47);
  await expectImagesLoaded(page, 'a[href^="/es/articulos/"] img');

    const sources = await cards.evaluateAll((images) => images.map((image) => image.getAttribute('src')));
    const nonLocalSources = sources.filter((src) => !src || !new URL(src, page.url()).pathname.startsWith('/storage/uploads/images/articles/es/'));
    expect(nonLocalSources).toEqual([]);
});

test('Spanish article detail stays Spanish and keeps SEO image metadata', async ({ page }) => {
  await page.goto(`/es/articulos/${placeholderSlug}`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('article.geo-article')).toContainText('Actualizacion de noticias de Yanghua');
  await expect(page.locator('article.geo-article')).not.toContainText('English Reference');
  await expect(page.locator('article.geo-article')).not.toContainText('Work Begins Auspiciously');
  await expectImagesLoaded(page, 'section img');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://www.yhflexiblebusbar.com/es/articulos/${placeholderSlug}`);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    new RegExp(`^https://www\\.yhflexiblebusbar\\.com/storage/uploads/images/articles/es/${placeholderSlug}/cover\\.`)
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    'content',
    new RegExp(`^https://www\\.yhflexiblebusbar\\.com/storage/uploads/images/articles/es/${placeholderSlug}/cover\\.`)
  );

  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.join('\n')).toContain(`"image":"https://www.yhflexiblebusbar.com/storage/uploads/images/articles/es/${placeholderSlug}/cover.`);
});

test('Spanish summary article keeps its Spanish summary', async ({ page }) => {
  await page.goto(`/es/articulos/${summarySlug}`);
  await expect(page.locator('article.geo-article')).toContainText('Resumen');
  await expect(page.locator('article.geo-article')).not.toContainText('English Reference');
  await expect(page.locator('article.geo-article')).not.toContainText('How many parallel cable connections');
});

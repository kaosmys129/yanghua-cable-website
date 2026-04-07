import { expect, test } from '@playwright/test';

const ENGLISH_ARTICLE_PATH = '/en/articles/2024-setting-sail-partnering-with-new-energy-for-low-carbon-progress-813260';
const SPANISH_ARTICLE_PATH = '/es/articulos/alcalde-del-condado-de-changshun-de-la-provincia-de-guizhou-visita-yanghuasti-para-inspeccion-613506';

test.describe('文章前台 smoke', () => {
  test('英文文章列表能显示文章', async ({ page }) => {
    await page.goto('/en/articles', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Latest Articles/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('No Articles Found')).toHaveCount(0);

    const articleLinks = page.locator('a[href^="/en/articles/"]');
    await expect(articleLinks.first()).toBeVisible({ timeout: 20000 });
    expect(await articleLinks.count()).toBeGreaterThan(3);
  });

  test('西语文章列表能显示文章', async ({ page }) => {
    await page.goto('/es/articulos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /[ÚU]ltimos art[ií]culos/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/No se encontraron artículos|No Articles Found/i)).toHaveCount(0);

    const articleLinks = page.locator('a[href^="/es/articulos/"]');
    await expect(articleLinks.first()).toBeVisible({ timeout: 20000 });
    expect(await articleLinks.count()).toBeGreaterThan(3);
  });

  test('英文文章详情页可打开', async ({ page }) => {
    await page.goto(ENGLISH_ARTICLE_PATH, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(new RegExp(`${ENGLISH_ARTICLE_PATH}$`));
    await expect(page.getByRole('heading', { name: /2024 Setting Sail/i })).toBeVisible({ timeout: 20000 });
    await expect(page.locator('article').first()).toBeVisible({ timeout: 20000 });
  });

  test('西语文章详情页可打开', async ({ page }) => {
    await page.goto(SPANISH_ARTICLE_PATH, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(new RegExp(`${SPANISH_ARTICLE_PATH}$`));
    await expect(page.getByRole('heading', { name: /Alcalde del Condado de Changshun/i })).toBeVisible({ timeout: 20000 });
    await expect(page.locator('article').first()).toBeVisible({ timeout: 20000 });
  });
});

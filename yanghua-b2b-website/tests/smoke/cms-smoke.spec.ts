import { expect, test } from '@playwright/test';

test.describe('Tina CMS smoke', () => {
  test.setTimeout(120000);

  test('cms 能打开并进入 articles 集合', async ({ page }) => {
    // 先预热 /cms，避免首次进入时被开发态编译和热重载打断。
    await page.request.get('/cms');
    await page.goto('/cms', { waitUntil: 'load', timeout: 60000 });
    await expect(page.getByText(/Please wait while TinaCMS loads your content/i)).toHaveCount(0, { timeout: 60000 });

    const articlesLink = page.getByRole('link', { name: 'Articles' });
    if (!(await articlesLink.isVisible().catch(() => false))) {
      const navButtons = page.getByRole('button', { name: /Open navigation menu|Toggle navigation menu/i });
      const navButtonCount = await navButtons.count();
      for (let i = 0; i < navButtonCount; i += 1) {
        const navButton = navButtons.nth(i);
        if (await navButton.isVisible().catch(() => false)) {
          await navButton.click({ force: true });
          if (await articlesLink.isVisible().catch(() => false)) {
            break;
          }
        }
      }
    }

    await expect(articlesLink).toBeVisible({ timeout: 60000 });
    await articlesLink.click();

    await expect(page).toHaveURL(/collections\/articles/i, { timeout: 60000 });
    await expect(page.getByText(/TinaCMS Render Error|GetCollection failed|Unexpected token/i)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Articles' })).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole('link', { name: /Add File/i })).toBeVisible({ timeout: 60000 });
    const englishFolderRow = page.getByRole('row', { name: /en\s+\/en/i });
    const spanishFolderRow = page.getByRole('row', { name: /es\s+\/es/i });
    await expect(englishFolderRow).toBeVisible({ timeout: 60000 });
    await expect(spanishFolderRow).toBeVisible({ timeout: 60000 });

    await englishFolderRow.locator('a').first().click();
    await expect(
      page.getByText('2024-setting-sail-partnering-with-new-energy-for-low-carbon-progress-813260').first()
    ).toBeVisible({ timeout: 60000 });
    await page
      .getByText('2024-setting-sail-partnering-with-new-energy-for-low-carbon-progress-813260')
      .first()
      .click();
    await expect(page).toHaveURL(/collections\/edit\/articles/i, { timeout: 60000 });
    await expect(
      page.getByRole('link', {
        name: 'en/2024-setting-sail-partnering-with-new-energy-for-low-carbon-progress-813260.mdx',
      })
    ).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible({ timeout: 60000 });
  });
});

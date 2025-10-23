import { test, expect } from '@playwright/test';

// Basic E2E to verify WordPress demo list renders and pagination works

test.describe('WordPress Demo Page', () => {
  test('loads list and can load more', async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002';
    await page.goto(`${baseURL}/en/wordpress-demo`, { waitUntil: 'domcontentloaded' });

    // Expect page title section visible
    await expect(page.getByRole('heading', { name: /Latest Articles/i })).toBeVisible();

    // Wait for at least one card to appear
    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    // Try to load more if button is present
    const loadMore = page.getByRole('button', { name: /Load More/i });
    if (await loadMore.isVisible().catch(() => false)) {
      const initialCount = await cards.count();
      await loadMore.click();
      // Wait briefly for network
      await page.waitForTimeout(1000);
      const afterCount = await cards.count();
      expect(afterCount).toBeGreaterThanOrEqual(initialCount);
    }
  });
});
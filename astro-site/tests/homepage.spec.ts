import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders heading and CTA', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /explore yanghua products/i })).toBeVisible();
  });

  test('has correct page title', async ({ page }) => {
    await page.goto('/en');
    await expect(page).toHaveTitle(/Yanghua Cable/i);
  });

  test('has meta description', async ({ page }) => {
    await page.goto('/en');
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveAttribute('content', /.+/);
  });
});

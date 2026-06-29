import { test, expect } from '@playwright/test';

test.describe('Redirects', () => {
  test('root ends at /en', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test('/products ends at /en/products', async ({ page }) => {
    await page.goto('/products');
    await expect(page).toHaveURL(/\/en\/products\/?$/);
  });

  test('/es/products ends at /es/productos', async ({ page }) => {
    await page.goto('/es/products');
    await expect(page).toHaveURL(/\/es\/productos\/?$/);
  });
});

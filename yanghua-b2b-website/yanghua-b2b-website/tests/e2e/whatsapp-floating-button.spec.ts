import { test, expect } from '@playwright/test';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001';
const locales = ['en', 'es'];

for (const locale of locales) {
  test.describe(`Floating WhatsApp Button [${locale}]`, () => {
    test(`renders and links to wa.me with prefilled text`, async ({ page }) => {
      const url = `${BASE}/${locale}/whatsapp-demo`;
      await page.goto(url, { waitUntil: 'networkidle' });

      const button = page.locator('a[aria-label*="WhatsApp"], a[title*="WhatsApp"]').first();
      await expect(button).toBeVisible();

      const href = await button.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href!).toContain('https://wa.me/');
      expect(href!).toContain('text=');

      const target = await button.getAttribute('target');
      expect(target).toBe('_blank');

      const isFixed = await page.evaluate((el) => getComputedStyle(el as HTMLElement).position === 'fixed', await button.elementHandle());
      expect(isFixed).toBe(true);
    });
  });
}
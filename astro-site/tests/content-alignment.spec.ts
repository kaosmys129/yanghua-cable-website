import { test, expect } from '@playwright/test';

test.describe('Production content alignment', () => {
  test('homepage preserves core production sections', async ({ page }) => {
    await page.goto('/en');

    await expect(page.getByRole('heading', { name: /Yanghua Cable Company Strength/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Why Choose Flexible Copper Busbar/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Our Partners/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Featured Projects/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Get Your Custom Copper Busbar Quote/i })).toBeVisible();
  });

  test('products page preserves categories and technical specifications', async ({ page }) => {
    await page.goto('/en/products');

    await expect(page.getByRole('heading', { name: /Product Overview/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /General Purpose Cables/i })).toBeVisible();
    await expect(page.getByText(/TMRVV/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Technical Specifications/i })).toBeVisible();
    await expect(page.getByText(/200-6300|630A to 6400A/i).first()).toBeVisible();
    await expect(page.getByText(/IP68/i).first()).toBeVisible();
  });

  test('about page preserves media, timeline, certifications, and team content', async ({ page }) => {
    await page.goto('/en/about');

    await expect(page.getByRole('heading', { name: /Leading High Current Busbar Solution Excellence/i })).toBeVisible();
    await expect(page.getByText(/Company Introduction Video/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Our Development Journey/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Quality & Certifications/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Our Leadership Team/i })).toBeVisible();
    await expect(page.getByText(/Dr Du Jingbiao/i)).toBeVisible();
  });
});

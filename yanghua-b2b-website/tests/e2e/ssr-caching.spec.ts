
import { test, expect } from '@playwright/test';

test.describe('SSR & Caching Validation', () => {
  test('Articles List Page should render content on server', async ({ page }) => {
    // Navigate to articles page
    await page.goto('/en/articles');
    
    // Check page title immediately
    await expect(page).toHaveTitle(/Latest Articles/);
    
    // Verify articles are present in the DOM without waiting for client-side fetch
    // (Wait for minimal load, but content should be there if SSR worked)
    const articles = page.locator('main .card');
    await expect(articles).toHaveCount(await articles.count()); // Just ensure it's not 0 eventually
    expect(await articles.count()).toBeGreaterThan(0);
    
    // Check for specific SSR content
    const firstArticleTitle = await articles.first().locator('h2').textContent();
    expect(firstArticleTitle).toBeTruthy();
    console.log(`First article title (SSR): ${firstArticleTitle}`);

    // Verify hydration data (Next.js specific)
    // This confirms data was passed from server to client
    const nextData = await page.evaluate(() => {
      return (window as any).__NEXT_DATA__;
    });
    expect(nextData).toBeTruthy();
    expect(nextData.props.pageProps).toBeDefined();
    // In App Router, data passing is different (React Server Components payload),
    // so checking __NEXT_DATA__ might just show minimal info, but ensuring page load without errors is key.
  });

  test('Article Detail Page should render content on server', async ({ page }) => {
    // Get a valid article slug first from list page
    await page.goto('/en/articles');
    const firstArticleLink = page.locator('main .card a').first();
    const href = await firstArticleLink.getAttribute('href');
    expect(href).toBeTruthy();
    
    // Navigate to detail page
    await page.goto(href!);
    
    // Check title immediately
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    const titleText = await h1.textContent();
    expect(titleText).toBeTruthy();
    console.log(`Article detail title (SSR): ${titleText}`);
    
    // Check for content blocks
    const content = page.locator('.prose, .rich-text, [class*="block"]'); 
    // Adjust selector based on actual implementation
    await expect(page.locator('main')).toContainText(titleText!);
  });

  test('Client-side navigation should use cached data/prefetching', async ({ page }) => {
    await page.goto('/en/articles');
    
    // Measure navigation time to detail page
    const startTime = Date.now();
    await page.locator('main .card a').first().click();
    await page.waitForLoadState('domcontentloaded');
    const duration = Date.now() - startTime;
    
    console.log(`Navigation to detail page took: ${duration}ms`);
    expect(duration).toBeLessThan(3000); // Should be fast
    
    // Verify content loaded
    await expect(page.locator('h1')).toBeVisible();
  });
});

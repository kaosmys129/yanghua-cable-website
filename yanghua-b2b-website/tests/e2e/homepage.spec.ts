import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Yanghua Cable/);
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for hero section
    await expect(page.locator('[data-testid="hero-section"]').or(page.locator('section').first())).toBeVisible();
  });

  test('should have working navigation menu', async ({ page }) => {
    // Check main navigation links
    const navLinks = [
      { text: 'Home', href: '/' },
      { text: 'Products', href: '/products' },
      { text: 'About', href: '/about' },
      { text: 'Contact', href: '/contact' },
    ];

    for (const link of navLinks) {
      const navLink = page.locator(`nav a:has-text("${link.text}")`).or(
        page.locator(`a[href*="${link.href}"]`).first()
      );
      await expect(navLink).toBeVisible();
    }
  });

  test('should have language switcher', async ({ page }) => {
    // Look for language switcher
    const languageSwitcher = page.locator('[data-testid="language-switcher"]').or(
      page.locator('button:has-text("EN")').or(
        page.locator('button:has-text("ES")').or(
          page.locator('select[name*="lang"]')
        )
      )
    );
    
    await expect(languageSwitcher).toBeVisible();
  });

  test('should display company information', async ({ page }) => {
    // Check for company name or logo
    const companyInfo = page.locator('text=Yanghua').or(
      page.locator('[alt*="Yanghua"]').or(
        page.locator('[data-testid="company-logo"]')
      )
    );
    
    await expect(companyInfo.first()).toBeVisible();
  });

  test('should have responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('nav')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Check if mobile menu exists (hamburger menu)
    const mobileMenu = page.locator('[data-testid="mobile-menu"]').or(
      page.locator('button[aria-label*="menu"]').or(
        page.locator('.hamburger')
      )
    );
    
    // Mobile menu should be visible on small screens
    if (await mobileMenu.count() > 0) {
      await expect(mobileMenu.first()).toBeVisible();
    }
  });

  test('should load images properly', async ({ page }) => {
    // Wait for images to load
    await page.waitForLoadState('networkidle');
    
    // Check if images are loaded (not broken)
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check first few images
      for (let i = 0; i < Math.min(imageCount, 3); i++) {
        const img = images.nth(i);
        await expect(img).toBeVisible();
        
        // Check if image has loaded (naturalWidth > 0)
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    }
  });

  test('should have proper SEO meta tags', async ({ page }) => {
    // Check for essential meta tags
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
    
    // Check for viewport meta tag
    await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
    
    // Check for charset
    const charset = page.locator('meta[charset]').or(page.locator('meta[http-equiv="Content-Type"]'));
    await expect(charset).toHaveCount(1);
  });

  test('should have working contact form or contact information', async ({ page }) => {
    // Look for contact form or contact information
    const contactForm = page.locator('form').first();
    const contactInfo = page.locator('text=/contact|email|phone/i').first();
    
    // Either contact form or contact info should be present
    const hasContact = await contactForm.count() > 0 || await contactInfo.count() > 0;
    expect(hasContact).toBeTruthy();
  });

  test('should have fast loading performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Check for Core Web Vitals
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics: any = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              metrics.loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
            }
          });
          
          resolve(metrics);
        }).observe({ entryTypes: ['navigation'] });
      });
    });
    
    console.log('Performance metrics:', performanceMetrics);
  });
});
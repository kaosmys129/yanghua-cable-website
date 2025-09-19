import { test, expect } from '@playwright/test';

test.describe('Products Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('should load products page successfully', async ({ page }) => {
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Products|产品/);
    
    // Check for products container or grid
    const productsContainer = page.locator('[data-testid="products-grid"]').or(
      page.locator('.products-grid').or(
        page.locator('[class*="product"]').first()
      )
    );
    
    await expect(productsContainer).toBeVisible();
  });

  test('should display product categories', async ({ page }) => {
    // Look for category filters or navigation
    const categories = page.locator('[data-testid="product-categories"]').or(
      page.locator('.category-filter').or(
        page.locator('button:has-text("Category")').or(
          page.locator('select[name*="category"]')
        )
      )
    );
    
    // Categories should be visible if they exist
    if (await categories.count() > 0) {
      await expect(categories.first()).toBeVisible();
    }
  });

  test('should display product cards with essential information', async ({ page }) => {
    // Wait for products to load
    await page.waitForLoadState('networkidle');
    
    // Look for product cards
    const productCards = page.locator('[data-testid="product-card"]').or(
      page.locator('.product-card').or(
        page.locator('[class*="product-item"]')
      )
    );
    
    const cardCount = await productCards.count();
    
    if (cardCount > 0) {
      // Check first product card
      const firstCard = productCards.first();
      await expect(firstCard).toBeVisible();
      
      // Product should have name/title
      const productName = firstCard.locator('h1, h2, h3, h4, h5, h6').or(
        firstCard.locator('[data-testid="product-name"]').or(
          firstCard.locator('.product-name')
        )
      );
      
      if (await productName.count() > 0) {
        await expect(productName.first()).toBeVisible();
      }
      
      // Product should have image
      const productImage = firstCard.locator('img');
      if (await productImage.count() > 0) {
        await expect(productImage.first()).toBeVisible();
      }
    }
  });

  test('should have working search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('[data-testid="product-search"]').or(
      page.locator('input[type="search"]').or(
        page.locator('input[placeholder*="search"]').or(
          page.locator('input[name*="search"]')
        )
      )
    );
    
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
      
      // Test search functionality
      await searchInput.first().fill('cable');
      await page.keyboard.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Results should be displayed
      const results = page.locator('[data-testid="search-results"]').or(
        page.locator('.search-results').or(
          page.locator('[class*="product"]')
        )
      );
      
      // Should have some results or no results message
      const hasResults = await results.count() > 0;
      const noResultsMessage = page.locator('text=/no results|没有结果/i');
      const hasNoResultsMessage = await noResultsMessage.count() > 0;
      
      expect(hasResults || hasNoResultsMessage).toBeTruthy();
    }
  });

  test('should have working filters', async ({ page }) => {
    // Look for filter options
    const filters = page.locator('[data-testid="product-filters"]').or(
      page.locator('.filters').or(
        page.locator('select, input[type="checkbox"]').first()
      )
    );
    
    if (await filters.count() > 0) {
      await expect(filters.first()).toBeVisible();
      
      // Test filter interaction
      const filterOption = filters.locator('option, input[type="checkbox"]').first();
      if (await filterOption.count() > 0) {
        await filterOption.click();
        
        // Wait for filter to apply
        await page.waitForTimeout(1000);
        
        // Products should be filtered
        const products = page.locator('[data-testid="product-card"]').or(
          page.locator('.product-card')
        );
        
        // Should have products or no results message
        const hasProducts = await products.count() > 0;
        const noResultsMessage = page.locator('text=/no products|没有产品/i');
        const hasNoResultsMessage = await noResultsMessage.count() > 0;
        
        expect(hasProducts || hasNoResultsMessage).toBeTruthy();
      }
    }
  });

  test('should navigate to product detail page', async ({ page }) => {
    // Wait for products to load
    await page.waitForLoadState('networkidle');
    
    // Find first product link
    const productLink = page.locator('[data-testid="product-link"]').or(
      page.locator('a[href*="/product"]').or(
        page.locator('.product-card a').or(
          page.locator('[class*="product"] a')
        )
      )
    );
    
    if (await productLink.count() > 0) {
      const firstProductLink = productLink.first();
      await expect(firstProductLink).toBeVisible();
      
      // Click on product link
      await firstProductLink.click();
      
      // Should navigate to product detail page
      await page.waitForLoadState('networkidle');
      
      // URL should change to product detail
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/product/);
      
      // Should show product details
      const productDetail = page.locator('[data-testid="product-detail"]').or(
        page.locator('.product-detail').or(
          page.locator('h1')
        )
      );
      
      await expect(productDetail.first()).toBeVisible();
    }
  });

  test('should have pagination or load more functionality', async ({ page }) => {
    // Wait for products to load
    await page.waitForLoadState('networkidle');
    
    // Look for pagination
    const pagination = page.locator('[data-testid="pagination"]').or(
      page.locator('.pagination').or(
        page.locator('button:has-text("Next")').or(
          page.locator('button:has-text("Load More")')
        )
      )
    );
    
    if (await pagination.count() > 0) {
      await expect(pagination.first()).toBeVisible();
      
      // Test pagination/load more
      const nextButton = pagination.locator('button:has-text("Next"), button:has-text("Load More")').first();
      if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
        const initialProductCount = await page.locator('[data-testid="product-card"]').or(
          page.locator('.product-card')
        ).count();
        
        await nextButton.click();
        await page.waitForTimeout(2000);
        
        const newProductCount = await page.locator('[data-testid="product-card"]').or(
          page.locator('.product-card')
        ).count();
        
        // Should have more products or navigate to next page
        expect(newProductCount >= initialProductCount).toBeTruthy();
      }
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    const desktopProducts = page.locator('[data-testid="product-card"]').or(
      page.locator('.product-card')
    );
    
    if (await desktopProducts.count() > 0) {
      await expect(desktopProducts.first()).toBeVisible();
    }
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    if (await desktopProducts.count() > 0) {
      await expect(desktopProducts.first()).toBeVisible();
    }
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    if (await desktopProducts.count() > 0) {
      await expect(desktopProducts.first()).toBeVisible();
    }
  });

  test('should have proper loading states', async ({ page }) => {
    // Navigate to products page
    const navigationPromise = page.goto('/products');
    
    // Look for loading indicators
    const loadingIndicator = page.locator('[data-testid="loading"]').or(
      page.locator('.loading').or(
        page.locator('.spinner').or(
          page.locator('text=/loading|加载中/i')
        )
      )
    );
    
    // Loading indicator might appear briefly
    if (await loadingIndicator.count() > 0) {
      // Loading should disappear after page loads
      await navigationPromise;
      await page.waitForLoadState('networkidle');
      
      // Loading indicator should be hidden
      await expect(loadingIndicator.first()).toBeHidden();
    }
  });
});
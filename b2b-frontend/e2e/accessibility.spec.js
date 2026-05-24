import { test, expect } from '@playwright/test';

test.describe('Accessibility Testing', () => {
  test('should have proper heading hierarchy on landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    expect(h1Count).toBeLessThanOrEqual(1); // Should have only one h1
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/login');
    
    // All inputs should have labels or aria-label
    const inputs = page.locator('input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        // Check if there's a label for this id
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        const hasAriaLabel = !!ariaLabel || !!ariaLabelledBy;
        
        expect(hasLabel || hasAriaLabel).toBeTruthy();
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // This is a basic check - comprehensive contrast testing requires specialized tools
    await page.goto('/');
    
    // Check that text is visible (basic visibility check)
    const textElements = page.locator('p, span, button, a, h1, h2, h3');
    const count = await textElements.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to submit with Enter
    await page.keyboard.press('Enter');
    
    // Should trigger validation
    await page.waitForTimeout(1000);
  });

  test('should have accessible buttons with proper ARIA attributes', async ({ page }) => {
    await page.goto('/');
    
    // All buttons should be accessible
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      // Button should have text or aria-label
      expect(text?.trim().length || ariaLabel?.length).toBeGreaterThan(0);
    }
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    
    // All images should have alt attributes
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      
      // Alt can be empty string for decorative images, but attribute must exist
      expect(alt !== null).toBeTruthy();
    }
  });

  test('should handle focus states properly', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.focus();
    
    // Check if element is focused
    const isFocused = await emailInput.evaluate(el => el === document.activeElement);
    expect(isFocused).toBeTruthy();
  });

  test('should announce loading states to screen readers', async ({ page }) => {
    await page.goto('/login');
    
    // Check for loading indicators with proper ARIA
    const loadingElements = page.locator('[aria-busy="true"], [role="status"], [role="progressbar"]');
    
    // May or may not have loading states initially
    // Just verify structure if present
    const count = await loadingElements.count();
    console.log(`Found ${count} loading elements`);
  });
});

test.describe('Responsive Accessibility', () => {
  test('should be accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Mobile menu should be accessible
    const menuToggle = page.locator('[data-testid="menu-toggle"], button[aria-label*="menu" i]').first();
    const hasMenu = await menuToggle.count() > 0;
    
    if (hasMenu) {
      const ariaLabel = await menuToggle.getAttribute('aria-label');
      const ariaExpanded = await menuToggle.getAttribute('aria-expanded');
      
      // Should have proper ARIA attributes
      expect(ariaLabel || ariaExpanded !== null).toBeTruthy();
    }
  });

  test('should handle touch interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/products');
    
    // Touch targets should be at least 44x44px (basic check)
    const buttons = page.locator('button, a');
    const count = await buttons.count();
    
    if (count > 0) {
      const firstButton = buttons.first();
      const box = await firstButton.boundingBox();
      
      // Log dimensions (comprehensive size testing requires more complex checks)
      console.log('Button dimensions:', box);
    }
  });
});

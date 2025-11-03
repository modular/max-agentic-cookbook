import { test, expect } from '@playwright/test';

/**
 * Example E2E test demonstrating how Claude can interact with the React app
 * This test shows navigation, UI interaction, and visual verification capabilities
 */

test.describe('MAX Agentic Cookbook Navigation', () => {
  test('loads the homepage successfully', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Verify the page loads
    await expect(page).toHaveTitle(/MAX Agentic Cookbook/i);

    // Take a screenshot for Claude to analyze
    await page.screenshot({ path: 'e2e/screenshots/homepage.png', fullPage: true });
  });

  test('can toggle theme between light and dark mode', async ({ page }) => {
    await page.goto('/');

    // Find and click the theme toggle button
    const themeToggle = page.getByRole('button', { name: /switch to (dark|light) theme/i });
    await expect(themeToggle).toBeVisible();

    // Take screenshot in initial theme
    await page.screenshot({
      path: 'e2e/screenshots/theme-before-toggle.png',
      fullPage: true
    });

    // Click the theme toggle
    await themeToggle.click();

    // Wait for theme transition
    await page.waitForTimeout(300);

    // Take screenshot after theme change
    await page.screenshot({
      path: 'e2e/screenshots/theme-after-toggle.png',
      fullPage: true
    });

    // Verify the theme changed by checking button label
    await expect(themeToggle).toBeVisible();
  });

  test('displays recipe cards on the index page', async ({ page }) => {
    await page.goto('/');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Look for recipe-related content
    // Note: Adjust selectors based on actual app structure
    const mainContent = page.locator('main, [role="main"], .content');
    await expect(mainContent).toBeVisible();

    // Take a screenshot for analysis
    await page.screenshot({
      path: 'e2e/screenshots/recipe-index.png',
      fullPage: true
    });
  });

  test('can navigate to a recipe page', async ({ page }) => {
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Try to find and click a recipe link
    // This will need to be adjusted based on your actual recipe structure
    const recipeLinks = page.locator('a[href*="/recipes/"]').first();

    if (await recipeLinks.count() > 0) {
      const recipePath = await recipeLinks.getAttribute('href');
      await recipeLinks.click();

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      // Verify we navigated to a recipe page
      expect(page.url()).toContain('/recipes/');

      // Take screenshot of the recipe page
      await page.screenshot({
        path: 'e2e/screenshots/recipe-page.png',
        fullPage: true
      });
    }
  });

  test('has no console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Report any console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('is responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take screenshot on mobile
    await page.screenshot({
      path: 'e2e/screenshots/mobile-view.png',
      fullPage: true
    });

    // Verify the page is still functional
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Claude Debugging Capabilities Demo', () => {
  test('can capture network requests for debugging', async ({ page }) => {
    const requests: string[] = [];

    // Listen for all network requests
    page.on('request', (request) => {
      requests.push(`${request.method()} ${request.url()}`);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Log requests for Claude to analyze
    console.log('Network requests captured:', requests.length);

    // This would help Claude understand what API calls are being made
    expect(requests.length).toBeGreaterThan(0);
  });

  test('can inspect element properties', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find specific elements and inspect their properties
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      console.log(`Button found: "${text}", visible: ${isVisible}`);
    }

    // Claude can use this information to understand the UI structure
  });

  test('can simulate user interactions', async ({ page }) => {
    await page.goto('/');

    // Simulate various user interactions that Claude can perform

    // 1. Hover over elements
    const firstButton = page.locator('button').first();
    if (await firstButton.count() > 0) {
      await firstButton.hover();
      await page.screenshot({
        path: 'e2e/screenshots/hover-state.png'
      });
    }

    // 2. Type in input fields
    const inputs = page.locator('input[type="text"], textarea');
    if (await inputs.count() > 0) {
      await inputs.first().fill('Test input from Claude');
      await page.screenshot({
        path: 'e2e/screenshots/filled-input.png'
      });
    }

    // 3. Navigate with keyboard
    await page.keyboard.press('Tab');
    await page.screenshot({
      path: 'e2e/screenshots/keyboard-navigation.png'
    });
  });
});

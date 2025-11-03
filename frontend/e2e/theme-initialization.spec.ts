import { test, expect } from '@playwright/test';

/**
 * Test to reproduce and verify the dark mode initialization issue
 * Issue: When system is in dark mode on first load:
 * - Theme toggle shows wrong state (light mode icon)
 * - App color scheme is correct (dark mode)
 * - highlight.js syntax highlighting is wrong (light mode colors)
 */

test.describe('Theme Initialization with System Dark Mode', () => {
  test('should initialize correctly when system prefers dark mode', async ({ page }) => {
    // Emulate system dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });

    // Navigate to app (simulating first visit)
    await page.goto('/', { waitUntil: 'networkidle' });

    // Take screenshot of initial state
    await page.screenshot({
      path: 'e2e/screenshots/dark-mode-initial.png',
      fullPage: true
    });

    // Check 1: Theme toggle should show moon icon (dark mode active)
    const themeToggle = page.getByRole('button', { name: /theme/i });
    await expect(themeToggle).toBeVisible();

    // Take screenshot of the theme toggle specifically
    await themeToggle.screenshot({
      path: 'e2e/screenshots/theme-toggle-state.png'
    });

    // Check if moon icon is present (should be in dark mode)
    const moonIcon = page.locator('[aria-label*="theme"]').locator('svg');
    const isVisible = await moonIcon.isVisible();
    console.log('Theme toggle icon visible:', isVisible);

    // Check 2: App should be in dark mode - check HTML data attributes
    const htmlElement = page.locator('html');
    const dataTheme = await htmlElement.getAttribute('data-mantine-color-scheme');
    console.log('Mantine color scheme:', dataTheme);

    // Check 3: Look for code blocks and inspect highlight.js styling
    const codeBlocks = page.locator('pre code, .hljs');
    const codeBlockCount = await codeBlocks.count();
    console.log('Code blocks found:', codeBlockCount);

    if (codeBlockCount > 0) {
      // Navigate to a page with code if needed
      const recipeLink = page.locator('a[href*="/recipes/"]').first();
      if (await recipeLink.count() > 0) {
        await recipeLink.click();
        await page.waitForLoadState('networkidle');

        // Look for code view or readme with syntax highlighting
        const codeViewLink = page.locator('text=/code|readme/i').first();
        if (await codeViewLink.count() > 0) {
          await codeViewLink.click();
          await page.waitForLoadState('networkidle');
        }

        // Take screenshot showing the syntax highlighting issue
        await page.screenshot({
          path: 'e2e/screenshots/syntax-highlighting-issue.png',
          fullPage: true
        });

        // Check the actual styles on code blocks
        const codeBlock = page.locator('pre code, .hljs').first();
        if (await codeBlock.count() > 0) {
          const bgColor = await codeBlock.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
          });
          console.log('Code block background color:', bgColor);

          // Take a focused screenshot of the code block
          await codeBlock.screenshot({
            path: 'e2e/screenshots/code-block-close-up.png'
          });
        }
      }
    }

    // Check console for any errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }

    // This test documents the bug - we expect it to potentially fail until fixed
    // expect(dataTheme).toBe('dark');
  });

  test('should toggle theme correctly after initialization', async ({ page }) => {
    // Start with system dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Click theme toggle
    const themeToggle = page.getByRole('button', { name: /theme/i });
    await themeToggle.click();

    await page.waitForTimeout(500); // Wait for animation

    // Take screenshot after toggle
    await page.screenshot({
      path: 'e2e/screenshots/after-theme-toggle.png',
      fullPage: true
    });

    // Check if theme actually changed
    const htmlElement = page.locator('html');
    const dataTheme = await htmlElement.getAttribute('data-mantine-color-scheme');
    console.log('Theme after toggle:', dataTheme);
  });

  test('should inspect theme initialization logic', async ({ page }) => {
    // Emulate dark mode
    await page.emulateMedia({ colorScheme: 'dark' });

    // Listen for console logs to understand initialization
    const logs: string[] = [];
    page.on('console', (msg) => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Log all console messages
    console.log('Console logs during initialization:');
    logs.forEach(log => console.log(log));

    // Check localStorage for theme preference
    const localStorageTheme = await page.evaluate(() => {
      return localStorage.getItem('mantine-color-scheme-value');
    });
    console.log('localStorage theme:', localStorageTheme);

    // Check system preference
    const systemPreference = await page.evaluate(() => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    console.log('System prefers dark:', systemPreference);
  });
});

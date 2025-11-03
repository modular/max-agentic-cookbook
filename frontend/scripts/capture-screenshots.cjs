#!/usr/bin/env node

/**
 * Standalone screenshot capture script using Playwright
 * Designed to work in containerized environments
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
  console.log('Launching browser in headless mode...');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-dev-tools',
      '--no-zygote',
      '--single-process', // Important for containers
    ],
  });

  console.log('Browser launched successfully');

  try {
    const context = await browser.newContext({
      colorScheme: 'dark', // Emulate dark mode
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();

    console.log('Navigating to http://localhost:5173...');

    await page.goto('http://localhost:5173', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    console.log('Page loaded, waiting for content to render...');
    await page.waitForTimeout(2000);

    // Ensure screenshots directory exists
    const screenshotDir = path.join(__dirname, 'e2e', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Take homepage screenshot
    const screenshotPath = path.join(screenshotDir, 'homepage-dark-mode.png');
    console.log(`Taking screenshot: ${screenshotPath}`);

    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
    });

    console.log('✓ Homepage screenshot captured!');

    // Try to find and screenshot the theme toggle
    try {
      const themeToggle = await page.locator('[aria-label*="theme"]').first();
      if (await themeToggle.isVisible()) {
        const togglePath = path.join(screenshotDir, 'theme-toggle.png');
        await themeToggle.screenshot({ path: togglePath });
        console.log('✓ Theme toggle screenshot captured!');
      }
    } catch (e) {
      console.log('Note: Could not capture theme toggle screenshot');
    }

    // Try to navigate to a recipe and capture code
    try {
      const recipeLink = await page.locator('a[href*="/recipes/"]').first();
      if (await recipeLink.isVisible()) {
        console.log('Navigating to recipe page...');
        await recipeLink.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        const recipePath = path.join(screenshotDir, 'recipe-page-dark-mode.png');
        await page.screenshot({ path: recipePath, fullPage: false });
        console.log('✓ Recipe page screenshot captured!');
      }
    } catch (e) {
      console.log('Note: Could not capture recipe page');
    }

    await context.close();

  } catch (error) {
    console.error('Error during screenshot capture:', error);
    throw error;
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the script
captureScreenshots()
  .then(() => {
    console.log('\n✓ All screenshots captured successfully!');
    console.log('Screenshots saved in: e2e/screenshots/\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Screenshot capture failed:', error.message);
    process.exit(1);
  });

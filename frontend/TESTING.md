# Testing Guide for MAX Agentic Cookbook

This guide explains how to use the testing infrastructure to test and debug the React frontend, including how Claude can interact with your application.

## Overview

The frontend uses two complementary testing approaches:

- **Vitest** - For unit and component testing
- **Playwright** - For end-to-end (E2E) testing and debugging

## Quick Start

### First Time Setup

Install Playwright browsers (only needed once):

```bash
cd frontend
npm run playwright:install
```

### Running Tests

```bash
# Run all unit tests
npm test

# Run unit tests with UI
npm run test:ui

# Run unit tests once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI (great for debugging)
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests step by step
npm run test:e2e:debug
```

## Unit Testing with Vitest

### What is Vitest?

Vitest is a blazing-fast unit test framework perfect for testing individual React components in isolation.

### Writing Component Tests

Component tests live next to the components they test with a `.test.tsx` extension.

**Example:** `src/components/ThemeToggle.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Best Practices

- Test user behavior, not implementation details
- Use `screen.getByRole()` for better accessibility
- Test the component from the user's perspective
- Keep tests focused and independent

## E2E Testing with Playwright

### What is Playwright?

Playwright is a powerful browser automation tool that lets you test your entire application in real browsers. **This is where Claude can interact with your React app!**

### How Claude Uses Playwright

Claude can:

1. **Navigate your app** - Visit pages, click links, fill forms
2. **Take screenshots** - Capture visual state at any point
3. **Inspect elements** - Read text, attributes, styles
4. **Monitor network** - Track API calls and responses
5. **Capture console logs** - See errors and debug messages
6. **Simulate user interactions** - Type, click, hover, drag, etc.
7. **Test responsive design** - Check different viewport sizes

### Example: Debugging with Claude

Here's how you can ask Claude to help debug issues:

**You:** "Claude, can you test if the theme toggle works correctly on mobile?"

**Claude would:**
```typescript
// 1. Set mobile viewport
await page.setViewportSize({ width: 375, height: 667 });

// 2. Navigate to the app
await page.goto('/');

// 3. Take a screenshot to see current state
await page.screenshot({ path: 'before-click.png' });

// 4. Click the theme toggle
await page.click('[aria-label*="theme"]');

// 5. Take another screenshot
await page.screenshot({ path: 'after-click.png' });

// 6. Check if theme actually changed
const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
console.log('Current theme:', theme);
```

### Writing E2E Tests

E2E tests live in the `e2e/` directory with a `.spec.ts` extension.

**Example:** `e2e/my-feature.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('user can complete a task', async ({ page }) => {
  // Navigate to your app
  await page.goto('/');

  // Interact with elements
  await page.fill('input[name="username"]', 'testuser');
  await page.click('button[type="submit"]');

  // Take screenshot for debugging
  await page.screenshot({ path: 'e2e/screenshots/after-submit.png' });

  // Assert expected outcome
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### E2E Test Organization

```
frontend/
├── e2e/
│   ├── app-navigation.spec.ts      # Navigation and routing tests
│   ├── user-interactions.spec.ts   # Form submissions, clicks, etc.
│   ├── responsive.spec.ts          # Mobile/tablet/desktop tests
│   └── screenshots/                # Screenshots captured during tests
```

## Using Claude for Interactive Debugging

### Scenario 1: "Something looks wrong"

**You:** "Claude, the recipe page looks broken on mobile. Can you check it?"

Claude will:
1. Open the page in mobile viewport
2. Take screenshots
3. Check console for errors
4. Inspect the layout
5. Report findings with visual evidence

### Scenario 2: "This button doesn't work"

**You:** "Claude, the submit button on the chat form isn't working. Can you debug it?"

Claude will:
1. Navigate to the form
2. Inspect the button element
3. Check if it's disabled or hidden
4. Monitor network requests when clicking
5. Capture console errors
6. Provide a detailed report

### Scenario 3: "Test this new feature"

**You:** "Claude, I just added a new search feature. Can you test it thoroughly?"

Claude will:
1. Write comprehensive E2E tests
2. Test normal use cases
3. Test edge cases (empty input, special characters)
4. Test on different screen sizes
5. Verify accessibility
6. Generate a test report

## Configuration Files

### `vitest.config.ts`

Configures Vitest with:
- jsdom environment for DOM testing
- React plugin
- Test setup file
- Coverage reporting

### `playwright.config.ts`

Configures Playwright with:
- Multiple browsers (Chromium, Firefox, WebKit)
- Mobile device emulation
- Screenshot and video capture on failure
- Automatic dev server startup
- Trace collection for debugging

### `src/test/setup.ts`

Sets up the testing environment with:
- `@testing-library/jest-dom` matchers
- Automatic cleanup after each test

## Continuous Integration

To run tests in CI/CD:

```bash
# Run all tests in CI mode
npm run test:run
npm run test:e2e
```

The Playwright config automatically adjusts for CI environments:
- Retries failed tests 2 times
- Runs tests serially (not in parallel)
- Disables `test.only` in CI

## Tips for Working with Claude

### Be Specific

❌ "Test the app"
✅ "Test the recipe navigation - make sure I can click on a recipe card and see the recipe details"

### Request Screenshots

Always ask Claude to take screenshots when debugging visual issues. Claude can analyze the images and spot problems.

### Iterative Debugging

Claude can run tests, analyze results, modify code, and re-run tests in a loop until issues are resolved.

### Example Workflow

1. **You:** "Claude, can you write a test that verifies the dark mode persists after page reload?"
2. **Claude:** Creates test, runs it, and reports results
3. **You:** "It's failing - the theme doesn't persist"
4. **Claude:** Debugs the issue, finds the localStorage isn't being checked on mount
5. **Claude:** Suggests a fix to the ThemeToggle component
6. **You:** "Make that change and re-run the test"
7. **Claude:** Updates code, re-runs test, confirms it passes ✅

## Troubleshooting

### Playwright browsers not installed

```bash
npm run playwright:install
```

### Tests timing out

Increase timeout in the test:

```typescript
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ... rest of test
});
```

### Screenshots not being captured

Make sure the `e2e/screenshots/` directory exists:

```bash
mkdir -p e2e/screenshots
```

### Port already in use

If port 5173 is taken, update `playwright.config.ts`:

```typescript
webServer: {
  url: 'http://localhost:5174',  // Use different port
  // ...
}
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

## Getting Help from Claude

Whenever you need help with testing, debugging, or understanding your React app's behavior, just ask Claude! Here are some examples:

- "Claude, write tests for the new feature I just added"
- "Claude, why is this component not rendering correctly?"
- "Claude, can you check if the app works on Safari mobile?"
- "Claude, test the entire user flow from login to checkout"
- "Claude, find out why the API calls are failing"

Claude can see your app, interact with it, and provide detailed feedback with screenshots and logs!

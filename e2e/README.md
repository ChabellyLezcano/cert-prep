# E2E Tests with Playwright

This directory contains end-to-end tests using [Playwright](https://playwright.dev/).

## Running Tests

```bash
# Run all E2E tests (headless)
npm run e2e

# Run tests in UI mode (interactive, recommended for development)
npm run e2e:ui

# Run tests in debug mode
npm run e2e:debug

# Run a specific test file
npx playwright test e2e/auth.spec.ts

# Run tests matching a pattern
npx playwright test --grep "login"

# Run against a specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Structure

Each test file (`*.spec.ts`) contains:

- **Test suites** (`test.describe()`) — grouped related tests
- **Test cases** (`test()`) — individual test scenarios
- **Setup/teardown** (`test.beforeEach()`, `test.afterEach()`) — prepare and clean up

Example:

```typescript
test.describe('Quiz', () => {
  test('should display questions on quiz page', async ({ page }) => {
    await page.goto('/certifications/databricks-dea/quiz');
    await expect(page.locator('.question-card')).toBeVisible();
  });
});
```

## Best Practices

### 1. Use Meaningful Selectors

```typescript
// ✅ Good: semantic HTML + data attributes
await page.locator('[data-testid="submit-button"]').click();
await page.locator('button:has-text("Save")').click();

// ❌ Avoid: brittle selectors
await page.locator('.btn-12').click();
await page.locator('button.primary').click(); // too generic
```

### 2. Wait for Elements Appropriately

```typescript
// ✅ Playwright auto-waits for element visibility
await page.click('button:has-text("Submit")');

// ✅ Explicit wait when needed
await page.waitForSelector('[data-testid="confirmation"]', { timeout: 5000 });
```

### 3. Keep Tests Independent

Each test should be self-contained and not depend on other tests:

```typescript
// ✅ Good: each test sets up its own state
test('should save answer', async ({ page }) => {
  await page.goto('/certifications/databricks-dea/quiz');
  await page.fill('input[name="answer"]', 'my-answer');
  await page.click('button:has-text("Save")');
});

// ❌ Avoid: depending on previous tests
let answerId;
test('create answer', () => {
  answerId = 123; // depends on test order
});
```

### 4. Test User Interactions, Not Implementation

```typescript
// ✅ Good: test what users see and do
test('should toggle theme', async ({ page }) => {
  await page.click('[aria-label*="theme"]');
  await expect(page.locator('html')).toHaveClass(/dark/);
});

// ❌ Avoid: testing internal state
test('should toggle theme', async ({ page }) => {
  const state = await page.evaluate(() => getState().theme);
  expect(state).toBe('dark');
});
```

### 5. Use Accessibility Selectors

```typescript
// ✅ Good: semantic + accessible
await page.click('button:has-text("Next")');
await page.locator('[role="button"]').click();

// Accessible naming:
await page.locator('[aria-label="Close dialog"]').click();
```

## Debugging

### View Trace

```bash
npx playwright show-trace trace.zip
```

### Screenshot on Failure

Automatically captured in `test-results/` on failure.

### Video Recording

Configure in `playwright.config.ts`:

```typescript
use: {
  video: 'retain-on-failure', // or 'on' for all
}
```

### Browser DevTools

```bash
npm run e2e:debug
```

Then step through tests with DevTools open.

## CI/CD Integration

Tests run automatically on:

- **Push** to any branch
- **Pull requests**

Reports are uploaded as artifacts and available for review.

See `.github/workflows/ci.yml` for details.

## Common Issues

### Tests timeout

Increase in `playwright.config.ts`:

```typescript
use: {
  navigationTimeout: 30000,
  actionTimeout: 10000,
}
```

### Port 5173 already in use

Kill the process or use a different port:

```bash
lsof -i :5173 | grep -v PID | awk '{print $2}' | xargs kill
```

### Tests fail in CI but pass locally

- CI may have different network/timing
- Increase timeouts in `playwright.config.ts`
- Avoid hardcoded waits (`await page.waitForTimeout(1000)`)
- Use explicit waits: `await page.waitForLoadState('networkidle')`

## Adding New Tests

1. Create a new `.spec.ts` file in `e2e/`
2. Import `test` and `expect` from `@playwright/test`
3. Write test cases following the patterns above
4. Run tests with `npm run e2e:ui` to debug
5. Ensure tests pass before committing

Example template:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/path');
    // Test implementation
    await expect(page.locator('...')).toBe...();
  });
});
```

---

For more details, see [Playwright docs](https://playwright.dev/docs/intro).

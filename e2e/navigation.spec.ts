import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should redirect / to /certifications', async ({ page }) => {
    await page.goto('/');
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/(login|signup|certifications)/);
  });

  test('should show theme toggle', async ({ page }) => {
    await page.goto('/login');
    const themeToggle = page.locator('[aria-label*="theme"]');
    await expect(themeToggle).toBeVisible();
  });

  test('should persist theme preference', async ({ page, context }) => {
    // Set dark theme
    await page.goto('/login');
    const html = page.locator('html');

    // Click theme toggle (adjust selector based on your implementation)
    const themeToggle = page.locator('button[aria-label*="theme"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(100);

      const isDark = await html.evaluate((el) => {
        return (
          el.classList.contains('dark') ||
          document.documentElement.style.colorScheme === 'dark'
        );
      });

      // Create new page and verify theme persists
      const newPage = await context.newPage();
      await newPage.goto('/login');

      const newHtml = newPage.locator('html');
      const isNewDark = await newHtml.evaluate((el) => {
        return (
          el.classList.contains('dark') ||
          document.documentElement.style.colorScheme === 'dark'
        );
      });

      expect(isDark).toBe(isNewDark);
      await newPage.close();
    }
  });

  test('should have accessible header', async ({ page }) => {
    await page.goto('/login');
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check for skip link
    const skipLink = page.locator('a:has-text("Skip to content")');
    if (await skipLink.isVisible()) {
      expect(await skipLink.getAttribute('href')).toBe('#main');
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName.toLowerCase();
    });

    // Should have some interactive element focused
    expect(['button', 'input', 'a']).toContain(focusedElement);
  });
});

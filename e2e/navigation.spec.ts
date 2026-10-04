import { test, expect } from '@playwright/test';

test.describe('Navigation and theme', () => {
  test('exposes a theme selector', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('radiogroup', { name: 'Color theme' })).toBeVisible();
  });

  test('persists the selected theme after reload', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('is keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    await page.keyboard.press('Tab');
    const tag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    expect(['button', 'input', 'a']).toContain(tag);
  });
});

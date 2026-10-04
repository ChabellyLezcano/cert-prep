import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Cert Prep/);
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
  });

  test('should display signup page', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('button:has-text("Sign up")')).toBeVisible();
  });

  test('should have link to signup from login', async ({ page }) => {
    await page.goto('/login');
    const signupLink = page.locator('a:has-text("Don\'t have an account?")');
    await expect(signupLink).toBeVisible();
    await signupLink.click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('should have link to login from signup', async ({ page }) => {
    await page.goto('/signup');
    const loginLink = page.locator('a:has-text("Already have an account?")');
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should reject invalid email format', async ({ page }) => {
    await page.goto('/signup');
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('not-an-email');
    await expect(emailInput).toHaveJSProperty('validationMessage', /valid/i);
  });
});

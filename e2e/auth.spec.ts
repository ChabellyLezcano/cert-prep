import { test, expect } from '@playwright/test';

test.describe('Authentication pages', () => {
  test('shows the login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('shows the signup form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });

  test('navigates from login to signup', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Create one' }).click();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test('navigates from signup to login', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/certifications');
    await expect(page).toHaveURL(/\/login/);
  });
});

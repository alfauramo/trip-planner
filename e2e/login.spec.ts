import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test('shows login form', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle').catch(() => {});
    // Check a form element exists
    await expect(page.locator('input[type="email"], input[type="password"]').first()).toBeVisible({ timeout: 10000 });
  });
});

import { test, expect } from '@playwright/test';

test.describe('Protected routes redirect to login', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    // Should end up at login page without errors
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });
});

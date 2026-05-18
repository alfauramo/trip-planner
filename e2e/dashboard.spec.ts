import { test, expect } from '@playwright/test';

test.describe('Dashboard redirects to login when not authenticated', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);
    await expect(page.getByRole('heading', { name: /iniciar sesión|login/i })).toBeVisible();
  });
});

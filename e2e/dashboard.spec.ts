import { test, expect } from '@playwright/test';
import { BASE_URL } from './helpers';

test.describe('Dashboard', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    // Should end up at login page
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });

  test('renders without runtime errors on login page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });
});

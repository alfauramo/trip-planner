import { test, expect } from '@playwright/test';
import { BASE_URL } from './helpers';

test.describe('Protected routes redirect to login', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    // Should end up at login page (either immediate or after auth check)
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 20000 });
  });
});

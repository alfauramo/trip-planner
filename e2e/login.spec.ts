import { test, expect } from '@playwright/test';
import { BASE_URL } from './helpers';

test.describe('Login page', () => {
  test('shows login form', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 10000 });
  });

  test('allows typing credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ timeout: 15000 });
    await emailInput.fill('user@example.com');
    await page.locator('input[type="password"]').fill('mypassword');
    await expect(emailInput).toHaveValue('user@example.com');
  });
});

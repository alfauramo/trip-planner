import { test, expect } from '@playwright/test';
import { BASE_URL } from './helpers';

test.describe('Login page', () => {
  test('renders without crashing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      if (!err.message.includes('supabaseUrl') && !err.message.includes('fetch')) {
        errors.push(err.message);
      }
    });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    expect(errors).toEqual([]);
  });
});

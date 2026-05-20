import { test, expect } from '@playwright/test';
import { BASE_URL } from './helpers';

test.describe('Dashboard', () => {
  test('renders without crashing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      // Ignore Supabase connection errors when env vars are missing
      if (!err.message.includes('supabaseUrl') && !err.message.includes('fetch')) {
        errors.push(err.message);
      }
    });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    expect(errors).toEqual([]);
  });
});

import { test, expect } from '@playwright/test';
import { BASE_URL } from './helpers';

test.describe('Trip creation flow', () => {
  test('dashboard loads without crashing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      if (!err.message.includes('supabaseUrl') && !err.message.includes('fetch')) {
        errors.push(err.message);
      }
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    expect(errors).toEqual([]);
  });

  test('auth pages render without crashing', async ({ page }) => {
    for (const route of ['/login', '/register', '/forgot-password', '/update-password']) {
      const errors: string[] = [];
      page.on('pageerror', (err) => {
        if (!err.message.includes('supabaseUrl') && !err.message.includes('fetch')) {
          errors.push(err.message);
        }
      });
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1000);
      expect(errors).toEqual([]);
    }
  });
});

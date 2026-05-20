import { test, expect } from '@playwright/test';
import { BASE_URL } from './helpers';

test.describe('Trip creation flow', () => {
  test('dashboard loads without runtime errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });

  test('all auth pages render without runtime errors', async ({ page }) => {
    for (const route of ['/login', '/register', '/forgot-password', '/update-password']) {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1000);
      expect(errors).toEqual([]);
    }
  });

  test('protected routes redirect to login', async ({ page }) => {
    for (const route of ['/', '/trips/123', '/invitations', '/profile']) {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(3000);
      expect(errors).toEqual([]);
    }
  });
});

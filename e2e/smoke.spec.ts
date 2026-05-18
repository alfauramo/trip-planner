import { test, expect, type Page } from '@playwright/test';
import { BASE_URL } from './helpers';

async function collectErrors(page: Page): Promise<string[]> {
  const errs: string[] = [];
  page.on('pageerror', (err) => errs.push(`[uncaught] ${err.message}`));
  await page.waitForTimeout(2000);
  return errs;
}

test.describe('Smoke — all routes render without uncaught errors', () => {
  for (const route of ['/login', '/register', '/forgot-password', '/update-password']) {
    test(`${route} renders without errors`, async ({ page }) => {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      const errors = await collectErrors(page);
      expect(errors).toEqual([]);
    });
  }

  for (const route of ['/', '/trips/123', '/invitations', '/profile']) {
    test(`${route} handles auth redirect without errors`, async ({ page }) => {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const errors = await collectErrors(page);
      expect(errors).toEqual([]);
    });
  }
});

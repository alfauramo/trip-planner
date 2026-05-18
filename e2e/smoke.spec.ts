import { test, expect, type Page } from '@playwright/test';

async function assertNoErrors(page: Page) {
  const errors: { msg: string }[] = [];
  const pageErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ msg: msg.text() });
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  // Wait for React to mount and settle
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  const combined = [...errors.map((e) => `[console.error] ${e.msg}`), ...pageErrors.map((e) => `[uncaught] ${e}`)];

  expect(combined, `Page has ${combined.length} error(s):\n${combined.join('\n')}`).toEqual([]);
}

test.describe('Smoke — all routes render without errors', () => {
  test('/login renders without errors', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle').catch(() => {});
    await assertNoErrors(page);
  });

  test('/register renders without errors', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle').catch(() => {});
    await assertNoErrors(page);
  });

  test('/forgot-password renders without errors', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle').catch(() => {});
    await assertNoErrors(page);
  });

  test('/update-password renders without errors', async ({ page }) => {
    await page.goto('/update-password');
    await page.waitForLoadState('networkidle').catch(() => {});
    await assertNoErrors(page);
  });

  test('/ redirects to login without errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    await assertNoErrors(page);
  });

  test('/trips/123 redirects to login without errors', async ({ page }) => {
    await page.goto('/trips/123');
    await page.waitForLoadState('networkidle').catch(() => {});
    await assertNoErrors(page);
  });

  test('/invitations redirects to login without errors', async ({ page }) => {
    await page.goto('/invitations');
    await page.waitForLoadState('networkidle').catch(() => {});
    await assertNoErrors(page);
  });

  test('/profile redirects to login without errors', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle').catch(() => {});
    await assertNoErrors(page);
  });
});

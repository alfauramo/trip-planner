import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test('shows login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /iniciar sesión|login/i })).toBeVisible();
    await expect(page.getByLabel(/email|correo/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|correo/i).fill('wrong@example.com');
    await page.getByLabel(/contraseña|password/i).fill('wrongpass');
    await page.getByRole('button', { name: /iniciar sesión|ingresar|login/i }).click();
    await expect(page.getByText(/error|inválido|incorrecto|invalid/i)).toBeVisible({ timeout: 10000 });
  });
});

import { expect, test } from '@playwright/test';

test('home page shows tool links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Post Office' })).toBeVisible();
    await expect(page.locator('.home-link-card').filter({ hasText: 'JSON Formatter' })).toBeVisible();
    await expect(page.locator('.home-link-card').filter({ hasText: 'API Tester' })).toBeVisible();
});

test('json formatter validates and formats input', async ({ page }) => {
    await page.goto('/json');
    await page.getByRole('button', { name: 'User' }).click();
    await expect(page.getByText('✓ valid')).toBeVisible();
    await expect(page.locator('.json-output')).toContainText('"name": "Alice Chen"');
});

test('api tester sends local echo request', async ({ page }) => {
    await page.goto('/api');
    await page.getByRole('button', { name: 'Local echo' }).click();
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('Post Office local echo')).toBeVisible({ timeout: 15_000 });
});

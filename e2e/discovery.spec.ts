import { expect, test } from '@playwright/test';
test('discovery is disabled without a selected account', async ({ page }) => {
  await page.goto('/permissions');
  await expect(
    page.getByRole('button', { name: 'Discover and verify approvals' }),
  ).toBeDisabled();
});
test('live anonymous bounded Approval log query', async ({ page }) => {
  test.skip(process.env.LIVE_ANON_RPC !== '1', 'Live opt-in required');
  test.setTimeout(240000);
  await page.goto('/privacy');
  if (process.env.LIVE_TRANSPORT === 'nox')
    await page
      .getByRole('combobox', { name: 'Anonymous transport' })
      .selectOption('nox');
  await page.getByRole('button', { name: 'Inspect an address' }).click();
  await page
    .getByLabel('Ethereum address', { exact: true })
    .fill('0x0000000000000000000000000000000000000000');
  await page
    .getByRole('button', { name: 'Inspect anonymously', exact: true })
    .click();
  await expect(page.getByTestId('native-balance')).toBeVisible({
    timeout: 180000,
  });
  await page.getByRole('link', { name: 'Permissions', exact: true }).click();
  await page.getByLabel('First block (optional)').fill('1000000');
  await page.getByLabel('Last block (optional)').fill('1000000');
  await page
    .getByRole('button', { name: 'Discover and verify approvals' })
    .click();
  await expect(page.getByText(/Blocks 1000000–1000000/)).toBeVisible({
    timeout: 120000,
  });
  await expect(page.getByText(/1 log requests · 0 gaps/)).toBeVisible();
});

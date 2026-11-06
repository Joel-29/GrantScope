import { expect, test } from '@playwright/test';
test('Permit2 inspection requires an account and explains SignatureTransfer limits', async ({
  page,
}) => {
  await page.goto('/permissions');
  await expect(
    page.getByRole('button', { name: 'Inspect Permit2 grants' }),
  ).toBeDisabled();
  await expect(
    page.getByText('Neither enumerates offchain signatures.', { exact: false }),
  ).toBeVisible();
});
test('live canonical Permit2 reads and underlying ERC-20 dependencies', async ({
  page,
}) => {
  test.skip(process.env.LIVE_ANON_RPC !== '1', 'Live opt-in required');
  test.setTimeout(300000);
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
  await page.getByRole('button', { name: 'Inspect Permit2 grants' }).click();
  await expect(
    page.getByText(/4 selected AllowanceTransfer pairs at block/),
  ).toBeVisible({ timeout: 180000 });
  await expect(
    page.getByText('0 Permit2 pairs unreadable; these remain unknown.'),
  ).toBeVisible();
  await expect(page.getByText(/Permit2 →/)).toHaveCount(4);
});

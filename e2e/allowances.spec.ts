import { expect, test } from '@playwright/test';
test('permission inventory stays empty until explicit address selection', async ({
  page,
}) => {
  await page.goto('/permissions');
  await expect(
    page.getByRole('heading', { name: 'Choose an address to scan' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Scan selected pairs' }),
  ).toHaveCount(0);
});
test('live anonymous ERC-20 metadata balance and allowances', async ({
  page,
}) => {
  test.skip(process.env.LIVE_ANON_RPC !== '1', 'Live network opt-in required');
  test.setTimeout(360000);
  const forbidden: string[] = [];
  page.on('request', (request) => {
    if (
      request.url().includes('publicnode.com') &&
      request.method() === 'POST'
    ) {
      const body = request.postDataJSON() as {
        method: string;
        params: { to?: string; data?: string }[];
      };
      if (
        body.method !== 'eth_call' ||
        !['0x3898587d', '0x1c67ff29'].includes(body.params[0]?.data ?? '')
      )
        forbidden.push(body.method);
    }
  });
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
  await page.getByRole('button', { name: 'Scan selected pairs' }).click();
  await expect(
    page.getByText(/6 selected token\/spender pairs at block/),
  ).toBeVisible({ timeout: 180000 });
  await expect(
    page
      .getByRole('table', { name: 'Verified ERC-20 pair results' })
      .getByRole('row'),
  ).toHaveCount(7);
  await expect(
    page.getByText('0 failed pair reads', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('combobox', { name: /^Allowance size/ })
    .selectOption('maximum');
  await expect(
    page.getByText('No matching verified pairs.', { exact: false }),
  ).toBeVisible();
  expect(forbidden).toEqual([]);
});

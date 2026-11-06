import { expect, test } from '@playwright/test';

test('invalid addresses are rejected without any RPC or wallet connection', async ({
  page,
}) => {
  const rpc: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('publicnode.com')) rpc.push(request.url());
  });
  await page.goto('/dashboard');
  await page.getByLabel('Ethereum address', { exact: true }).fill('bad.eth');
  await page
    .getByRole('button', { name: 'Inspect anonymously', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'ENS names are not resolved',
  );
  await expect(
    page.getByLabel('Ethereum address', { exact: true }),
  ).toHaveAttribute('aria-invalid', 'true');
  expect(rpc).toEqual([]);
});

test('live anonymous account inspection without a wallet', async ({ page }) => {
  test.skip(process.env.LIVE_ANON_RPC !== '1', 'Real network opt-in required');
  test.setTimeout(360000);
  const forbidden: string[] = [];
  page.on('request', (request) => {
    if (
      !request.url().includes('publicnode.com') ||
      request.method() !== 'POST'
    )
      return;
    const body = request.postDataJSON() as { method?: string };
    if (body.method !== 'eth_call') forbidden.push(body.method ?? 'unknown');
  });
  await page.goto('/dashboard');
  if (process.env.LIVE_TRANSPORT === 'nox') {
    await page.goto('/privacy');
    await page
      .getByRole('combobox', { name: 'Anonymous transport' })
      .selectOption('nox');
    await page.getByRole('button', { name: 'Inspect an address' }).click();
  }
  await page
    .getByLabel('Ethereum address', { exact: true })
    .fill('0x0000000000000000000000000000000000000000');
  await page
    .getByRole('button', { name: 'Inspect anonymously', exact: true })
    .click();
  await expect(
    page.getByTestId('native-balance').or(page.getByRole('alert')),
  ).toBeVisible({ timeout: 300000 });
  await expect(page.getByTestId('native-balance')).toContainText('ETH');
  await expect(page.getByTestId('account-kind')).toContainText('EOA');
  expect(forbidden).toEqual([]);
  await page.getByText('Session address history').click();
  await expect(
    page.getByRole('button', { name: 'Clear inspection session' }),
  ).toBeVisible();
});

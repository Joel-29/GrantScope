import { expect, test } from '@playwright/test';
import { auditDirectRpc } from './rpc-audit';
test.use({
  baseURL: `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? 4174}`,
  trace: 'off',
  screenshot: 'off',
  video: 'off',
});
// Playwright can otherwise save an accessibility snapshot on failure even with
// screenshots/traces disabled. Close private pages before artifact teardown.
test.afterEach(async ({ page }) => {
  await page.close();
});
test('local configured Sepolia pair returns real state without wallet submission', async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.LIVE_LOCAL_DEMO !== '1' ||
      Boolean(process.env.PLAYWRIGHT_BASE_URL),
    'Explicit ignored local demo configuration required',
  );
  test.setTimeout(300000);
  const directTargets = auditDirectRpc(
    page,
    process.env.LIVE_TRANSPORT === 'nox' ? 'nox' : 'nym',
  );
  await page.goto('/privacy');
  if (process.env.LIVE_TRANSPORT === 'nox')
    await page
      .getByRole('combobox', { name: 'Anonymous transport' })
      .selectOption('nox');
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await page
    .getByRole('button', { name: 'Load configured Sepolia demo' })
    .click();
  const liveStatus = page.getByTestId('configured-demo-live-status');
  const failure = page
    .getByRole('region', { name: 'Local Sepolia demonstration' })
    .getByRole('alert');
  await expect(liveStatus.or(failure)).toBeVisible({
    timeout: 255000,
  });
  await expect(liveStatus).toBeVisible();
  const status = await page
    .getByTestId('configured-demo-live-status')
    .innerText();
  expect(status).toContain('18 decimals');
  expect(status).toContain('GST');
  const quantity = /Verified allowance: ([0-9.]+) ([^·]+) ·/.exec(status);
  expect(quantity).not.toBeNull();
  await testInfo.attach('sanitized-local-read-summary', {
    body: JSON.stringify({
      allowance: quantity?.[1],
      symbol: quantity?.[2]?.trim(),
      decimals: 18,
      transport: process.env.LIVE_TRANSPORT ?? 'nym',
      signed: false,
    }),
    contentType: 'application/json',
  });
  console.log(
    `Local configured pair: ${quantity?.[1]} ${quantity?.[2]?.trim()}; 18 decimals; wallet submission not requested.`,
  );
  await page
    .getByText('Unsigned revocation transaction', { exact: true })
    .click();
  await expect(
    page.getByText('No wallet signing or submission has been requested.', {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Review owner-authorized revocation' })
    .click();
  await expect(page).toHaveURL(/\/permissions\/[0-9a-f]{64}$/);
  await expect(
    page.getByRole('button', { name: 'Prepare revocation' }),
  ).toBeDisabled();
  expect(directTargets.filter((call) => !call.bootstrap)).toEqual([]);
  await page.getByRole('link', { name: 'Privacy Lab', exact: true }).click();
  await expect(
    page.getByText('0 transaction-submission requests.', { exact: false }),
  ).toBeVisible();
});

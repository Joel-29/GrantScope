import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const network = process.env.LIVE_TRANSPORT === 'nox' ? 'Nox' : 'Nym';
test(`actual ${network} worker returns a Sepolia block and balance without direct wallet RPC`, async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.LIVE_ANON_RPC !== '1',
    'Opt-in real external integration; mocks are not transport evidence.',
  );
  test.setTimeout(360_000);
  const directRpc: string[] = [];
  const badDirectMethods: string[] = [];
  page.on('request', (request) => {
    if (
      !request.url().includes('publicnode.com') ||
      request.method() !== 'POST'
    )
      return;
    const body: unknown = request.postDataJSON();
    if (body && typeof body === 'object' && 'method' in body) {
      directRpc.push(String(body.method));
      if (body.method !== 'eth_call')
        badDirectMethods.push(String(body.method));
    }
  });
  await page.goto('/privacy');
  if (network === 'Nox')
    await page
      .getByRole('combobox', { name: 'Anonymous transport' })
      .selectOption('nox');
  await page
    .getByRole('button', { name: 'Run live anonymous diagnostic' })
    .click();
  await expect(
    page.getByTestId('live-rpc-result').or(page.getByRole('alert')),
  ).toBeVisible({
    timeout: 300_000,
  });
  await expect(page.getByTestId('live-rpc-result')).toContainText(
    `Responses received via the hash-verified ${network} worker`,
  );
  expect(directRpc).toEqual(['eth_call', 'eth_call']);
  expect(badDirectMethods).toEqual([]);
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export report' }).click();
  const download = await waiting;
  const path = testInfo.outputPath('measured-live-traffic.json');
  await download.saveAs(path);
  const report = JSON.parse(await readFile(path, 'utf8')) as {
    accounting: {
      anonymousReadShare: string;
      totals: {
        read: { completed: number; anonymized: number };
        bootstrap: { completed: number };
        wallet: { completed: number };
      };
    };
    requests: { actualTransport: string; category: string }[];
  };
  expect(report.accounting.totals.read).toMatchObject({
    completed: 3,
    anonymized: 3,
  });
  expect(report.accounting.totals.bootstrap.completed).toBe(2);
  expect(report.accounting.totals.wallet.completed).toBe(0);
  expect(report.accounting.anonymousReadShare).toBe('100.0%');
  expect(
    report.requests
      .filter((row) => row.category === 'read')
      .every((row) => row.actualTransport === network.toLowerCase()),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath(`real-${network.toLowerCase()}-read.png`),
    fullPage: true,
  });
  await testInfo.attach('real-worker-response', {
    body: await page.getByTestId('live-rpc-result').innerText(),
    contentType: 'text/plain',
  });
  await page.getByRole('button', { name: 'Close worker' }).click();
});

import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test('unavailable Tor remains fail-closed and exports honest empty accounting', async ({
  page,
}, testInfo) => {
  const direct: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('publicnode.com')) direct.push(request.url());
  });
  await page.goto('/privacy');
  await page
    .getByRole('combobox', { name: 'Anonymous transport' })
    .selectOption('tor-js');
  await expect(
    page.getByRole('button', { name: 'Run live anonymous diagnostic' }),
  ).toBeDisabled();
  await expect(
    page.getByText('unavailable', { exact: true }).first(),
  ).toBeVisible();
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export report' }).click();
  const download = await waiting;
  const file = testInfo.outputPath('sanitized-empty.json');
  await download.saveAs(file);
  const report = JSON.parse(await readFile(file, 'utf8')) as {
    worker: { state: string };
    accounting: {
      anonymousReadShare: string | null;
      totals: { read: { completed: number } };
    };
    requests: unknown[];
  };
  expect(report.worker.state).toBe('unavailable');
  expect(report.accounting.anonymousReadShare).toBeNull();
  expect(report.accounting.totals.read.completed).toBe(0);
  expect(report.requests).toEqual([]);
  expect(direct).toEqual([]);
});

import { expect, test } from '@playwright/test';
test('wallet rejection stays rejected and never creates transaction success', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'ethereum', {
      value: {
        request: async () => {
          throw { code: 4001 };
        },
      },
      configurable: true,
    });
  });
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Connect signing wallet' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Wallet connection rejected.',
  );
  await page.getByRole('button', { name: 'Open transaction activity' }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: 'No transaction activity' }),
  ).toBeVisible();
  await expect(page.getByText('Allowance verified zero')).toHaveCount(0);
});

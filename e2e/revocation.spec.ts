import { expect, test } from '@playwright/test';
test('mock wallet setup explains an unsupported network without automatic wallet or blockchain requests', async ({
  page,
}) => {
  await page.addInitScript(() => {
    let chain = '0x14a34';
    const methods: string[] = [];
    const listeners = new Map<string, (...args: unknown[]) => void>();
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: {
        request: async ({ method }: { method: string }) => {
          methods.push(method);
          if (method === 'eth_chainId') return chain;
          if (method === 'eth_accounts' || method === 'eth_requestAccounts')
            return ['0x0000000000000000000000000000000000000001'];
          throw new Error('Unexpected test wallet method');
        },
        on: (name: string, fn: (...args: unknown[]) => void) =>
          listeners.set(name, fn),
        removeListener: (name: string) => listeners.delete(name),
      },
    });
    (window as unknown as { mockWallet: unknown }).mockWallet = {
      methods,
      switchChain: () => {
        chain = '0xaa36a7';
        listeners.get('chainChanged')?.(chain);
      },
    };
  });
  const directRpc: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('publicnode.com'))
      directRpc.push(request.method());
  });
  await page.goto('/settings');
  await expect(
    page.getByRole('button', { name: 'Connect signing wallet' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { mockWallet: { methods: string[] } }).mockWallet
          .methods,
    ),
  ).toEqual([]);
  await page.getByRole('button', { name: 'Connect signing wallet' }).click();
  await expect(
    page.getByText('Choose a supported wallet network'),
  ).toBeVisible();
  await expect(
    page.getByText(/Wallet network: Unsupported network \(84532\)/),
  ).toBeVisible();
  await expect(
    page.getByText('Select the inspected owner first'),
  ).toBeVisible();
  await page.evaluate(() =>
    (
      window as unknown as { mockWallet: { switchChain(): void } }
    ).mockWallet.switchChain(),
  );
  await expect(
    page.getByText(/Wallet network: Ethereum Sepolia \(11155111\)/),
  ).toBeVisible();
  await expect(page.getByText('Choose a supported wallet network')).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { mockWallet: { methods: string[] } }).mockWallet
          .methods,
    ),
  ).toEqual(['eth_requestAccounts', 'eth_accounts', 'eth_chainId']);
  expect(directRpc).toEqual([]);
});
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

// Compare raw and managed requests on the same real Nym worker; no mocks.
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4174/');
  const result = await page.evaluate(async () => {
    const { AnonRpcWorker } =
      await import('/node_modules/@anon-rpc/browser-harness/dist/host.js');
    const { AnonRpcManager } =
      await import('/src/features/anon-rpc/AnonRpcManager.ts');
    let worker;
    const manager = new AnonRpcManager((init) => {
      worker = new AnonRpcWorker(init);
      return worker;
    });
    const result = [];
    try {
      await manager.initialize();
      for (const mode of ['direct', 'manager', 'direct', 'manager']) {
        try {
          const value =
            mode === 'manager'
              ? await manager.request(11155111, 'eth_blockNumber')
              : await (
                  await worker.fetch(
                    'https://ethereum-sepolia-rpc.publicnode.com',
                    {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 100,
                        method: 'eth_blockNumber',
                        params: [],
                      }),
                      signal: AbortSignal.timeout(30000),
                    },
                  )
                ).json();
          result.push({ mode, value });
        } catch (error) {
          result.push({ mode, error: String(error) });
        }
      }
      return { result, metrics: manager.getSnapshot().metrics };
    } finally {
      manager.close();
    }
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}

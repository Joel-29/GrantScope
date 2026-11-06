// Independent live network investigation; not a direct wallet-query fallback.
import { chromium } from '@playwright/test';
import { toFunctionSelector } from 'viem';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4174/');
  const result = await page.evaluate(
    async ({ selectors, nox }) => {
      const { AnonRpcWorker } =
        await import('/node_modules/@anon-rpc/browser-harness/dist/host.js');
      const specifier = nox
        ? '0x35133267A8F7EC35046a83DCA0f4Ca8A6e1b7A9A'
        : '0x3aCD9742C68F6d993066Ae25533e09b9e1f60eD0';
      const bootstrap = [];
      let id = 0;
      const worker = new AnonRpcWorker({
        address: specifier,
        preExisting: {
          rpcProvider: {
            request: async (args) => {
              if (
                args.method !== 'eth_call' ||
                args.params?.[0]?.to?.toLowerCase() !==
                  specifier.toLowerCase() ||
                !selectors.includes(args.params?.[0]?.data) ||
                args.params?.[1] !== 'latest'
              )
                throw new Error('Refuse non-specifier bootstrap');
              bootstrap.push(args.method);
              const response = await fetch(
                nox
                  ? 'https://ethereum-sepolia-rpc.publicnode.com'
                  : 'https://ethereum-rpc.publicnode.com',
                {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ jsonrpc: '2.0', id: ++id, ...args }),
                },
              );
              const body = await response.json();
              if (body.error) throw new Error('Bootstrap RPC error');
              return body.result;
            },
          },
        },
      });
      const logs = [];
      void (async () => {
        try {
          for (;;) {
            const log = await worker.acceptLog();
            if (logs.length < 10) logs.push(log.level);
          }
        } catch {
          /* closed */
        }
      })();
      let timer;
      try {
        return await Promise.race([
          (async () => {
            await worker.ready;
            const values = [];
            for (const [method, params] of [
              ['eth_chainId', []],
              ['eth_blockNumber', []],
              [
                'eth_getBalance',
                ['0x0000000000000000000000000000000000000000', 'latest'],
              ],
            ]) {
              const response = await worker.fetch(
                'https://ethereum-sepolia-rpc.publicnode.com',
                {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: ++id,
                    method,
                    params,
                  }),
                  signal: AbortSignal.timeout(30000),
                },
              );
              values.push({
                method,
                status: response.status,
                response: await response.json(),
              });
            }
            return { success: true, bootstrap, values };
          })(),
          new Promise((_, reject) => {
            timer = setTimeout(
              () => reject(new Error('Nym readiness/request timeout')),
              90000,
            );
          }),
        ]);
      } catch (error) {
        return {
          success: false,
          error: String(error),
          bootstrap,
          startupLogLevels: logs,
        };
      } finally {
        clearTimeout(timer);
        worker.close();
      }
    },
    {
      nox: process.argv.includes('--nox'),
      selectors: [
        toFunctionSelector('workerHash()'),
        toFunctionSelector('workerResolvers()'),
      ],
    },
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}

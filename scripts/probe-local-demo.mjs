import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Local public configuration only. Never log addresses, calldata or raw errors.
const entries = Object.fromEntries(
  (await readFile('.env.local', 'utf8'))
    .split(/\r?\n/)
    .filter((line) => /^VITE_DEMO_(OWNER|TOKEN|SPENDER)=/.test(line))
    .map((line) => [
      line.slice(0, line.indexOf('=')),
      line.slice(line.indexOf('=') + 1).trim(),
    ]),
);
const input = {
  owner: entries.VITE_DEMO_OWNER,
  token: entries.VITE_DEMO_TOKEN,
  spender: entries.VITE_DEMO_SPENDER,
  transport: process.env.LIVE_TRANSPORT === 'nox' ? 'nox' : 'nym',
  allowanceOnly: process.argv.includes('--allowance-only'),
};
if (
  ![input.owner, input.token, input.spender].every((value) =>
    /^0x[0-9a-f]{40}$/i.test(value ?? ''),
  )
)
  throw new Error(
    'Ignored local public demo configuration is missing or invalid',
  );
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
});
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4174/privacy');
  await page.exposeFunction('reportPhase', (phase) =>
    console.log(`Worker state: ${phase}`),
  );
  const result = await page.evaluate(async (input) => {
    const { anonRpc } = await import('/src/features/anon-rpc/runtime.ts');
    const { scanAllowances } = await import('/src/features/erc20/engine.ts');
    const { tokenAmount } = await import('/src/features/erc20/amounts.ts');
    anonRpc.selectTransport(input.transport);
    const manager = anonRpc.current();
    let last = '';
    const off = manager.subscribe(() => {
      const phase = manager.getSnapshot().phase;
      if (phase !== last) {
        last = phase;
        void globalThis.reportPhase(phase);
      }
    });
    try {
      if (input.allowanceOnly) {
        const { encodeFunctionData, decodeFunctionResult } =
          await import('/node_modules/.vite/deps/viem.js');
        const { erc20Abi } = await import('/src/lib/abi/erc20.ts');
        await manager.initialize();
        const chain = await manager.request(11155111, 'eth_chainId');
        if (chain !== '0xaa36a7') throw new Error('Wrong chain');
        const block = await manager.request(11155111, 'eth_blockNumber');
        const read = async (functionName, args) => {
          const data = encodeFunctionData({
            abi: erc20Abi,
            functionName,
            ...(args ? { args } : {}),
          });
          const result = await manager.request(11155111, 'eth_call', [
            { to: input.token, data },
            block,
          ]);
          return decodeFunctionResult({
            abi: erc20Abi,
            functionName,
            data: result,
          });
        };
        const amount = await read('allowance', [input.owner, input.spender]),
          decimals = await read('decimals'),
          symbol = await read('symbol');
        return {
          ok: true,
          symbol,
          decimals,
          allowance: tokenAmount(amount, decimals),
          rawUnits: amount.toString(),
          transport: manager.transport,
          partialProof: true,
          balanceVerified: false,
          methods: manager
            .getSnapshot()
            .metrics.map(({ method, outcome, durationMs, anonymized }) => ({
              method,
              outcome,
              durationMs,
              anonymized,
            })),
          submitted: false,
        };
      }
      const scan = await scanAllowances(
        manager,
        input.owner,
        11155111,
        [{ token: input.token, spender: input.spender, source: 'manual' }],
        { signal: AbortSignal.timeout(120000) },
      );
      const row = scan.rows[0];
      return {
        ok: Boolean(row),
        symbol: row?.symbol,
        decimals: row?.decimals,
        allowance: row ? tokenAmount(row.amount, row.decimals) : null,
        rawUnits: row?.amount.toString(),
        failedPairs: scan.failures.length,
        transport: manager.transport,
        methods: manager
          .getSnapshot()
          .metrics.map(({ method, outcome, durationMs, anonymized }) => ({
            method,
            outcome,
            durationMs,
            anonymized,
          })),
        submitted: false,
      };
    } catch (error) {
      return {
        ok: false,
        errorType: error?.name ?? 'Unknown',
        error: String(error?.message ?? 'Unknown failure')
          .slice(0, 600)
          .replace(/https?:\/\/[^\s;)]+/g, '[resource]')
          .replace(/0x[0-9a-f]{8,}/gi, '[hex]'),
        rpcCode:
          typeof error?.code === 'number' ||
          (typeof error?.code === 'string' &&
            /^[A-Z0-9_:-]{1,80}$/.test(error.code))
            ? error.code
            : null,
        transport: manager.transport,
        methods: manager
          .getSnapshot()
          .metrics.map(({ method, outcome, durationMs, anonymized }) => ({
            method,
            outcome,
            durationMs,
            anonymized,
          })),
        submitted: false,
      };
    } finally {
      off();
      manager.close();
    }
  }, input);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
} finally {
  await browser.close();
}

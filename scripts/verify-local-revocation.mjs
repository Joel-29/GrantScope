import { mkdir, writeFile } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { chromium } from 'playwright';
import { localRevocationInput } from './release-checks.mjs';

// Local-only proof: never capture screens, traces, wallet credentials or request payloads.
let browser;
try {
  const input = localRevocationInput(
    loadEnv('development', process.cwd(), 'VITE_DEMO_'),
    process.env,
  );
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4174/privacy');
  const proof = await page.evaluate(async (input) => {
    const { anonRpc } = await import('/src/features/anon-rpc/runtime.ts');
    const { scanAllowances } = await import('/src/features/erc20/engine.ts');
    const { parseAddress } = await import('/src/features/wallet/address.ts');
    const { rpcQuantity } =
      await import('/src/features/anon-rpc/JsonRpcAdapter.ts');
    const { hash32 } = await import('/src/features/discovery/logs.ts');
    const { revocationIntent, verifyRevocation } =
      await import('/src/features/revocation/engine.ts');
    anonRpc.selectTransport(input.transport);
    const manager = anonRpc.current();
    const signal = AbortSignal.timeout(240000);
    try {
      const owner = parseAddress(input.owner),
        token = parseAddress(input.token),
        spender = parseAddress(input.spender);
      const scan = await scanAllowances(
        manager,
        owner,
        11155111,
        [{ token, spender, source: 'manual' }],
        { signal },
      );
      const record = scan.rows[0];
      if (!record || scan.failures.length)
        throw new Error('Configured pair was unreadable');
      const hash = hash32(input.hash);
      const tx = await manager.request(
        11155111,
        'eth_getTransactionByHash',
        [hash],
        signal,
      );
      const raw = await manager.request(
        11155111,
        'eth_getTransactionReceipt',
        [hash],
        signal,
      );
      if (!tx || !raw || typeof tx !== 'object' || typeof raw !== 'object')
        throw new Error('Transaction or receipt is unavailable');
      if (hash32(raw.transactionHash) !== hash)
        throw new Error('Receipt does not match the supplied transaction');
      if (rpcQuantity(raw.status) !== 1n)
        throw new Error('Transaction receipt did not succeed');
      // Verification consumes only these fields; all come from actual state/transaction data.
      const prepared = {
        record,
        intent: revocationIntent(record),
        nonce: rpcQuantity(tx.nonce),
      };
      const result = await verifyRevocation(
        manager,
        prepared,
        {
          transactionHash: hash32(raw.transactionHash),
          status: 'success',
          blockNumber: rpcQuantity(raw.blockNumber),
          blockHash: hash32(raw.blockHash),
        },
        signal,
      );
      const metrics = manager.getSnapshot().metrics;
      return {
        chainId: 11155111,
        verifiedZero: true,
        verifiedBlock: result.blockNumber.toString(),
        transactionHash: result.hash,
        transport: manager.transport,
        checkedAt: new Date().toISOString(),
        anonymousSuccessfulReads: metrics.filter(
          (row) => row.category === 'read' && row.anonymized,
        ).length,
        directBootstrapCalls: metrics.filter(
          (row) => row.category === 'bootstrap',
        ).length,
        walletSubmissions: 0,
      };
    } finally {
      manager.close();
    }
  }, input);
  await mkdir('.npm-cache/release', { recursive: true });
  await writeFile(
    '.npm-cache/release/verified-revocation.json',
    JSON.stringify(proof, null, 2) + '\n',
  );
  // Do not print the hash: it would reveal the private demonstration identities.
  const { transactionHash, ...summary } = proof;
  void transactionHash;
  console.log(JSON.stringify({ ...summary, privateProofSaved: true }, null, 2));
} catch (error) {
  const message = String(
    error instanceof Error ? error.message : 'Private verification failed',
  )
    .slice(0, 500)
    .replace(/0x[0-9a-f]{8,}/gi, '[private hex]')
    .replace(/https?:\/\/[^\s;)]+/g, '[resource]');
  console.error(message);
  process.exitCode = 1;
} finally {
  await browser?.close();
}

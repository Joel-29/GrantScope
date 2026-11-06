import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import {
  demoOptions,
  directRpcRows,
  safeDemoError,
  trafficSummary,
} from './demo-checks.mjs';

let browser, page, options;
const report = {
  checkedAt: new Date().toISOString(),
  steps: [],
  hosts: {},
  directRpc: [],
  walletConnected: false,
  transactionSubmitted: false,
  ownerSigning: 'NOT RUN',
  hostedDeploymentVerification:
    'NOT RUN; separate route/header verification required',
};
const step = (name, passed, evidence) => {
  report.steps.push({ name, status: passed ? 'PASS' : 'FAIL', evidence });
  console.error(`${passed ? 'PASS' : 'FAIL'}: ${name}`);
  if (!passed) throw new Error(evidence);
};
async function exportedTraffic() {
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export report' }).click();
  const stream = await (await waiting).createReadStream();
  let body = '';
  for await (const chunk of stream) body += chunk;
  return trafficSummary(JSON.parse(body));
}
try {
  options = demoOptions(process.argv.slice(2));
  report.transport = options.transport;
  report.localConfiguredDemo = options.local;
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
  });
  const context = await browser.newContext({ acceptDownloads: true });
  page = await context.newPage();
  // Library mode has no automatic test-runner screenshots, traces or error snapshots.
  page.on('request', (request) => {
    const url = new URL(request.url()),
      host = url.host || url.protocol;
    report.hosts[host] = (report.hosts[host] ?? 0) + 1;
    if (request.method() !== 'POST') return;
    let body;
    try {
      body = request.postDataJSON();
    } catch {
      return;
    }
    report.directRpc.push(
      ...directRpcRows(request.url(), body, options.transport),
    );
  });
  await page.goto(options.origin + '/privacy');
  await page
    .getByRole('combobox', { name: 'Anonymous transport' })
    .selectOption(options.transport);
  const began = Date.now();
  console.error(
    `Starting actual ${options.transport} diagnostic; no fallback or wallet authorization.`,
  );
  await page
    .getByRole('button', { name: 'Run live anonymous diagnostic' })
    .click();
  await page
    .getByTestId('live-rpc-result')
    .or(page.getByRole('alert'))
    .waitFor({ timeout: 300000 });
  const success = (await page.getByTestId('live-rpc-result').count()) > 0;
  report.diagnosticSeconds = Math.round((Date.now() - began) / 100) / 10;
  report.traffic = await exportedTraffic();
  const failure = (await page.getByRole('alert').allTextContents()).join(' ');
  step(
    'real anonymous diagnostic',
    success,
    success
      ? 'Actual Sepolia chain, block and zero-address balance returned'
      : safeDemoError(failure),
  );
  step(
    'diagnostic read accounting',
    report.traffic.read.completed === 3 &&
      report.traffic.read.anonymized === 3 &&
      report.traffic.worker.transport === options.transport,
    'Three actual responses must be counted through the selected worker',
  );
  if (options.local) {
    await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
    const loader = page.getByRole('button', {
      name: 'Load configured Sepolia demo',
    });
    try {
      await loader.waitFor({ timeout: 15000 });
    } catch {
      throw new Error(
        'Local demo loader unavailable: use a development server with ignored local configuration',
      );
    }
    const scanBegan = Date.now();
    await loader.click();
    const panel = page.getByRole('region', {
        name: 'Local Sepolia demonstration',
      }),
      status = page.getByTestId('configured-demo-live-status');
    await status.or(panel.getByRole('alert')).waitFor({ timeout: 255000 });
    const found = (await status.count()) > 0;
    step(
      'actual configured allowance',
      found,
      'Configured pair must return real allowance state; failure is never treated as zero',
    );
    report.scanSeconds = Math.round((Date.now() - scanBegan) / 100) / 10;
    const raw = /Raw units\s+([0-9]+)/.exec(await status.innerText())?.[1];
    report.allowanceUnits = raw;
    step(
      'positive demo grant',
      !!raw && BigInt(raw) > 0n,
      'Live allowance must be positive for the revocation demonstration',
    );
    // Retain no token, owner or spender strings, even in the sanitized tool report.
    await panel.locator('details.permission-record summary').click();
    const block = await panel
      .locator('dt')
      .filter({ hasText: 'Verified block' })
      .locator('..')
      .locator('dd')
      .innerText();
    step(
      'verified read block',
      /^\d+$/.test(block),
      'Actual permission read block must be displayed',
    );
    report.readBlock = block;
    for (const field of ['Token', 'Spender']) {
      const value = await panel
        .locator('dt')
        .filter({ hasText: new RegExp(`^${field}$`) })
        .locator('..')
        .locator('dd')
        .innerText();
      step(
        `displayed ${field.toLowerCase()}`,
        /^0x[0-9a-f]{40}$/i.test(value),
        'Actual token and spender addresses must be displayed locally',
      );
    }
    await page
      .getByTestId('native-balance')
      .or(page.getByRole('alert'))
      .waitFor({ timeout: 90000 });
    step(
      'anonymous account inspection',
      (await page.getByTestId('native-balance').count()) > 0 &&
        (await page.getByTestId('account-kind').count()) > 0,
      'Actual ETH balance and bytecode-based account type must be displayed',
    );
    await panel
      .getByText('Unsigned revocation transaction', { exact: true })
      .click();
    const calldata = /Calldata:\s*(0x[0-9a-f]+)/i.exec(
      await panel.innerText(),
    )?.[1];
    step(
      'unsigned zeroing intent',
      !!calldata && /^0x095ea7b3[0-9a-f]{64}0{64}$/i.test(calldata),
      'Unsigned transaction must encode approve(spender, 0); it is never submitted',
    );
    await page
      .getByRole('link', { name: 'Review owner-authorized revocation' })
      .click();
    await page.waitForURL(/\/permissions\/[0-9a-f]{64}$/, { timeout: 15000 });
    step(
      'opaque permission URL',
      /^\/permissions\/[0-9a-f]{64}$/.test(new URL(page.url()).pathname),
      'Permission URLs must not contain inspected addresses',
    );
    await page
      .getByRole('heading', { name: 'Permission details', exact: true })
      .waitFor();
    step(
      'disconnected signing guard',
      await page
        .getByRole('button', { name: 'Prepare revocation', exact: true })
        .isDisabled(),
      'Revocation must remain disabled without a connected owner',
    );
    const deep = await context.newPage();
    await deep.goto(page.url());
    await deep
      .getByRole('heading', { name: 'Permission unavailable', exact: true })
      .waitFor();
    await deep.close();
    step(
      'unverified deep link',
      true,
      'A new session does not synthesize a verified grant from its URL',
    );
    await page.getByRole('link', { name: 'Privacy Lab', exact: true }).click();
    report.traffic = await exportedTraffic();
  }
  step(
    'no direct target RPC',
    report.directRpc.every((row) => row.bootstrap),
    'Only fixed selected-worker bootstrap calls may go directly to RPC',
  );
  step(
    'no wallet API calls',
    report.traffic.wallet.completed === 0 &&
      report.traffic.walletSubmissions === 0,
    'This rehearsal must not connect a wallet, sign or submit',
  );
  report.readOnlyRehearsal = 'PASS';
} catch (error) {
  report.readOnlyRehearsal = 'FAIL';
  report.error = safeDemoError(error);
  process.exitCode = 1;
  // Preserve settled reads from later stages even when a UI assertion fails.
  if (page && options) {
    try {
      if (new URL(page.url()).pathname !== '/privacy') {
        await page
          .getByRole('link', { name: 'Privacy Lab', exact: true })
          .click();
        await page
          .getByRole('heading', { name: 'Privacy Lab', exact: true })
          .waitFor();
      }
      report.traffic = await exportedTraffic();
    } catch {
      /* A disconnected browser may no longer export its ledger. */
    }
  }
} finally {
  if (page && options) {
    try {
      await page
        .getByRole('button', { name: 'Close worker', exact: true })
        .click({ timeout: 3000 });
    } catch {
      /* Browser closure also releases its workers. */
    }
  }
  await browser?.close();
  try {
    const directory = join('.npm-cache', 'demo-rehearsals');
    await mkdir(directory, { recursive: true });
    const path = join(directory, `${randomUUID()}.json`);
    await writeFile(path, JSON.stringify(report, null, 2) + '\n');
    report.sanitizedEvidenceFile = path;
  } catch {
    report.evidenceSave = 'FAIL: could not save the sanitized rehearsal report';
    process.exitCode = 1;
  }
  console.log(JSON.stringify(report, null, 2));
}

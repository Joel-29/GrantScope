import assert from 'node:assert/strict';
import test from 'node:test';
import {
  demoOptions,
  directRpcRows,
  safeDemoError,
  trafficSummary,
} from './demo-checks.mjs';

test('demo rehearsal is primary-Nym by default and never accepts a direct or passthrough transport', () => {
  assert.deepEqual(demoOptions([]), {
    origin: 'http://127.0.0.1:5173',
    transport: 'nym',
    local: false,
  });
  assert.equal(demoOptions(['--transport', 'nox']).transport, 'nox');
  for (const value of ['passthrough', 'direct', 'invalid'])
    assert.throws(() => demoOptions(['--transport', value]));
});
test('private configured checks cannot be run on a hosted origin or credential-bearing URL', () => {
  assert.equal(demoOptions(['--local']).local, true);
  assert.equal(
    demoOptions(['--url', 'https://grantscope.example']).origin,
    'https://grantscope.example',
  );
  for (const args of [
    ['--local', '--url', 'https://grantscope.example'],
    ['--url', 'http://grantscope.example'],
    ['--url', 'https://user:secret@grantscope.example'],
    ['--url', 'https://grantscope.example?owner=private'],
    ['--url', 'https://grantscope.example/privacy'],
    ['--transport', 'nym', '--transport', 'nox'],
    ['--unknown'],
  ])
    assert.throws(() => demoOptions(args));
});
test('traffic accounting accepts normalized fixed bootstrap roots and refuses target reads and batches', () => {
  const url = 'https://ethereum-rpc.publicnode.com/';
  const value = {
    method: 'eth_call',
    params: [
      { to: '0x3acd9742c68f6d993066ae25533e09b9e1f60ed0', data: '0x3898587d' },
      'latest',
    ],
  };
  assert.equal(directRpcRows(url, value, 'nym')[0].bootstrap, true);
  const rows = directRpcRows(
    url,
    [value, { method: 'eth_getBalance', params: ['never-retain-me'] }],
    'nym',
  );
  assert.deepEqual(
    rows.map((row) => row.bootstrap),
    [true, false],
  );
  assert.equal(JSON.stringify(rows).includes('never-retain-me'), false);
  assert.equal(
    directRpcRows('https://unexpected.example/', value, 'nym')[0].bootstrap,
    false,
  );
});
test('public errors and traffic summaries omit identities, hashes, raw payloads and unexpected export fields', () => {
  const address = '0x' + '12'.repeat(20),
    hash = '0x' + '34'.repeat(32);
  const message = safeDemoError(
    new Error(
      `Failed ${address} ${hash} https://example.com/?secret=credential`,
    ),
  );
  for (const secret of [address, hash, 'credential'])
    assert.equal(message.includes(secret), false);
  assert.equal(
    safeDemoError('x'.repeat(990) + address).includes(address.slice(0, 10)),
    false,
  );
  const counts = {
    completed: 1,
    successful: 1,
    failed: 0,
    cancelled: 0,
    anonymized: 1,
    owner: address,
  };
  const summary = trafficSummary({
    worker: {
      transport: 'nym',
      state: 'ready',
      successfulResponses: 1,
      readState: 'successful',
      owner: address,
    },
    accounting: {
      anonymousReadShare: '100.0%',
      totals: {
        read: counts,
        bootstrap: counts,
        wallet: counts,
        walletSubmissions: 0,
      },
    },
    requests: [{ hash, params: [address] }],
  });
  assert.equal(JSON.stringify(summary).includes(address), false);
  assert.equal(JSON.stringify(summary).includes(hash), false);
  assert.equal('requests' in summary, false);
});

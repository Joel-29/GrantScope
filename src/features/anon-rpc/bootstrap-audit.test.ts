import { describe, expect, it } from 'vitest';
import { classifyDirectRpc } from '../../../e2e/rpc-audit';
import {
  READ_NETWORKS,
  WORKERS,
  type AnonymousTransport,
} from './transportRegistry';
import { toFunctionSelector } from 'viem';

const call = (transport: AnonymousTransport) => ({
  jsonrpc: '2.0',
  id: 1,
  method: 'eth_call',
  params: [
    {
      to: WORKERS[transport].specifier,
      data: toFunctionSelector('workerHash()'),
    },
    'latest',
  ],
});

describe('real browser direct-RPC evidence boundaries', () => {
  it('accepts browser-normalized root URLs for both documented bootstrap chains', () => {
    for (const transport of ['nym', 'nox'] as const) {
      const url = READ_NETWORKS[WORKERS[transport].bootstrapChainId].rpc;
      expect(classifyDirectRpc(url + '/', call(transport), transport)).toEqual([
        { method: 'eth_call', bootstrap: true },
      ]);
      expect(classifyDirectRpc(url, call(transport), transport)).toEqual([
        { method: 'eth_call', bootstrap: true },
      ]);
    }
  });
  it('refuses an arbitrary contract read, wrong endpoint and caller-supplied account fields', () => {
    const url = READ_NETWORKS[1].rpc;
    const value = call('nym');
    const item = value.params[0] as { to: string; data: string };
    for (const [target, params] of [
      [
        url,
        [
          { ...item, to: '0x0000000000000000000000000000000000000001' },
          'latest',
        ],
      ],
      [
        url,
        [
          { ...item, from: '0x0000000000000000000000000000000000000001' },
          'latest',
        ],
      ],
      [url, [{ ...item, data: '0x12345678' }, 'latest']],
      [url, [item, 'pending']],
      [url + '?api=unexpected', value.params],
      [READ_NETWORKS[11155111].rpc, value.params],
    ] as const) {
      expect(classifyDirectRpc(target, { ...value, params }, 'nym')).toEqual([
        { method: 'eth_call', bootstrap: false },
      ]);
    }
  });
  it('detects direct address/log/block reads inside a batch without retaining their parameters', () => {
    const rows = classifyDirectRpc(
      READ_NETWORKS[1].rpc,
      [
        call('nym'),
        ...['eth_getBalance', 'eth_getLogs', 'eth_blockNumber'].map(
          (method) => ({ method, params: ['never-retain-this'] }),
        ),
      ],
      'nym',
    );
    expect(rows.map((row) => row.bootstrap)).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect(JSON.stringify(rows)).not.toContain('never-retain-this');
  });
});

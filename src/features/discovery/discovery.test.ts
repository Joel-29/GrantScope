import { describe, expect, it } from 'vitest';
import { pad } from 'viem';
import { mockRpc } from '../../test/mockRpc';
import {
  APPROVAL_TOPIC,
  approvalPair,
  discoverApprovals,
} from './approvalDiscovery';
import { pagedLogs, logValue } from './logs';

const owner = '0x0000000000000000000000000000000000000000';
const token = '0x0000000000000000000000000000000000000001';
const hash = `0x${'ab'.repeat(32)}`;
const event = {
  address: token,
  topics: [APPROVAL_TOPIC, pad(owner), pad(token)],
  data: pad('0x01'),
  blockNumber: '0x10',
  blockHash: hash,
  transactionHash: hash,
  logIndex: '0x0',
  removed: false,
};
describe('bounded Approval discovery', () => {
  it('accepts canonical ERC-20 shape and rejects ERC-721, wrong owner, dirty topics and malformed data', () => {
    expect(approvalPair(logValue(event), owner)).toMatchObject({
      token,
      spender: token,
      source: 'event',
    });
    expect(
      approvalPair(
        logValue({
          ...event,
          topics: [...event.topics, pad('0x01')],
          data: '0x',
        }),
        owner,
      ),
    ).toBeNull();
    expect(
      approvalPair(
        logValue({
          ...event,
          topics: [APPROVAL_TOPIC, pad(token), pad(token)],
        }),
        owner,
      ),
    ).toBeNull();
    expect(() => logValue({ ...event, logIndex: '0x01' })).toThrow();
  });
  it('shrinks rejected ranges, covers exact pages and deduplicates events', async () => {
    const { manager, calls } = mockRpc((call) => {
      const f = call.params[0] as { fromBlock: string; toBlock: string };
      if (BigInt(f.toBlock) - BigInt(f.fromBlock) > 1n)
        throw new Error('range limit');
      return BigInt(f.fromBlock) === 16n ? [event, event] : [];
    });
    await manager.initialize();
    const r = await pagedLogs(
      manager,
      11155111,
      { topics: [APPROVAL_TOPIC, pad(owner)] },
      16n,
      19n,
      { chunk: 4n },
    );
    expect(r.logs).toHaveLength(1);
    expect(r.gaps).toEqual([]);
    expect(r.covered).toEqual([
      { from: 16n, to: 17n },
      { from: 18n, to: 19n },
    ]);
    expect(calls).toHaveLength(3);
    manager.close();
  });
  it('retains holes and bounds permanently refused providers', async () => {
    const { manager } = mockRpc(() => {
      throw new Error('refused');
    });
    await manager.initialize();
    const r = await pagedLogs(
      manager,
      11155111,
      { topics: [APPROVAL_TOPIC] },
      0n,
      99n,
      { maxRequests: 4, chunk: 4n },
    );
    expect(r.requests).toBe(4);
    expect(r.gaps.length).toBeGreaterThan(0);
    expect(r.warnings.length).toBeGreaterThan(0);
    manager.close();
  });
  it('discards candidates when the range anchor changes during scanning', async () => {
    let headers = 0;
    const { manager } = mockRpc((call) => {
      if (call.method === 'eth_chainId') return '0xaa36a7';
      if (call.method === 'eth_blockNumber') return '0x30';
      if (call.method === 'eth_getLogs') return [event];
      return {
        number: '0x10',
        hash: ++headers < 3 ? hash : `0x${'cd'.repeat(32)}`,
        timestamp: '0x100',
      };
    });
    const r = await discoverApprovals(manager, owner, 11155111, {
      from: 16n,
      to: 16n,
    });
    expect(r.reorg).toBe(true);
    expect(r.candidates).toEqual([]);
    manager.close();
  });
  it('verifies canonical event blocks, records observed event time, and never claims historical exhaustiveness', async () => {
    const { manager, direct } = mockRpc((call) =>
      call.method === 'eth_chainId'
        ? '0xaa36a7'
        : call.method === 'eth_blockNumber'
          ? '0x30'
          : call.method === 'eth_getLogs'
            ? [event]
            : { number: '0x10', hash, timestamp: '0x100' },
    );
    const r = await discoverApprovals(manager, owner, 11155111, {
      from: 16n,
      to: 16n,
    });
    expect(r.candidates[0]?.observedAt).toBe(256n);
    expect(r.completeRange).toBe(true);
    expect(direct).not.toHaveBeenCalled();
    manager.close();
  });
});

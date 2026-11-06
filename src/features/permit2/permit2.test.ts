import { describe, expect, it } from 'vitest';
import {
  decodeFunctionData,
  encodeEventTopics,
  encodeAbiParameters,
  encodeFunctionResult,
  type Hex,
} from 'viem';
import { decodePermit2Allowance, permit2Abi } from '../../lib/abi/permit2';
import { erc20Abi } from '../../lib/abi/erc20';
import { mockRpc } from '../../test/mockRpc';
import { PERMIT2_ADDRESS } from '../../data/spenders';
import { logValue } from '../discovery/logs';
import { inspectPermit2, knownPermit2Pairs, permitEventPair } from './engine';
const owner = '0x0000000000000000000000000000000000000000';
const pair = knownPermit2Pairs(11155111)[0]!;
const max160 = (1n << 160n) - 1n;
describe('official Permit2 AllowanceTransfer', () => {
  it('rejects out-of-width ABI words for each stored allowance field', () => {
    for (const values of [
      [1n << 160n, 0n, 0n],
      [0n, 1n << 48n, 0n],
      [0n, 0n, 1n << 48n],
    ] as const) {
      const malformed = encodeAbiParameters(
        [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }],
        values,
      );
      expect(() => decodePermit2Allowance(malformed)).toThrow('Noncanonical');
    }
  });
  it('decodes official Permit and Approval events and rejects foreign emitters', () => {
    for (const eventName of ['Permit', 'Approval'] as const) {
      const topics = encodeEventTopics({
        abi: permit2Abi,
        eventName,
        args: { owner, token: pair.token, spender: pair.spender },
      });
      const data =
        eventName === 'Permit'
          ? encodeAbiParameters(
              [{ type: 'uint160' }, { type: 'uint48' }, { type: 'uint48' }],
              [max160, 100, 7],
            )
          : encodeAbiParameters(
              [{ type: 'uint160' }, { type: 'uint48' }],
              [max160, 100],
            );
      const log = logValue({
        address: PERMIT2_ADDRESS,
        topics,
        data,
        blockNumber: '0x10',
        blockHash: `0x${'ab'.repeat(32)}`,
        transactionHash: `0x${'ab'.repeat(32)}`,
        logIndex: '0x0',
        removed: false,
      });
      expect(permitEventPair(log, owner)).toMatchObject({
        ...pair,
        source: 'event',
      });
      expect(permitEventPair({ ...log, address: owner }, owner)).toBeNull();
    }
  });
  it('reads exact uint160/uint48 state and shares the actual underlying approval without adding exposure', async () => {
    const { manager, calls, direct } = mockRpc((call) => {
      if (call.method === 'eth_chainId') return '0xaa36a7';
      if (call.method === 'eth_blockNumber') return '0x10';
      if (call.method === 'eth_getBlockByNumber')
        return {
          number: '0x10',
          hash: `0x${'ab'.repeat(32)}`,
          timestamp: '0x64',
        };
      if (call.method === 'eth_getCode') return '0x6000';
      const target = call.params[0] as { to: string; data: Hex };
      if (target.to === PERMIT2_ADDRESS)
        return encodeFunctionResult({
          abi: permit2Abi,
          functionName: 'allowance',
          result: [max160, 100, 2 ** 48 - 1],
        });
      const { functionName } = decodeFunctionData({
        abi: erc20Abi,
        data: target.data,
      });
      if (functionName === 'symbol')
        return encodeFunctionResult({
          abi: erc20Abi,
          functionName,
          result: 'USDC',
        });
      if (functionName === 'name')
        return encodeFunctionResult({
          abi: erc20Abi,
          functionName,
          result: 'USD Coin',
        });
      if (functionName === 'decimals')
        return encodeFunctionResult({ abi: erc20Abi, functionName, result: 6 });
      return encodeFunctionResult({
        abi: erc20Abi,
        functionName: 'allowance',
        result: functionName === 'balanceOf' ? 100n : 0n,
      });
    });
    const result = await inspectPermit2(manager, owner, 11155111, [
      pair,
      { ...pair, spender: owner },
    ]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      amount: max160,
      expiration: 100n,
      nonce: (1n << 48n) - 1n,
      expired: false,
      underlying: { amount: 0n },
    });
    expect(result.rows[0]?.underlying).toBe(result.rows[1]?.underlying);
    expect(calls.filter((c) => c.method === 'eth_getCode')).toHaveLength(2);
    expect(direct).not.toHaveBeenCalled();
    manager.close();
  });
  it('refuses a mismatched chain before contract reads', async () => {
    const { manager, calls } = mockRpc(() => '0x1');
    await expect(
      inspectPermit2(manager, owner, 11155111, [pair]),
    ).rejects.toThrow('Wrong');
    expect(calls).toHaveLength(1);
    manager.close();
  });
  it('rejects trailing words in a Permit2 allowance response instead of claiming a checked grant', async () => {
    const { manager } = mockRpc((call) => {
      if (call.method === 'eth_chainId') return '0xaa36a7';
      if (call.method === 'eth_blockNumber') return '0x10';
      if (call.method === 'eth_getBlockByNumber')
        return {
          number: '0x10',
          hash: `0x${'ab'.repeat(32)}`,
          timestamp: '0x64',
        };
      if (call.method === 'eth_getCode') return '0x6000';
      const target = call.params[0] as { to: string; data: Hex };
      if (target.to === PERMIT2_ADDRESS)
        return (
          encodeFunctionResult({
            abi: permit2Abi,
            functionName: 'allowance',
            result: [0n, 0, 0],
          }) + '00'.repeat(32)
        );
      const { functionName } = decodeFunctionData({
        abi: erc20Abi,
        data: target.data,
      });
      if (functionName === 'symbol' || functionName === 'name')
        return encodeFunctionResult({
          abi: erc20Abi,
          functionName,
          result: 'TEST',
        });
      if (functionName === 'decimals')
        return encodeFunctionResult({
          abi: erc20Abi,
          functionName,
          result: 18,
        });
      return encodeFunctionResult({
        abi: erc20Abi,
        functionName: 'allowance',
        result: 0n,
      });
    });
    const result = await inspectPermit2(manager, owner, 11155111, [pair]);
    expect(result.rows).toHaveLength(0);
    expect(result.failures).toHaveLength(1);
    manager.close();
  });
});

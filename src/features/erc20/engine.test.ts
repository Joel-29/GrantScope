import { describe, expect, it } from 'vitest';
import {
  decodeFunctionData,
  encodeFunctionResult,
  maxUint256,
  type Hex,
} from 'viem';
import { erc20Abi } from '../../lib/abi/erc20';
import { mockRpc } from '../../test/mockRpc';
import { classifySpender } from '../../data/spenders';
import { allowanceSize, tokenAmount } from './amounts';
import { knownPairs, scanAllowances } from './engine';
const owner = '0x0000000000000000000000000000000000000000';
const pair = knownPairs(11155111)[0]!;
function setup(fail = false, reorg = false) {
  let headers = 0;
  return mockRpc((call) => {
    if (call.method === 'eth_chainId') return '0xaa36a7';
    if (call.method === 'eth_blockNumber') return '0x100';
    if (call.method === 'eth_getBlockByNumber')
      return {
        number: call.params[0],
        hash: `0x${(reorg && headers++ > 0 ? 'cd' : 'ab').repeat(32)}`,
        timestamp: '0x100',
      };
    if (call.method === 'eth_getCode') return '0x6000';
    const data = (call.params[0] as { data: Hex }).data;
    const { functionName } = decodeFunctionData({ abi: erc20Abi, data });
    if (fail && functionName === 'allowance') throw new Error('refused');
    if (functionName === 'decimals')
      return encodeFunctionResult({ abi: erc20Abi, functionName, result: 6 });
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
    return encodeFunctionResult({
      abi: erc20Abi,
      functionName: 'allowance',
      result: functionName === 'balanceOf' ? 1000001n : maxUint256,
    });
  });
}
describe('ERC-20 allowance engine', () => {
  it('discards all allowance rows if the pinned block reorganizes during scanning', async () => {
    const { manager } = setup(false, true);
    await expect(
      scanAllowances(manager, owner, 11155111, [pair]),
    ).rejects.toThrow('snapshot changed');
    manager.close();
  });
  it('reuses metadata and balance only within the same owner block and scan', async () => {
    const { manager, calls } = setup();
    const other: typeof pair = { ...pair, spender: owner };
    const result = await scanAllowances(manager, owner, 11155111, [
      pair,
      other,
    ]);
    expect(result.rows).toHaveLength(2);
    expect(calls.filter((call) => call.method === 'eth_getCode')).toHaveLength(
      1,
    );
    const decoded = calls
      .filter((call) => call.method === 'eth_call')
      .map(
        (call) =>
          decodeFunctionData({
            abi: erc20Abi,
            data: (call.params[0] as { data: Hex }).data,
          }).functionName,
      );
    expect(decoded.filter((name) => name === 'balanceOf')).toHaveLength(1);
    expect(decoded.filter((name) => name === 'allowance')).toHaveLength(2);
    manager.close();
  });
  it('preserves exact units and separates zero, limited, maximum and near-maximum', () => {
    expect(tokenAmount(1000000000000000001n, 18)).toBe('1.000000000000000001');
    expect([0n, 1n, maxUint256, maxUint256 - 1n].map(allowanceSize)).toEqual([
      'zero',
      'limited',
      'maximum',
      'near-maximum',
    ]);
    expect(() => allowanceSize(maxUint256 + 1n)).toThrow();
    expect(() => tokenAmount(1n, 256)).toThrow();
  });
  it('deduplicates pairs, decodes typed reads and pins every state call to one block', async () => {
    const { manager, calls, direct } = setup();
    const progress: number[] = [];
    const result = await scanAllowances(
      manager,
      owner,
      11155111,
      [pair, pair],
      { onProgress: (done) => progress.push(done) },
    );
    expect(result.rows[0]).toMatchObject({
      amount: maxUint256,
      balance: 1000001n,
      symbol: 'USDC',
      decimals: 6,
      size: 'maximum',
    });
    expect(result.attempted).toBe(1);
    expect(progress).toEqual([0, 1]);
    expect(
      calls
        .filter((c) => c.method === 'eth_call' || c.method === 'eth_getCode')
        .every((c) => c.params[1] === '0x100'),
    ).toBe(true);
    expect(direct).not.toHaveBeenCalled();
    manager.close();
  });
  it('reports unreadable allowance as failure rather than zero', async () => {
    const { manager } = setup(true);
    const result = await scanAllowances(manager, owner, 11155111, [pair]);
    expect(result.rows).toEqual([]);
    expect(result.failures).toHaveLength(1);
    manager.close();
  });
  it('does not classify unknown spenders as malicious', () => {
    expect(classifySpender(1, owner)).toMatchObject({ known: false });
  });
  it('cancels before reading and rejects nonfinite concurrency', async () => {
    const { manager, calls } = setup();
    const c = new AbortController();
    c.abort();
    await expect(
      scanAllowances(manager, owner, 11155111, [pair], { signal: c.signal }),
    ).rejects.toThrow();
    expect(calls).toEqual([]);
    await expect(
      scanAllowances(manager, owner, 11155111, [pair], { concurrency: NaN }),
    ).rejects.toThrow('concurrency');
    manager.close();
  });
});

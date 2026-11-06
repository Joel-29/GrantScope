import { describe, expect, it, vi } from 'vitest';
import {
  decodeFunctionData,
  encodeFunctionResult,
  keccak256,
  type Hex,
} from 'viem';
import { erc20Abi } from '../../lib/abi/erc20';
import { permit2Abi } from '../../lib/abi/permit2';
import { PERMIT2_ADDRESS } from '../../data/spenders';
import { mockRpc } from '../../test/mockRpc';
import type { Erc20Permission } from '../erc20/types';
import type { Permit2Grant } from '../permit2/engine';
import {
  prepareRevocation,
  submitRevocation,
  revocationIntent,
  sameIntent,
  verifyRevocation,
  followRevocation,
} from './engine';

const wait = vi.hoisted(() => vi.fn());
vi.mock('../wallet/inspection', () => ({
  waitAnonymousReceipt: wait,
}));
const owner = '0x0000000000000000000000000000000000000001',
  token = '0x0000000000000000000000000000000000000002',
  spender = '0x0000000000000000000000000000000000000003';
const hash = `0x${'ab'.repeat(32)}` as Hex,
  blockHash = `0x${'cd'.repeat(32)}` as Hex;
const record: Erc20Permission = {
  id: 'security-unit-fixture',
  kind: 'erc20',
  chainId: 11155111,
  owner,
  token,
  spender,
  symbol: 'TEST',
  name: 'Unit fixture',
  decimals: 18,
  balance: 100n,
  amount: 1n,
  size: 'limited',
  blockNumber: 16n,
  readAt: 0,
  knownSpender: false,
  spenderName: 'Unclassified',
  source: 'manual',
  warnings: [],
};
function setup() {
  const state = {
    walletOwner: owner as string,
    walletChain: '0xaa36a7',
    rpcChain: '0xaa36a7',
    ownerCode: '0x',
    targetCode: '0x6000',
    amount: 1n,
    simulation: true,
    gasPrice: 1n,
    balance: 1000000n,
    nonce: 1n,
    head: '0x11',
    txHash: hash,
    txData: revocationIntent(record).data,
    permit: false,
    txTo: token as string,
    headerHash: blockHash,
  };
  const rpc = mockRpc((call) => {
    if (call.method === 'eth_chainId') return state.rpcChain;
    if (call.method === 'eth_blockNumber') return state.head;
    if (call.method === 'eth_getCode')
      return call.params[0] === owner ? state.ownerCode : state.targetCode;
    if (call.method === 'eth_getBalance')
      return `0x${state.balance.toString(16)}`;
    if (call.method === 'eth_gasPrice')
      return `0x${state.gasPrice.toString(16)}`;
    if (call.method === 'eth_estimateGas') return '0x5208';
    if (call.method === 'eth_getTransactionCount')
      return `0x${state.nonce.toString(16)}`;
    if (call.method === 'eth_getBlockByNumber')
      return {
        number: call.params[0],
        hash: state.headerHash,
        timestamp: '0x100',
      };
    if (call.method === 'eth_getTransactionByHash')
      return {
        hash: state.txHash,
        from: owner,
        to: state.txTo,
        input: state.txData,
        value: '0x0',
        nonce: '0x1',
        blockNumber: '0x10',
        blockHash,
      };
    const tx = call.params[0] as { data: Hex };
    if (state.permit) {
      const decoded = decodeFunctionData({ abi: permit2Abi, data: tx.data });
      return decoded.functionName === 'lockdown'
        ? '0x'
        : encodeFunctionResult({
            abi: permit2Abi,
            functionName: 'allowance',
            result: [state.amount, 100, 0],
          });
    }
    const { functionName } = decodeFunctionData({
      abi: erc20Abi,
      data: tx.data,
    });
    return functionName === 'approve'
      ? encodeFunctionResult({
          abi: erc20Abi,
          functionName,
          result: state.simulation,
        })
      : encodeFunctionResult({
          abi: erc20Abi,
          functionName: 'allowance',
          result: state.amount,
        });
  });
  const request = vi.fn(async ({ method }: { method: string }) =>
    method === 'eth_accounts'
      ? [state.walletOwner]
      : method === 'eth_chainId'
        ? state.walletChain
        : hash,
  );
  return { ...rpc, state, provider: { request } };
}
describe('owner-authorized revocation security', () => {
  it('prepares real typed Permit2 lockdown calldata and verifies only its selected stored grant', async () => {
    const t = setup();
    t.state.permit = true;
    t.state.txTo = PERMIT2_ADDRESS;
    const grant: Permit2Grant = {
      id: 'permit2-unit',
      kind: 'permit2',
      owner,
      chainId: 11155111,
      token,
      spender,
      amount: 1n,
      expiration: 100n,
      nonce: 0n,
      blockNumber: 16n,
      blockTimestamp: 99n,
      expired: false,
      underlying: record,
      codeHash: keccak256('0x6000'),
      readAt: 0,
    };
    t.state.txData = revocationIntent(grant).data;
    const p = await prepareRevocation(t.manager, t.provider, grant);
    expect(p.intent.to).toBe(PERMIT2_ADDRESS);
    t.state.amount = 0n;
    expect(
      (
        await verifyRevocation(t.manager, p, {
          transactionHash: hash,
          status: 'success',
          blockNumber: 16n,
          blockHash,
        })
      ).blockNumber,
    ).toBe(17n);
    t.manager.close();
  });
  it('prepares an exact zero approval, checks latest state and simulates without asking for a signature', async () => {
    const { manager, provider, direct } = setup();
    const p = await prepareRevocation(manager, provider, record);
    expect(p.amount).toBe(1n);
    expect(
      decodeFunctionData({ abi: erc20Abi, data: p.intent.data }),
    ).toMatchObject({ functionName: 'approve', args: [spender, 0n] });
    expect(
      provider.request.mock.calls.every(
        (c) => c[0].method !== 'eth_sendTransaction',
      ),
    ).toBe(true);
    expect(direct).not.toHaveBeenCalled();
    manager.close();
  });
  it('refuses wrong owner and wallet network before blockchain reads', async () => {
    for (const wrong of ['owner', 'chain']) {
      const t = setup();
      if (wrong === 'owner') t.state.walletOwner = spender;
      else t.state.walletChain = '0x1';
      await expect(
        prepareRevocation(t.manager, t.provider, record),
      ).rejects.toThrow();
      expect(t.calls).toEqual([]);
      t.manager.close();
    }
  });
  it('refuses wrong RPC chain, code accounts, absent target code and already-zero state', async () => {
    for (const wrong of ['chain', 'ownerCode', 'targetCode', 'zero']) {
      const t = setup();
      if (wrong === 'chain') t.state.rpcChain = '0x1';
      if (wrong === 'ownerCode')
        t.state.ownerCode = '0xef0100' + '11'.repeat(20);
      if (wrong === 'targetCode') t.state.targetCode = '0x';
      if (wrong === 'zero') t.state.amount = 0n;
      await expect(
        prepareRevocation(t.manager, t.provider, record),
      ).rejects.toThrow();
      expect(
        t.provider.request.mock.calls.some(
          (c) => c[0].method === 'eth_sendTransaction',
        ),
      ).toBe(false);
      t.manager.close();
    }
  });
  it('blocks a false-return simulation, insufficient ETH and unsafe receipt nonce precision', async () => {
    for (const wrong of ['simulation', 'balance', 'nonce']) {
      const t = setup();
      if (wrong === 'simulation') t.state.simulation = false;
      if (wrong === 'balance') t.state.balance = 0n;
      if (wrong === 'nonce') t.state.nonce = 1n << 60n;
      await expect(
        prepareRevocation(t.manager, t.provider, record),
      ).rejects.toThrow();
      t.manager.close();
    }
  });
  it('rechecks allowance and gas conditions at confirmation and refuses stale review', async () => {
    for (const change of ['amount', 'gas']) {
      const t = setup();
      const p = await prepareRevocation(t.manager, t.provider, record);
      if (change === 'amount') t.state.amount = 2n;
      else t.state.gasPrice = 2n;
      await expect(
        submitRevocation(t.manager, t.provider, p, () => {}),
      ).rejects.toThrow('changed');
      expect(
        t.provider.request.mock.calls.some(
          (c) => c[0].method === 'eth_sendTransaction',
        ),
      ).toBe(false);
      t.manager.close();
    }
  });
  it('checks context immediately before send and propagates wallet rejection', async () => {
    const t = setup();
    const p = await prepareRevocation(t.manager, t.provider, record);
    let guards = 0;
    await expect(
      submitRevocation(t.manager, t.provider, p, () => {
        if (++guards === 3) throw new Error('changed context');
      }),
    ).rejects.toThrow('changed context');
    expect(
      t.provider.request.mock.calls.some(
        (c) => c[0].method === 'eth_sendTransaction',
      ),
    ).toBe(false);
    t.provider.request.mockImplementation(async ({ method }) => {
      if (method === 'eth_sendTransaction') throw { code: 4001 };
      return method === 'eth_accounts' ? [owner] : '0xaa36a7';
    });
    await expect(
      submitRevocation(t.manager, t.provider, p, () => {}),
    ).rejects.toMatchObject({ code: 4001 });
    t.manager.close();
  });
  it('only encodes the canonical Permit2 lockdown tuple and leaves other authorization layers untouched', () => {
    const grant = {
      ...record,
      kind: 'permit2',
      underlying: record,
    } as unknown as Permit2Grant;
    const intent = revocationIntent(grant);
    expect(intent.to).toBe(PERMIT2_ADDRESS);
    expect(
      decodeFunctionData({ abi: permit2Abi, data: intent.data }),
    ).toMatchObject({ functionName: 'lockdown', args: [[{ token, spender }]] });
  });
  it('requires successful receipt, matching intent, canonical block and a fresh zero state', async () => {
    const t = setup();
    const p = await prepareRevocation(t.manager, t.provider, record);
    const receipt = {
      transactionHash: hash,
      status: 'success' as const,
      blockNumber: 16n,
      blockHash,
    };
    await expect(verifyRevocation(t.manager, p, receipt)).rejects.toThrow(
      'not zero',
    );
    t.state.amount = 0n;
    expect(await verifyRevocation(t.manager, p, receipt)).toEqual({
      hash,
      blockNumber: 17n,
    });
    t.state.txData = '0x';
    await expect(verifyRevocation(t.manager, p, receipt)).rejects.toThrow(
      'does not match',
    );
    t.state.txData = p.intent.data;
    t.state.headerHash = hash;
    await expect(verifyRevocation(t.manager, p, receipt)).rejects.toThrow(
      'canonical',
    );
    await expect(
      verifyRevocation(t.manager, p, { ...receipt, status: 'reverted' }),
    ).rejects.toThrow('reverted');
    t.manager.close();
  });
  it('handles repricing only when the final mined transaction retains the authorized action', async () => {
    const t = setup();
    const p = await prepareRevocation(t.manager, t.provider, record);
    const replacement = `0x${'ef'.repeat(32)}` as Hex;
    t.state.txHash = replacement;
    t.state.amount = 0n;
    wait.mockImplementation(async (...args) => {
      const { onReplaced } = args[2];
      onReplaced({ transaction: { hash: replacement } });
      return {
        transactionHash: replacement,
        status: 'success',
        blockNumber: 16n,
        blockHash,
      };
    });
    const phases: string[] = [];
    await followRevocation(t.manager, p, hash, (phase) => phases.push(phase));
    expect(phases).toEqual([
      'pending',
      'replaced',
      'confirmed',
      'verified-zero',
    ]);
    t.state.txData = '0x';
    phases.length = 0;
    await expect(
      followRevocation(t.manager, p, hash, (phase) => phases.push(phase)),
    ).rejects.toThrow('does not match');
    expect(phases).not.toContain('verified-zero');
    t.manager.close();
  });
  it('never marks a timed-out or unknown submission revoked', async () => {
    const t = setup();
    const p = await prepareRevocation(t.manager, t.provider, record);
    wait.mockRejectedValue(new Error('timeout'));
    const phases: string[] = [];
    await expect(
      followRevocation(t.manager, p, hash, (phase) => phases.push(phase)),
    ).rejects.toThrow('timeout');
    expect(phases).toEqual(['pending']);
    expect(
      sameIntent(
        {
          from: owner,
          to: token,
          input: p.intent.data,
          value: '0x1',
          nonce: '0x1',
        },
        p.intent,
        1n,
      ),
    ).toBe(false);
    t.manager.close();
  });
});

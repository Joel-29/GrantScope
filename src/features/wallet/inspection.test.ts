import { describe, expect, it, vi } from 'vitest';
import { AnonRpcManager } from '../anon-rpc/AnonRpcManager';
import { parseAddress, accountKind } from './address';
import { inspectAccount } from './inspection';
import { useInspectionSession } from './session';
import { useWallet, walletChain } from './provider';

const owner = '0x52908400098527886E0F7030069857D2E4169EE7';
function mockedManager(chain = '0xaa36a7', code = '0x') {
  const calls: { method: string; params: unknown[] }[] = [];
  const direct = vi.fn();
  const manager = new AnonRpcManager(
    () => ({
      ready: Promise.resolve(),
      close: vi.fn(),
      fetch: vi.fn(async (_url, init) => {
        const body = JSON.parse(String(init?.body)) as {
          id: number;
          method: string;
          params: unknown[];
        };
        calls.push(body);
        const result =
          body.method === 'eth_getBlockByNumber'
            ? {
                number: body.params[0],
                hash: `0x${'ab'.repeat(32)}`,
                timestamp: '0x100',
              }
            : body.method === 'eth_chainId'
              ? chain
              : body.method === 'eth_blockNumber'
                ? '0xabc'
                : body.method === 'eth_getBalance'
                  ? '0xde0b6b3a7640001'
                  : code;
        return new Response(
          JSON.stringify({ jsonrpc: '2.0', id: body.id, result }),
        );
      }),
    }),
    direct,
  );
  return { manager, calls, direct };
}

describe('read-only account inspection', () => {
  it('checksums valid input and rejects invalid mixed-case checksums and ENS without RPC', () => {
    expect(parseAddress(owner.toLowerCase())).toBe(owner);
    expect(() => parseAddress(owner.replace('E0F', 'E0f'))).toThrow('checksum');
    for (const value of ['vitalik.eth', '0x123', '', '0x' + 'z'.repeat(40)])
      expect(() => parseAddress(value)).toThrow();
  });
  it('reads ETH and bytecode at the same verified block using only the anonymous manager', async () => {
    const { manager, calls, direct } = mockedManager();
    const result = await inspectAccount(manager, owner.toLowerCase(), 11155111);
    expect(result).toMatchObject({
      address: owner,
      eth: '1.000000000000000001',
      balanceWei: 1000000000000000001n,
      blockNumber: 2748n,
      kind: 'eoa',
      transport: 'nym',
    });
    expect(calls.map((item) => item.method)).toEqual([
      'eth_chainId',
      'eth_blockNumber',
      'eth_getBlockByNumber',
      'eth_getBalance',
      'eth_getCode',
      'eth_getBlockByNumber',
    ]);
    expect(
      calls
        .filter(
          (item) =>
            item.method === 'eth_getBalance' || item.method === 'eth_getCode',
        )
        .every(
          (item) => item.params[0] === owner && item.params[1] === '0xabc',
        ),
    ).toBe(true);
    expect(direct).not.toHaveBeenCalled();
    manager.close();
  });
  it('does not query a target when the anonymous endpoint returns the wrong chain', async () => {
    const { manager, calls } = mockedManager('0x1');
    await expect(inspectAccount(manager, owner, 11155111)).rejects.toThrow(
      'wrong chain',
    );
    expect(calls.map((item) => item.method)).toEqual(['eth_chainId']);
    manager.close();
  });
  it('treats contract and delegated-code accounts as code-present, not generic EOA signers', async () => {
    for (const code of ['0x60016000', '0xef0100' + '11'.repeat(20)]) {
      const { manager } = mockedManager('0xaa36a7', code);
      expect((await inspectAccount(manager, owner, 11155111)).kind).toBe(
        'code-present',
      );
      manager.close();
    }
    for (const code of [null, '0xz1', '0x1', 42])
      expect(() => accountKind(code)).toThrow();
  });
  it('honors cancellation before starting a worker', async () => {
    const { manager, calls } = mockedManager();
    const controller = new AbortController();
    controller.abort();
    await expect(
      inspectAccount(manager, owner, 11155111, controller.signal),
    ).rejects.toThrow();
    expect(calls).toHaveLength(0);
    manager.close();
  });
  it('keeps bounded deduplicated chain-specific address history in memory and clears it', () => {
    const session = useInspectionSession.getState();
    session.clear();
    session.inspect(owner, 1);
    session.inspect(owner.toLowerCase(), 1);
    session.inspect(owner, 11155111);
    expect(useInspectionSession.getState().history).toHaveLength(2);
    session.clear();
    expect(useInspectionSession.getState().target).toBeNull();
    expect(useInspectionSession.getState().history).toHaveLength(0);
  });
  it('handles wallet rejection, and validates untrusted chain IDs', async () => {
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: { request: vi.fn().mockRejectedValue({ code: 4001 }) },
    });
    await useWallet.getState().connect();
    expect(useWallet.getState().error).toBe('Wallet connection rejected.');
    expect(useWallet.getState().address).toBeNull();
    expect(walletChain('0xaa36a7')).toBe(11155111);
    for (const value of ['1', '0x0', '0x' + 'ff'.repeat(20), 1])
      expect(() => walletChain(value)).toThrow();
    useWallet.getState().disconnect();
    Reflect.deleteProperty(window, 'ethereum');
  });
  it('subscribes to account/network changes and disconnects without requesting chain reads', async () => {
    const events = new Map<string, (...args: unknown[]) => void>();
    const request = vi.fn(async ({ method }: { method: string }) =>
      method === 'eth_requestAccounts' || method === 'eth_accounts'
        ? [owner]
        : '0xaa36a7',
    );
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: {
        request,
        on: (name: string, fn: (...args: unknown[]) => void) =>
          events.set(name, fn),
        removeListener: (name: string) => events.delete(name),
      },
    });
    await useWallet.getState().connect();
    expect(useWallet.getState().address).toBe(owner);
    events.get('accountsChanged')?.([]);
    expect(useWallet.getState().address).toBeNull();
    events.get('chainChanged')?.('0x1');
    expect(useWallet.getState().chainId).toBe(1);
    expect(request.mock.calls.map((call) => call[0].method)).toEqual([
      'eth_requestAccounts',
      'eth_accounts',
      'eth_chainId',
    ]);
    useWallet.getState().disconnect();
    expect(events.size).toBe(0);
    Reflect.deleteProperty(window, 'ethereum');
  });
});

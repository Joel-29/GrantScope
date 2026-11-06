import { walletRequest } from '../wallet/requests';
import {
  decodeFunctionResult,
  encodeFunctionData,
  encodeFunctionResult,
  keccak256,
  type Address,
  type Hex,
  type TransactionReceipt,
} from 'viem';
import { erc20Abi } from '../../lib/abi/erc20';
import { permit2Abi } from '../../lib/abi/permit2';
import { PERMIT2_ADDRESS } from '../../data/spenders';
import type { AnonRpcManager } from '../anon-rpc/AnonRpcManager';
import { rpcQuantity } from '../anon-rpc/JsonRpcAdapter';
import { READ_NETWORKS } from '../anon-rpc/transportRegistry';
import { accountKind, parseAddress } from '../wallet/address';
import { walletChain, type InjectedProvider } from '../wallet/provider';
import { publicClient } from '../wallet/inspection';
import { blockHeader, hash32 } from '../discovery/logs';
import { contractRead } from '../erc20/engine';
import type { Permission } from '../exposure/analysis';

export class RevocationError extends Error {}
export type Intent = { from: Address; to: Address; data: Hex; value: '0x0' };
export type Prepared = {
  record: Permission;
  intent: Intent;
  amount: bigint;
  blockNumber: bigint;
  codeHash: Hex;
  gas: bigint;
  gasPrice: bigint;
  feeCap: bigint;
  nonce: bigint;
  createdAt: number;
};
export type RevocationPhase =
  | 'checking'
  | 'awaiting-wallet'
  | 'pending'
  | 'replaced'
  | 'confirmed'
  | 'verified-zero';
export function revocationIntent(record: Permission): Intent {
  if (!READ_NETWORKS[record.chainId])
    throw new RevocationError('Unsupported revocation chain');
  const from = parseAddress(record.owner),
    token = parseAddress(record.token),
    spender = parseAddress(record.spender);
  return {
    from,
    to: record.kind === 'permit2' ? PERMIT2_ADDRESS : token,
    data:
      record.kind === 'permit2'
        ? encodeFunctionData({
            abi: permit2Abi,
            functionName: 'lockdown',
            args: [[{ token, spender }]],
          })
        : encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [spender, 0n],
          }),
    value: '0x0',
  };
}
export async function assertWallet(
  provider: InjectedProvider,
  record: Permission,
) {
  const accounts = await walletRequest(
      provider,
      { method: 'eth_accounts' },
      record.chainId,
    ),
    chain = await walletRequest(
      provider,
      { method: 'eth_chainId' },
      record.chainId,
    );
  if (
    !Array.isArray(accounts) ||
    typeof accounts[0] !== 'string' ||
    parseAddress(accounts[0]) !== parseAddress(record.owner)
  )
    throw new RevocationError('Connected wallet must be the inspected owner');
  if (walletChain(chain) !== record.chainId)
    throw new RevocationError('Wallet is on the wrong network');
}
export async function currentAmount(
  manager: AnonRpcManager,
  record: Permission,
  blockNumber: bigint,
  signal?: AbortSignal,
): Promise<bigint> {
  if (record.kind === 'erc20') {
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'allowance',
      args: [record.owner, record.spender],
    });
    return decodeFunctionResult({
      abi: erc20Abi,
      functionName: 'allowance',
      data: await contractRead(
        manager,
        record.chainId,
        record.token,
        data,
        blockNumber,
        signal,
      ),
    });
  }
  const data = encodeFunctionData({
    abi: permit2Abi,
    functionName: 'allowance',
    args: [record.owner, record.token, record.spender],
  });
  return decodeFunctionResult({
    abi: permit2Abi,
    functionName: 'allowance',
    data: await contractRead(
      manager,
      record.chainId,
      PERMIT2_ADDRESS,
      data,
      blockNumber,
      signal,
    ),
  })[0];
}
export async function prepareRevocation(
  manager: AnonRpcManager,
  provider: InjectedProvider,
  record: Permission,
  signal?: AbortSignal,
): Promise<Prepared> {
  const intent = revocationIntent(record);
  signal?.throwIfAborted();
  await assertWallet(provider, record);
  await manager.initialize();
  if (
    rpcQuantity(
      await manager.request(record.chainId, 'eth_chainId', [], signal),
    ) !== BigInt(record.chainId)
  )
    throw new RevocationError('Anonymous RPC is on the wrong chain');
  const blockNumber = rpcQuantity(
    await manager.request(record.chainId, 'eth_blockNumber', [], signal),
  );
  const tag = `0x${blockNumber.toString(16)}`;
  const ownerCode = await manager.request(
    record.chainId,
    'eth_getCode',
    [intent.from, tag],
    signal,
  );
  if (accountKind(ownerCode) !== 'eoa')
    throw new RevocationError(
      'Code-present accounts are read-only; no smart-account execution adapter is supported',
    );
  const code = await manager.request(
    record.chainId,
    'eth_getCode',
    [intent.to, tag],
    signal,
  );
  if (typeof code !== 'string' || !/^0x(?:[0-9a-f]{2})+$/i.test(code))
    throw new RevocationError(
      'Revocation target has no readable contract code',
    );
  const codeHash = keccak256(code as Hex);
  if (
    record.kind === 'permit2' &&
    codeHash.toLowerCase() !== record.codeHash.toLowerCase()
  )
    throw new RevocationError('Permit2 code changed since inspection');
  const amount = await currentAmount(manager, record, blockNumber, signal);
  if (amount === 0n)
    throw new RevocationError(
      'Allowance is already zero. Refresh the scan; no transaction is needed',
    );
  const simulation = await manager.request(
    record.chainId,
    'eth_call',
    [intent, 'latest'],
    signal,
  );
  if (
    typeof simulation !== 'string' ||
    !/^0x(?:[0-9a-f]{2})*$/i.test(simulation)
  )
    throw new RevocationError('Invalid simulation return');
  if (record.kind === 'erc20') {
    if (
      simulation.length !== 66 ||
      simulation.toLowerCase() !==
        encodeFunctionResult({
          abi: erc20Abi,
          functionName: 'approve',
          result: true,
        })
    )
      throw new RevocationError(
        'Token simulation did not return true; nonstandard approve is unsupported',
      );
  } else if (simulation !== '0x')
    throw new RevocationError('Unexpected Permit2 simulation result');
  const estimate = rpcQuantity(
    await manager.request(record.chainId, 'eth_estimateGas', [intent], signal),
  );
  const gas = (estimate * 125n + 99n) / 100n;
  if (estimate < 21000n || gas > 5000000n)
    throw new RevocationError('Gas estimate outside supported bounds');
  const gasPrice = rpcQuantity(
    await manager.request(record.chainId, 'eth_gasPrice', [], signal),
  );
  if (gasPrice === 0n) throw new RevocationError('Gas price is unavailable');
  const feeCap = gas * gasPrice;
  const balance = rpcQuantity(
    await manager.request(
      record.chainId,
      'eth_getBalance',
      [intent.from, 'latest'],
      signal,
    ),
  );
  if (balance < feeCap)
    throw new RevocationError(
      'Insufficient ETH for the prepared gas limit and gas price',
    );
  const nonce = rpcQuantity(
    await manager.request(
      record.chainId,
      'eth_getTransactionCount',
      [intent.from, 'pending'],
      signal,
    ),
  );
  if (nonce > BigInt(Number.MAX_SAFE_INTEGER))
    throw new RevocationError(
      'Nonce exceeds supported receipt-tracking precision',
    );
  signal?.throwIfAborted();
  await assertWallet(provider, record);
  return {
    record,
    intent,
    amount,
    blockNumber,
    codeHash,
    gas,
    gasPrice,
    feeCap,
    nonce,
    createdAt: Date.now(),
  };
}
export function sameIntent(
  value: unknown,
  intent: Intent,
  nonce?: bigint,
): boolean {
  if (!value || typeof value !== 'object') return false;
  const tx = value as Record<string, unknown>;
  try {
    return (
      parseAddress(String(tx.from)) === intent.from &&
      parseAddress(String(tx.to)) === intent.to &&
      typeof tx.input === 'string' &&
      tx.input.toLowerCase() === intent.data.toLowerCase() &&
      rpcQuantity(tx.value) === 0n &&
      (nonce === undefined || rpcQuantity(tx.nonce) === nonce)
    );
  } catch {
    return false;
  }
}
export async function submitRevocation(
  manager: AnonRpcManager,
  provider: InjectedProvider,
  prepared: Prepared,
  guard: () => void,
  signal?: AbortSignal,
  onWallet?: () => void,
) {
  guard();
  if (Date.now() - prepared.createdAt > 120000)
    throw new RevocationError('Preparation expired; prepare again');
  const fresh = await prepareRevocation(
    manager,
    provider,
    prepared.record,
    signal,
  );
  if (
    fresh.codeHash !== prepared.codeHash ||
    fresh.amount !== prepared.amount ||
    fresh.nonce !== prepared.nonce ||
    fresh.feeCap > prepared.feeCap
  )
    throw new RevocationError(
      'Allowance, contract, nonce or gas conditions changed. Prepare and review again',
    );
  guard();
  signal?.throwIfAborted();
  await assertWallet(provider, prepared.record);
  signal?.throwIfAborted();
  guard();
  const hex = (value: bigint) => `0x${value.toString(16)}`;
  onWallet?.();
  const value = await walletRequest(
    provider,
    {
      method: 'eth_sendTransaction',
      params: [
        {
          ...fresh.intent,
          chainId: hex(BigInt(fresh.record.chainId)),
          nonce: hex(fresh.nonce),
          gas: hex(fresh.gas),
          gasPrice: hex(fresh.gasPrice),
        },
      ],
    },
    prepared.record.chainId,
  );
  return { hash: hash32(value), prepared: fresh };
}
export async function verifyRevocation(
  manager: AnonRpcManager,
  prepared: Prepared,
  receipt: Pick<
    TransactionReceipt,
    'transactionHash' | 'status' | 'blockNumber' | 'blockHash'
  >,
  signal?: AbortSignal,
) {
  if (receipt.status !== 'success')
    throw new RevocationError('Transaction reverted; revocation not verified');
  const chain = prepared.record.chainId;
  if (
    rpcQuantity(await manager.request(chain, 'eth_chainId', [], signal)) !==
    BigInt(chain)
  )
    throw new RevocationError('Verification chain mismatch');
  const tx = await manager.request(
    chain,
    'eth_getTransactionByHash',
    [receipt.transactionHash],
    signal,
  );
  if (
    !sameIntent(tx, prepared.intent, prepared.nonce) ||
    !tx ||
    typeof tx !== 'object' ||
    !('hash' in tx) ||
    hash32(tx.hash).toLowerCase() !== receipt.transactionHash.toLowerCase()
  )
    throw new RevocationError(
      'Mined transaction does not match the authorized revocation',
    );
  if (
    !('blockNumber' in tx) ||
    !('blockHash' in tx) ||
    rpcQuantity(tx.blockNumber) !== receipt.blockNumber ||
    hash32(tx.blockHash).toLowerCase() !== receipt.blockHash.toLowerCase()
  )
    throw new RevocationError(
      'Transaction and receipt block identity disagree',
    );
  const anchor = await blockHeader(manager, chain, receipt.blockNumber, signal);
  if (anchor.hash.toLowerCase() !== receipt.blockHash.toLowerCase())
    throw new RevocationError('Receipt is no longer canonical');
  const blockNumber = rpcQuantity(
    await manager.request(chain, 'eth_blockNumber', [], signal),
  );
  if (blockNumber < receipt.blockNumber + 1n)
    throw new RevocationError('Two block confirmations are required');
  if (
    (await currentAmount(manager, prepared.record, blockNumber, signal)) !== 0n
  )
    throw new RevocationError(
      'Current allowance is not zero; revocation not verified',
    );
  const after = await blockHeader(manager, chain, receipt.blockNumber, signal);
  if (after.hash !== anchor.hash)
    throw new RevocationError('Reorg during verification');
  return { hash: receipt.transactionHash, blockNumber };
}
export async function followRevocation(
  manager: AnonRpcManager,
  prepared: Prepared,
  hash: Hex,
  onPhase: (phase: RevocationPhase, hash: Hex) => void,
) {
  onPhase('pending', hash);
  const receipt = await publicClient(
    manager,
    prepared.record.chainId,
  ).waitForTransactionReceipt({
    hash,
    confirmations: 2,
    timeout: 180000,
    pollingInterval: 5000,
    retryCount: 0,
    onReplaced: ({ transaction }) => onPhase('replaced', transaction.hash),
  });
  onPhase('confirmed', receipt.transactionHash);
  const result = await verifyRevocation(manager, prepared, receipt);
  onPhase('verified-zero', result.hash);
  return result;
}

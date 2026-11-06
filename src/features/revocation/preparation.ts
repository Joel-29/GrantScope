import { JsonRpcError } from '../anon-rpc/JsonRpcAdapter';

export const preparationStages = {
  'checking-wallet': 'Checking wallet account and network',
  'starting-worker': 'Starting the anonymous worker',
  'checking-network': 'Verifying the anonymous RPC network',
  'pinning-block': 'Selecting and checking the read block',
  'checking-owner': 'Checking owner account bytecode',
  'checking-target': 'Checking the revocation contract',
  'reading-allowance': 'Reading the current allowance',
  simulating: 'Simulating the zeroing transaction',
  'estimating-gas': 'Estimating transaction gas',
  'reading-fees': 'Reading the network gas price',
  'checking-funds': 'Checking ETH for gas fees',
  'reading-nonce': 'Reading the pending transaction nonce',
  'rechecking-wallet': 'Rechecking wallet account and network',
  'checking-snapshot': 'Checking the canonical preparation block',
} as const;
export type PreparationStage = keyof typeof preparationStages;
export function walletPreparationStage(stage: PreparationStage) {
  return stage === 'checking-wallet' || stage === 'rechecking-wallet';
}

// Provider errors may contain owners, calldata or hashes. Only known error
// categories and numeric RPC codes are retained; arbitrary messages are omitted.
export function preparationFailure(cause: unknown, stage: PreparationStage) {
  let reason = walletPreparationStage(stage)
    ? 'The wallet metadata could not be read. Check extension access and reconnect the owner.'
    : 'The anonymous read or its response could not be verified. Check Privacy Lab and retry explicitly.';
  try {
    if (cause instanceof JsonRpcError && Number.isSafeInteger(cause.code))
      reason = `The RPC provider rejected the anonymous request (code ${cause.code}).`;
    else if (cause && typeof cause === 'object') {
      const name = 'name' in cause ? cause.name : null;
      const code = 'code' in cause ? cause.code : null;
      if (name === 'AbortError') reason = 'Preparation was cancelled.';
      else if (name === 'TimeoutError' || name === 'TunnelOpenTimeoutError')
        reason =
          'The operation timed out. No result was verified for this attempt.';
      else if (walletPreparationStage(stage) && code === 4001)
        reason =
          'The wallet metadata request was rejected. Reconnect explicitly when ready.';
      else if (walletPreparationStage(stage) && code === 4100)
        reason =
          'Wallet account access is not authorized. Reconnect the owner in Settings.';
      else if (
        walletPreparationStage(stage) &&
        (code === 4900 || code === 4901)
      )
        reason =
          'The wallet is disconnected from the requested network. Review MetaMask and reconnect.';
      else if ('message' in cause && typeof cause.message === 'string') {
        const http = /^RPC HTTP ([45][0-9]{2})$/.exec(cause.message);
        if (http) reason = `The anonymous RPC returned HTTP ${http[1]}.`;
      }
    }
  } catch {
    // Even malformed provider error objects must not bypass safe diagnostics.
  }
  return `Preparation stopped: ${preparationStages[stage]}. ${reason} No transaction was requested by this preflight; no revocation is claimed.`;
}

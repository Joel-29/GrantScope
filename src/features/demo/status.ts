import type { AllowanceStage } from '../erc20/types';
import type { WorkerPhase } from '../anon-rpc/types';
import type { AnonymousTransport } from '../anon-rpc/transportRegistry';
import { DemoDeadlineError } from './read';

export const demoStages: Record<AllowanceStage, string> = {
  initializing: 'Starting the anonymous worker and waiting for its network',
  'checking-network': 'Verifying the Sepolia network',
  'pinning-block': 'Selecting and checking the read block',
  'reading-token': 'Reading token metadata, balance and current allowance',
  'checking-snapshot': 'Checking that the verified block has not changed',
};

export function demoQueryKey(
  owner: string,
  transport: AnonymousTransport,
  sessionId: string,
  revision: number,
) {
  return [
    'local-demo',
    11155111,
    owner,
    transport,
    sessionId,
    revision,
  ] as const;
}

export class DemoReadError extends Error {
  constructor(public readonly kind: 'context-changed' | 'pair-unverified') {
    super(kind);
  }
}

// Never echo arbitrary SDK/provider messages: they can include request payloads.
export function demoFailure(
  cause: unknown,
  stage: AllowanceStage,
  transport: AnonymousTransport,
  phase: WorkerPhase,
) {
  const boundary =
    'This is not a zero allowance. No direct fallback or transaction was requested.';
  if (cause instanceof DemoReadError && cause.kind === 'context-changed')
    return `Local demo context changed. The selected inspection or worker changed during this attempt; its result was discarded. Retry explicitly in the intended session. ${boundary}`;
  if (cause instanceof DemoDeadlineError)
    return `Local demo read timed out. This attempt reached the 4-minute limit; no result was verified. Last stage: ${demoStages[stage]} via ${transport}. Open Privacy Lab to check the worker or explicitly restart the anonymous worker. ${boundary}`;
  if (
    cause &&
    typeof cause === 'object' &&
    'name' in cause &&
    cause.name === 'TimeoutError'
  )
    return `Local demo read timed out during an anonymous operation. Last stage: ${demoStages[stage]} via ${transport}. No result was verified for this attempt. Check Privacy Lab or explicitly restart the anonymous worker. ${boundary}`;
  return `Local demo read failed. Stage: ${demoStages[stage]} via ${transport}. Worker state: ${phase}. ${
    cause instanceof DemoReadError && cause.kind === 'pair-unverified'
      ? 'The configured token metadata or allowance could not be verified.'
      : 'The anonymous read or snapshot could not be verified.'
  } Check Privacy Lab before retrying. ${boundary}`;
}

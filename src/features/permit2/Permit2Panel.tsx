import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { useInspectionSession } from '../wallet/session';
import { anonRpc, useAnonRpc } from '../anon-rpc/runtime';
import { tokenAmount } from '../erc20/amounts';
import { usePairStore } from '../erc20/pairStore';
import {
  discoverPermit2,
  inspectPermit2,
  knownPermit2Pairs,
  type Permit2Grant,
} from './engine';

export function Permit2Record({ grant }: { grant: Permit2Grant }) {
  return (
    <details className="disclosure permission-record">
      <summary>
        {grant.underlying.symbol} · Permit2 → {grant.spender} ·{' '}
        {grant.amount === 0n ? 'zero' : grant.expired ? 'expired' : 'unexpired'}
      </summary>
      <dl className="account-details">
        <div>
          <dt>Token</dt>
          <dd>{grant.token}</dd>
        </div>
        <div>
          <dt>Grant amount</dt>
          <dd>{tokenAmount(grant.amount, grant.underlying.decimals)}</dd>
        </div>
        <div>
          <dt>Expiration (Unix seconds)</dt>
          <dd>{grant.expiration.toString()}</dd>
        </div>
        <div>
          <dt>Nonce</dt>
          <dd>{grant.nonce.toString()}</dd>
        </div>
        <div>
          <dt>ERC-20 allowance to Permit2</dt>
          <dd>
            {tokenAmount(grant.underlying.amount, grant.underlying.decimals)}
          </dd>
        </div>
        <div>
          <dt>Balance</dt>
          <dd>
            {tokenAmount(grant.underlying.balance, grant.underlying.decimals)}
          </dd>
        </div>
      </dl>
      <p>
        {grant.underlying.amount === 0n
          ? 'Underlying ERC-20 approval is zero; this grant currently lacks that dependency.'
          : 'This grant shares the underlying ERC-20 approval to Permit2. These layers overlap and must not be added as separate loss amounts.'}
      </p>
      <p>
        Expiration is evaluated at block {grant.blockNumber.toString()}. New
        signed permits may recreate allowances. Offchain SignatureTransfer
        signatures are outside this inventory.
      </p>
    </details>
  );
}
export function Permit2Panel() {
  const { target, revision } = useInspectionSession();
  const extra = usePairStore((state) => state.extra);
  const transport = useAnonRpc(),
    manager = anonRpc.current();
  const [mode, setMode] = useState<'known' | 'events'>('known');
  const query = useQuery({
    queryKey: [
      'permit2',
      target?.chainId,
      target?.address,
      transport.transport,
      manager.sessionId,
      revision,
      mode,
      target ? extra[target.chainId] : null,
    ],
    enabled: false,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!target) throw new Error('Select an account');
      if (mode === 'events')
        return discoverPermit2(manager, target.address, target.chainId, signal);
      return {
        verification: await inspectPermit2(
          manager,
          target.address,
          target.chainId,
          [
            ...knownPermit2Pairs(target.chainId),
            ...(extra[target.chainId] ?? []),
          ],
          { signal },
        ),
        coverage: null,
      };
    },
  });
  return (
    <Panel
      title="Permit2 AllowanceTransfer"
      description="The canonical Permit2 deployment, its stored grants, and the required token-level approval."
    >
      <div className="panel-body">
        <p>
          Known-pair inspection covers four registered pairs plus manually added
          token/spender pairs. Event discovery covers the latest 2,000 blocks
          ending 12 blocks behind head. Neither enumerates offchain signatures.
          No grants are inferred from an ERC-20 approval alone.
        </p>
        <label htmlFor="permit2-mode">Permit2 scan mode</label>
        <select
          id="permit2-mode"
          disabled={query.isFetching}
          value={mode}
          onChange={(e) => setMode(e.target.value as 'known' | 'events')}
        >
          <option value="known">Known pairs</option>
          <option value="events">Permit and Approval events</option>
        </select>
        <Button
          disabled={!target || query.isFetching}
          onClick={() => void query.refetch()}
        >
          Inspect Permit2 grants
        </Button>
        {query.isFetching && (
          <p role="status">Reading Permit2 through the anonymous worker…</p>
        )}
        {query.isError && (
          <p role="alert">
            Permit2 inspection failed. No direct fallback was used.
          </p>
        )}
        {query.data && (
          <>
            <p role="status">{query.data.verification.coverage}</p>
            <p>
              {query.data.verification.failures.length} Permit2 pairs
              unreadable; these remain unknown.
            </p>
            {query.data.coverage && (
              <>
                <p>
                  Event blocks {query.data.coverage.from.toString()}–
                  {query.data.coverage.to.toString()} ·{' '}
                  {query.data.coverage.gaps.length} gaps.
                </p>
                {query.data.coverage.warnings.map((warning, i) => (
                  <p key={`${i}:${warning}`}>{warning}</p>
                ))}
              </>
            )}
            {query.data.verification.rows.map((grant) => (
              <Permit2Record key={grant.id} grant={grant} />
            ))}
          </>
        )}
      </div>
    </Panel>
  );
}

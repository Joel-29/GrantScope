import { useId, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { useInspectionSession } from '../wallet/session';
import { anonRpc, useAnonRpc } from '../anon-rpc/runtime';
import { scanAllowances } from '../erc20/engine';
import { PermissionRecord } from '../erc20/AllowanceInventory';
import { discoverApprovals } from './approvalDiscovery';

export function DiscoveryPanel() {
  const cache = useQueryClient();
  const { target, revision } = useInspectionSession();
  const transport = useAnonRpc();
  const manager = anonRpc.current();
  const id = useId();
  const [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [through, setThrough] = useState('');
  const query = useQuery({
    queryKey: [
      'discovery',
      target?.chainId,
      target?.address,
      transport.transport,
      manager.sessionId,
      revision,
      from,
      to,
    ],
    enabled: false,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!target) throw new Error('Choose an address first');
      if ((from && !/^\d+$/.test(from)) || (to && !/^\d+$/.test(to)))
        throw new Error('Blocks must be nonnegative integers');
      const discovery = await discoverApprovals(
        manager,
        target.address,
        target.chainId,
        {
          ...(from ? { from: BigInt(from) } : {}),
          ...(to ? { to: BigInt(to) } : {}),
          signal,
          onProgress: (block) => setThrough(block.toString()),
        },
      );
      const verification = await scanAllowances(
        manager,
        target.address,
        target.chainId,
        discovery.candidates,
        { signal },
      );
      return { discovery, verification };
    },
  });
  return (
    <Panel
      title="Approval event discovery"
      description="Bounded owner-filtered logs identify candidates; fresh allowance calls determine current authority."
    >
      <div className="panel-body">
        <p>
          Default: latest 2,000 blocks ending 12 blocks behind the observed
          head. Custom ranges are capped at 50,000 blocks and 128 log requests.
          Providers may omit or truncate logs; absence of events is not proof of
          no approvals.
        </p>
        <div className="inspection-form">
          <label htmlFor={`${id}-from`}>First block (optional)</label>
          <input
            id={`${id}-from`}
            inputMode="numeric"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            disabled={query.isFetching}
          />
          <label htmlFor={`${id}-to`}>Last block (optional)</label>
          <input
            id={`${id}-to`}
            inputMode="numeric"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={query.isFetching}
          />
          <Button
            disabled={!target || query.isFetching}
            onClick={() => {
              setThrough('');
              void query.refetch();
            }}
          >
            Discover and verify approvals
          </Button>
          <Button
            disabled={!query.isFetching}
            onClick={() =>
              void cache.cancelQueries({ queryKey: ['discovery'] })
            }
          >
            Cancel discovery
          </Button>
        </div>
        {query.isFetching && (
          <p role="status">
            Scanning anonymous logs
            {through ? ` through block ${through}` : ' and initializing worker'}
            ; then verifying candidates…
          </p>
        )}
        {query.isError && (
          <p role="alert">
            Discovery failed or its range is invalid. No fallback was used.
            Choose an ordered range ending at least 12 blocks behind head, then
            retry explicitly.
          </p>
        )}
        {query.data && (
          <div>
            <p role="status">
              Blocks {query.data.discovery.coverage.from.toString()}–
              {query.data.discovery.coverage.to.toString()} ·{' '}
              {query.data.discovery.coverage.requests} log requests ·{' '}
              {query.data.discovery.coverage.gaps.length} gaps ·{' '}
              {query.data.discovery.candidates.length} candidates.
            </p>
            <p>
              Bounded scan only. Nonstandard approvals, earlier blocks, NFTs,
              offchain signatures, silent allowance changes and provider
              omissions may be missing. Current verification block:{' '}
              {query.data.verification.blockNumber.toString()}.
            </p>
            {query.data.discovery.coverage.warnings.map((warning, i) => (
              <p role="alert" key={`${i}:${warning}`}>
                {warning}
              </p>
            ))}
            <p>
              {query.data.verification.failures.length} candidate state reads
              failed; these are unknown.
            </p>
            {query.data.verification.rows.map((row) => (
              <PermissionRecord key={row.id} row={row} />
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

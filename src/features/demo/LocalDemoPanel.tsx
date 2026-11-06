import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { parseAddress } from '../wallet/address';
import { useInspectionSession } from '../wallet/session';
import { usePairStore } from '../erc20/pairStore';
import { scanAllowances } from '../erc20/engine';
import { tokenAmount } from '../erc20/amounts';
import type { AllowanceScan } from '../erc20/types';
import { PermissionRecord } from '../erc20/AllowanceInventory';
import { revocationIntent } from '../revocation/engine';
import { anonRpc, useAnonRpc } from '../anon-rpc/runtime';
import type { AnonymousTransport } from '../anon-rpc/transportRegistry';

function localConfig() {
  const owner = import.meta.env.VITE_DEMO_OWNER,
    token = import.meta.env.VITE_DEMO_TOKEN,
    spender = import.meta.env.VITE_DEMO_SPENDER;
  if (!owner || !token || !spender) return null;
  try {
    return {
      owner: parseAddress(owner),
      token: parseAddress(token),
      spender: parseAddress(spender),
    };
  } catch {
    return null;
  }
}
export function LocalDemoPanel() {
  const [config] = useState(localConfig),
    [running, setRunning] = useState(false),
    [result, setResult] = useState<{
      scan: AllowanceScan;
      managerId: string;
      revision: number;
      transport: AnonymousTransport;
    } | null>(null),
    [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const cache = useQueryClient();
  const transport = useAnonRpc();
  const session = useInspectionSession();
  useEffect(() => () => controller.current?.abort(), []);
  if (!config) return null;
  const visible =
    result &&
    session.target?.address === result.scan.owner &&
    session.target.chainId === 11155111 &&
    session.revision === result.revision &&
    anonRpc.current().sessionId === result.managerId
      ? result
      : null;
  async function load() {
    if (!config) return;
    controller.current?.abort();
    const attempt = new AbortController();
    controller.current = attempt;
    setRunning(true);
    setResult(null);
    setError('');
    const manager = anonRpc.current();
    const initialRevision = useInspectionSession.getState().revision;
    const pair = {
      token: config.token,
      spender: config.spender,
      source: 'manual' as const,
    };
    try {
      await cache.cancelQueries({ queryKey: ['account'] });
      const scan = await scanAllowances(
        manager,
        config.owner,
        11155111,
        [pair],
        { signal: attempt.signal },
      );
      attempt.signal.throwIfAborted();
      if (
        manager !== anonRpc.current() ||
        initialRevision !== useInspectionSession.getState().revision
      )
        throw new Error('Changed inspection');
      if (scan.rows.length !== 1) throw new Error('Unreadable demo token');
      useInspectionSession.getState().inspect(config.owner, 11155111);
      const revision = useInspectionSession.getState().revision;
      usePairStore.getState().add(11155111, [pair]);
      cache.setQueryData(
        [
          'local-demo',
          11155111,
          config.owner,
          manager.transport,
          manager.sessionId,
          revision,
        ],
        scan,
      );
      setResult({
        scan,
        managerId: manager.sessionId,
        revision,
        transport: manager.transport,
      });
    } catch {
      setError(
        'Local demo read failed or context changed. Check the configured addresses and selected anonymous worker. No transaction was requested.',
      );
    } finally {
      setRunning(false);
    }
  }
  return (
    <Panel
      title="Local Sepolia demonstration"
      description="Development-only public addresses from ignored .env.local. Results below are actual worker reads, never fixtures."
    >
      <div className="panel-body">
        <p>
          Nothing loads until you request it. The allowance is preserved.
          Preparing unsigned calldata does not submit a transaction; full
          preflight and owner confirmation remain separate.
        </p>
        <Button disabled={running} onClick={() => void load()}>
          Load configured Sepolia demo
        </Button>
        {running && (
          <p role="status">
            Reading the configured pair through {transport.transport}…
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        {visible?.scan.rows.map((row) => {
          const intent = revocationIntent(row);
          return (
            <div key={row.id}>
              <p role="status" data-testid="configured-demo-live-status">
                Verified allowance: {tokenAmount(row.amount, row.decimals)}{' '}
                {row.symbol} · {row.decimals} decimals · Raw units{' '}
                {row.amount.toString()} · {visible.transport}
              </p>
              <PermissionRecord row={row} />
              <details className="disclosure">
                <summary>Unsigned revocation transaction</summary>
                <p>To: {intent.to} · Value: 0 ETH · approve(spender, 0)</p>
                <p className="address-value">Calldata: {intent.data}</p>
                <p>No wallet signing or submission has been requested.</p>
              </details>
              <Link
                className="text-link"
                to={`/permissions/${encodeURIComponent(row.id)}`}
              >
                Review owner-authorized revocation
              </Link>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

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
import type { AllowanceScan, AllowanceStage } from '../erc20/types';
import { PermissionRecord } from '../erc20/AllowanceInventory';
import { revocationIntent } from '../revocation/engine';
import { anonRpc, useAnonRpc } from '../anon-rpc/runtime';
import type { AnonymousTransport } from '../anon-rpc/transportRegistry';
import { permissionPath } from '../exposure/permissionRoutes';
import { boundedDemoRead } from './read';

const stages: Record<AllowanceStage, string> = {
  initializing: 'Starting the anonymous worker and waiting for its network',
  'checking-network': 'Verifying the Sepolia network',
  'pinning-block': 'Selecting and checking the read block',
  'reading-token': 'Reading token metadata, balance and current allowance',
  'checking-snapshot': 'Checking that the verified block has not changed',
};

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
    [error, setError] = useState(''),
    [stage, setStage] = useState<AllowanceStage>('initializing'),
    [elapsed, setElapsed] = useState(0),
    [cancelled, setCancelled] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const started = useRef(0);
  const cache = useQueryClient();
  const transport = useAnonRpc();
  const session = useInspectionSession();
  useEffect(
    () => () => {
      const attempt = controller.current;
      controller.current = null;
      attempt?.abort();
    },
    [],
  );
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () =>
        setElapsed(Math.floor((performance.now() - started.current) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [running]);
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
    if (!config || controller.current) return;
    const attempt = new AbortController();
    controller.current = attempt;
    setRunning(true);
    setResult(null);
    setError('');
    setCancelled(false);
    setStage('initializing');
    started.current = performance.now();
    setElapsed(0);
    const manager = anonRpc.current();
    const initialRevision = useInspectionSession.getState().revision;
    const pair = {
      token: config.token,
      spender: config.spender,
      source: 'manual' as const,
    };
    try {
      const scan = await boundedDemoRead(async (signal) => {
        await cache.cancelQueries({ queryKey: ['account'] });
        signal.throwIfAborted();
        return scanAllowances(manager, config.owner, 11155111, [pair], {
          signal,
          onStage(next) {
            if (controller.current === attempt && !signal.aborted)
              setStage(next);
          },
        });
      }, attempt.signal);
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
    } catch (cause) {
      if (controller.current !== attempt) return;
      if (attempt.signal.aborted) setCancelled(true);
      else if (
        cause &&
        typeof cause === 'object' &&
        'name' in cause &&
        cause.name === 'TimeoutError'
      )
        setError(
          'Local demo read timed out. This attempt reached the 4-minute limit; no result was verified. Open Privacy Lab to check the worker or explicitly select another anonymous transport. No direct fallback or transaction was requested.',
        );
      else
        setError(
          'Local demo read failed or context changed. The anonymous worker or configured token pair could not be verified. Check Privacy Lab before retrying. This is not a zero allowance. No direct fallback or transaction was requested.',
        );
    } finally {
      if (controller.current === attempt) {
        controller.current = null;
        setRunning(false);
      }
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
        <p>
          This read uses Sepolia through the selected anonymous worker. MetaMask
          is only needed for signing.
        </p>
        <div className="component-row">
          <Button disabled={running} onClick={() => void load()}>
            Load configured Sepolia demo
          </Button>
          {running && (
            <Button onClick={() => controller.current?.abort()}>
              Cancel demo read
            </Button>
          )}
        </div>
        {running && (
          <>
            <p role="status" data-testid="demo-read-stage">
              {stages[stage]} via {transport.transport}.
            </p>
            <p data-testid="demo-read-elapsed" aria-live="off">
              {elapsed} seconds elapsed. This attempt stops after 4 minutes.
            </p>
            <p>
              Anonymous startup and reads can be slow. You can cancel this demo
              read without signing anything.
            </p>
          </>
        )}
        {cancelled && (
          <p role="status">
            Demo read cancelled. No transaction was requested. A shared worker
            may still initialize; close it in Privacy Lab to stop that worker.
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        {!running && (error || cancelled) && transport.transport === 'nym' && (
          <Button
            onClick={() => {
              anonRpc.selectTransport('nox');
              void load();
            }}
          >
            Try Nox anonymously on Sepolia
          </Button>
        )}
        {(error || cancelled) && (
          <p>
            <Link className="text-link" to="/privacy">
              Open Privacy Lab diagnostics
            </Link>
          </p>
        )}
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
              <Link className="text-link" to={permissionPath(row.id)}>
                Review owner-authorized revocation
              </Link>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

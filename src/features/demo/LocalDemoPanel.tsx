import { useEffect, useRef, useState } from 'react';
import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { permissionPath } from '../exposure/permissionRoutes';
import { useTransactions } from '../revocation/store';
import { boundedDemoRead } from './read';
import { DemoReadError, demoFailure, demoQueryKey, demoStages } from './status';

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
    [error, setError] = useState(''),
    [stage, setStage] = useState<AllowanceStage>('initializing'),
    [elapsed, setElapsed] = useState(0),
    [cancelled, setCancelled] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const started = useRef(0);
  const cache = useQueryClient();
  const transport = useAnonRpc();
  const session = useInspectionSession();
  const transactionBusy = useTransactions((state) => state.busy);
  const manager = anonRpc.current();
  // Observe only snapshots written by an explicit successful read. Never fetch
  // on mount, navigation, focus, invalidation or reconnect.
  const snapshot = useQuery<AllowanceScan>({
    queryKey: demoQueryKey(
      config?.owner ?? '',
      transport.transport,
      manager.sessionId,
      session.revision,
    ),
    queryFn: skipToken,
  });
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
    !running &&
    !error &&
    !cancelled &&
    snapshot.data &&
    session.target?.address === config.owner &&
    session.target.chainId === 11155111 &&
    snapshot.data.owner === config.owner &&
    snapshot.data.chainId === 11155111 &&
    snapshot.data.rows.length === 1 &&
    snapshot.data.rows[0]?.token === config.token &&
    snapshot.data.rows[0]?.spender === config.spender
      ? snapshot.data
      : null;
  async function load() {
    if (!config || controller.current) return;
    const attempt = new AbortController();
    controller.current = attempt;
    setRunning(true);
    setError('');
    setCancelled(false);
    setStage('initializing');
    started.current = performance.now();
    setElapsed(0);
    const manager = anonRpc.current();
    const initialRevision = useInspectionSession.getState().revision;
    let lastStage: AllowanceStage = 'initializing';
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
            if (controller.current === attempt && !signal.aborted) {
              lastStage = next;
              setStage(next);
            }
          },
        });
      }, attempt.signal);
      attempt.signal.throwIfAborted();
      if (
        manager !== anonRpc.current() ||
        initialRevision !== useInspectionSession.getState().revision
      )
        throw new DemoReadError('context-changed');
      if (scan.rows.length !== 1 || scan.failures.length)
        throw new DemoReadError('pair-unverified');
      useInspectionSession.getState().inspect(config.owner, 11155111);
      const revision = useInspectionSession.getState().revision;
      usePairStore.getState().add(11155111, [pair]);
      cache.setQueryData(
        demoQueryKey(
          config.owner,
          manager.transport,
          manager.sessionId,
          revision,
        ),
        scan,
      );
    } catch (cause) {
      if (controller.current !== attempt) return;
      if (attempt.signal.aborted) setCancelled(true);
      else
        setError(
          demoFailure(
            manager !== anonRpc.current() ||
              initialRevision !== useInspectionSession.getState().revision
              ? new DemoReadError('context-changed')
              : cause,
            lastStage,
            manager.transport,
            manager.getSnapshot().phase,
          ),
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
          Loading reads state only; it cannot change an allowance. Preparing
          unsigned calldata does not submit a transaction; full preflight and
          owner confirmation remain separate.
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
              {demoStages[stage]} via {transport.transport}.
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
        {!running && transport.transport !== 'tor-js' && (
          <div>
            <Button
              disabled={transactionBusy}
              onClick={() => {
                if (useTransactions.getState().busy) return;
                anonRpc.selectTransport(transport.transport);
                void load();
              }}
            >
              Restart {transport.transport === 'nox' ? 'Nox' : 'Nym'} and retry
              anonymously
            </Button>
            <p>
              Restart closes the selected worker and cancels its other reads.
              Wallet connection is unchanged. Restart is disabled while a
              transaction workflow is active.
            </p>
          </div>
        )}
        {!running && (error || cancelled) && transport.transport === 'nym' && (
          <Button
            disabled={transactionBusy}
            onClick={() => {
              if (useTransactions.getState().busy) return;
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
        {visible?.rows.map((row) => {
          const intent = revocationIntent(row);
          return (
            <div key={row.id}>
              <p role="status" data-testid="configured-demo-live-status">
                Verified allowance: {tokenAmount(row.amount, row.decimals)}{' '}
                {row.symbol} · {row.decimals} decimals · Raw units{' '}
                {row.amount.toString()} · {transport.transport}
              </p>
              <p data-testid="demo-snapshot-note">
                Snapshot verified at block {row.blockNumber.toString()} on{' '}
                {new Date(row.readAt).toLocaleString()}. Returning to this page
                reuses this session snapshot; it is not a new read. Revocation
                requires fresh checks.
              </p>
              <PermissionRecord row={row} />
              <details className="disclosure">
                <summary>Unsigned revocation transaction</summary>
                <p>To: {intent.to} · Value: 0 ETH · approve(spender, 0)</p>
                <p className="address-value">Calldata: {intent.data}</p>
                <p>No wallet signing or submission has been requested.</p>
              </details>
              <Link
                className="button button-primary button-md"
                to={permissionPath(row.id)}
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

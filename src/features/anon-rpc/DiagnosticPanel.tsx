import { useEffect, useRef, useState } from 'react';
import { anonRpc, useAnonRpc } from './runtime';
import { rpcQuantity } from './JsonRpcAdapter';
import { Button } from '../../components/ui/Button';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { workerStatus } from './recovery';
import {
  WORKERS,
  validKpsGateway,
  type AnonymousTransport,
} from './transportRegistry';

export function DiagnosticPanel() {
  const transport = useAnonRpc();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gateway, setGateway] = useState('');
  const controller = useRef<AbortController | null>(null);
  const [proof, setProof] = useState<{
    chainId?: string;
    block?: string;
    balance?: string;
  } | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const run = async () => {
    if (controller.current) return;
    const attempt = new AbortController();
    controller.current = attempt;
    setRunning(true);
    setError(null);
    setResult(null);
    setProof(null);
    const manager = anonRpc.current();
    const current = () => {
      attempt.signal.throwIfAborted();
      if (manager !== anonRpc.current())
        throw new DOMException('Worker changed', 'AbortError');
    };
    try {
      await manager.initialize();
      current();
      const chain = rpcQuantity(
        await manager.request(11155111, 'eth_chainId', [], attempt.signal),
      );
      if (chain !== 11155111n) throw new Error('Wrong destination network');
      current();
      setProof({ chainId: chain.toString() });
      const block = rpcQuantity(
        await manager.request(11155111, 'eth_blockNumber', [], attempt.signal),
      );
      current();
      setProof({ chainId: chain.toString(), block: block.toString() });
      const balance = rpcQuantity(
        await manager.request(
          11155111,
          'eth_getBalance',
          ['0x0000000000000000000000000000000000000000', 'latest'],
          attempt.signal,
        ),
      );
      current();
      setProof({
        chainId: chain.toString(),
        block: block.toString(),
        balance: balance.toString(),
      });
      setResult(
        `Sepolia block ${block}; zero-address balance ${balance} wei. Responses received via the hash-verified ${WORKERS[manager.transport].label} worker.`,
      );
    } catch (cause) {
      setError(
        `Diagnostic failed: ${
          cause instanceof Error
            ? cause.message
                .slice(0, 400)
                .replace(/https?:\/\/[^\s;)]+/g, '[worker resource]')
                .replace(/0x[a-f0-9]{40,}/gi, '[address]')
            : 'Unknown request error'
        }. No direct fallback was used.`,
      );
    } finally {
      if (controller.current === attempt) {
        controller.current = null;
        setRunning(false);
      }
    }
  };
  return (
    <Panel
      title="Live anonymous RPC diagnostic"
      description="Explicitly starts the selected official worker. Bootstrap hash/resolver reads are direct; the destination provider still sees query contents."
      action={<Badge>{workerStatus(transport)}</Badge>}
    >
      <div className="panel-body prose-copy">
        <p>
          Nym is the primary anonymous transport. Tor is optional and requires
          an operational authenticated KPS gateway. No automatic fallback is
          used. This diagnostic reads the zero address on Sepolia, not a scanned
          wallet.
        </p>
        <div className="form-field">
          <label htmlFor="anonymous-transport">Anonymous transport</label>
          <select
            id="anonymous-transport"
            value={transport.transport}
            disabled={running}
            onChange={(event) => {
              setResult(null);
              setError(null);
              setProof(null);
              anonRpc.selectTransport(event.target.value as AnonymousTransport);
            }}
          >
            <option value="nym">Nym · Primary</option>
            <option value="nox">Nox · Sepolia alternative</option>
            <option value="tor-js">Tor · Requires gateway</option>
          </select>
        </div>
        {transport.transport === 'tor-js' && (
          <div className="form-field">
            <label htmlFor="tor-gateway">
              Authenticated Tor KPS gateway (IPv4:port:certhash)
            </label>
            <input
              id="tor-gateway"
              value={gateway}
              onChange={(event) => setGateway(event.target.value.trim())}
              disabled={running}
              autoComplete="off"
              spellCheck={false}
            />
            <Button
              disabled={running || !validKpsGateway(gateway)}
              onClick={() => {
                anonRpc.selectTransport('tor-js', gateway);
                setResult(null);
              }}
            >
              Use configured gateway
            </Button>
            <small>
              Syntax validation does not prove reachability. The harness
              verifies the worker and KPS authenticates the peer certificate.
            </small>
          </div>
        )}
        <div className="component-row">
          <Button
            onClick={() => void run()}
            disabled={running || transport.phase === 'unavailable'}
          >
            Run live anonymous diagnostic
          </Button>
          <Button
            onClick={() => {
              controller.current?.abort();
              anonRpc.close();
            }}
          >
            Close worker
          </Button>
        </div>
        {running && (
          <p role="status">
            Initializing or querying {WORKERS[transport.transport].label}… No
            fallback permitted.
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        {error && transport.transport === 'nym' && !running && (
          <Button
            onClick={() => {
              anonRpc.selectTransport('nox');
              void run();
            }}
          >
            Try Nox anonymously on Sepolia
          </Button>
        )}
        {proof && (
          <dl
            className="compact-definitions"
            aria-label="Actual diagnostic responses"
          >
            <div>
              <dt>Chain ID returned</dt>
              <dd data-testid="diagnostic-chain">
                {proof.chainId ?? 'Not returned'}
              </dd>
            </div>
            <div>
              <dt>Block returned</dt>
              <dd data-testid="diagnostic-block">
                {proof.block ?? 'Not returned'}
              </dd>
            </div>
            <div>
              <dt>Zero-address balance returned</dt>
              <dd data-testid="diagnostic-balance">
                {proof.balance === undefined
                  ? 'Not returned'
                  : `${proof.balance} wei`}
              </dd>
            </div>
          </dl>
        )}
        {transport.error && <p>{transport.error}</p>}
        {transport.bootstrapStatus && (
          <p data-testid="bootstrap-detail">{transport.bootstrapStatus}</p>
        )}
        {result && (
          <p role="status" data-testid="live-rpc-result">
            {result}
          </p>
        )}
        <dl className="compact-definitions">
          <div>
            <dt>Bootstrap-reported code hash</dt>
            <dd style={{ overflowWrap: 'anywhere' }}>
              {transport.verifiedHash ?? 'Not resolved'}{' '}
              {transport.phase === 'ready'
                ? '· Harness verified and worker ready'
                : '· Not verified ready'}
            </dd>
          </div>
          <div>
            <dt>Successful worker responses this session</dt>
            <dd>{transport.successfulWorkerReads}</dd>
          </div>
          <div>
            <dt>Recorded bootstrap reads</dt>
            <dd>
              {
                transport.metrics.filter(
                  (metric) => metric.category === 'bootstrap',
                ).length
              }
            </dd>
          </div>
        </dl>
      </div>
    </Panel>
  );
}

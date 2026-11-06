import { useState } from 'react';
import { Download, Fingerprint, Gauge, Network, Route } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { StatePanel } from '../components/ui/StatePanel';
import { MetricCard } from '../components/dashboard/MetricCard';
import { TransportReadiness } from '../components/privacy/TransportReadiness';
import { DiagnosticPanel } from '../features/anon-rpc/DiagnosticPanel';
import { anonRpc, useAnonRpc } from '../features/anon-rpc/runtime';
import { workerStatus } from '../features/anon-rpc/recovery';
import { WORKERS } from '../features/anon-rpc/transportRegistry';
import {
  retainedMedian,
  routingPercentage,
} from '../features/privacy-report/ledger';
import { downloadReport } from '../features/privacy-report/export';

export function PrivacyPage() {
  const transport = useAnonRpc(),
    { totals } = transport;
  const [category, setCategory] = useState('all'),
    [page, setPage] = useState(0),
    [exportError, setExportError] = useState(false);
  const filtered = transport.metrics
    .filter((row) => category === 'all' || row.category === category)
    .slice()
    .reverse();
  const pages = Math.max(1, Math.ceil(filtered.length / 25)),
    current = Math.min(page, pages - 1),
    rows = filtered.slice(current * 25, current * 25 + 25);
  const median = retainedMedian(transport.metrics),
    share = routingPercentage(totals),
    read = totals.read;
  return (
    <div className="page">
      <PageHeader
        eyebrow="TRANSPORT TRANSPARENCY"
        title="Privacy Lab"
        description="Measured routes, explicit exclusions, and local evidence."
        action={
          <Button
            aria-describedby="export-help"
            onClick={() => {
              try {
                downloadReport(anonRpc.getSnapshot());
                setExportError(false);
              } catch {
                setExportError(true);
              }
            }}
          >
            <Download size={16} aria-hidden="true" />
            Export report
          </Button>
        }
      />
      {exportError && (
        <p role="alert">
          Report download failed. Check browser download permissions.
        </p>
      )}
      <section className="panel privacy-status">
        <div className="privacy-banner-icon">
          <Fingerprint size={30} aria-hidden="true" />
        </div>
        <div>
          <Badge tone="violet">{workerStatus(transport)}</Badge>
          <h2>
            {transport.phase === 'ready'
              ? `Hash-verified ${WORKERS[transport.transport].label} worker ready`
              : 'No active anonymizing transport'}
          </h2>
          <p>
            The official harness verifies worker bytes and preserves its
            sandbox. Only successful worker RPC responses count as anonymized.
            There is no direct-RPC or passthrough fallback. Loading this page
            alone makes no RPC requests.
          </p>
        </div>
      </section>
      <div className="summary-grid">
        <MetricCard
          title="Application reads"
          icon={Network}
          value={String(read.completed)}
          detail="Completed session attempts; includes failed and cancelled reads"
        />
        <MetricCard
          title="Anonymous routing"
          icon={Fingerprint}
          value={share ?? 'No reads'}
          detail={`${read.anonymized} successful anonymous responses / ${read.completed} completed application attempts`}
        />
        <MetricCard
          title="Direct exceptions"
          icon={Route}
          value={String(totals.bootstrap.completed)}
          detail="Fixed worker-specifier bootstrap only; excluded from read share"
        />
        <MetricCard
          title="Median latency"
          icon={Gauge}
          value={median === null ? 'No sample' : `${median} ms`}
          detail="Successful read responses in the retained ledger only"
        />
      </div>
      <DiagnosticPanel />
      <div className="two-column">
        <TransportReadiness />
        <Panel title="Transport availability">
          <ul className="readiness-list">
            {Object.entries(WORKERS).map(([name, worker]) => (
              <li key={name}>
                <strong>{worker.label}</strong>
                <span>
                  {name === transport.transport
                    ? transport.phase === 'ready'
                      ? `${workerStatus(transport)}; harness readiness is separate`
                      : transport.phase
                    : 'Not selected; no active worker'}
                </span>
                <Badge>
                  {name === 'nym'
                    ? 'Primary'
                    : name === 'nox'
                      ? 'Sepolia only'
                      : 'Authenticated KPS required'}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="panel-footnote">
            Availability is observed for the selected worker only. Prior
            successes do not guarantee present connectivity. Tor's failed
            demonstration gateway is not retried automatically.
          </p>
        </Panel>
      </div>
      <Panel title="Accounting boundaries">
        <div className="panel-body">
          <dl className="compact-definitions">
            <div>
              <dt>Application reads</dt>
              <dd>
                {read.successful} successful · {read.failed} failed ·{' '}
                {read.cancelled} cancelled. Failure rate:{' '}
                {read.completed
                  ? `${((read.failed / read.completed) * 100).toFixed(1)}%`
                  : 'No attempts'}
                . Mean successful latency for the full session:{' '}
                {read.successful
                  ? `${Math.round(read.successfulDurationMs / read.successful)} ms`
                  : 'No sample'}
                .
              </dd>
            </div>
            <div>
              <dt>Bootstrap exceptions</dt>
              <dd>
                {totals.bootstrap.completed} fixed specifier calls ·{' '}
                {totals.bootstrap.failed} failed. These direct calls contain no
                scanned owner. Worker code resolution, Nym gateway selection and
                network bootstrap also contact external infrastructure; their
                internal operations are not all visible here.
              </dd>
            </div>
            <div>
              <dt>Wallet activity</dt>
              <dd>
                {totals.wallet.completed} completed wallet API calls ·{' '}
                {totals.walletSubmissions} transaction-submission requests.
                Wallet-local account/network queries and submissions are outside
                the anonymous-read denominator. Internal extension RPC traffic
                and account-change events cannot be counted as application
                requests.
              </dd>
            </div>
            <div>
              <dt>Anonymous-read share</dt>
              <dd>
                Successful anonymous worker RPC responses divided by all
                completed application read attempts. Failed and cancelled reads
                stay in that denominator. Bootstrap and wallet calls are
                excluded and reported separately. In-flight requests enter
                totals when they settle.
              </dd>
            </div>
          </dl>
        </div>
      </Panel>
      <Panel
        title="Observed routes"
        description="Counts persist for this page session even when the bounded ledger rolls over."
      >
        <ul className="readiness-list">
          {Object.entries(totals.routes).map(([route, count]) => (
            <li key={route}>
              <strong>{route}</strong>
              <span>
                {count?.completed} completed · {count?.successful} successful ·{' '}
                {count?.failed} failed · {count?.cancelled} cancelled
              </span>
            </li>
          ))}
        </ul>
        {Object.keys(totals.routes).length === 0 && (
          <p className="panel-footnote">No observed routes yet.</p>
        )}
      </Panel>
      <Panel
        title="Request ledger"
        description="Timestamps, chains, actual worker attempts and terminal outcomes. No payloads."
        action={<Badge>{transport.metrics.length} retained records</Badge>}
      >
        <div className="panel-body">
          <label htmlFor="ledger-category">Request category</label>
          <select
            id="ledger-category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(0);
            }}
          >
            {['all', 'read', 'bootstrap', 'wallet'].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          {filtered.length === 0 ? (
            <StatePanel
              title="No request ledger yet"
              description="No matching requests have been recorded. Run the opt-in diagnostic or inspect an account to record worker activity."
            />
          ) : (
            <>
              <div className="desktop-inventory">
                <table>
                  <caption>Measured RPC request ledger</caption>
                  <thead>
                    <tr>
                      {[
                        'Time / chain',
                        'Method / category',
                        'Requested / actual route',
                        'Outcome',
                        'Latency',
                      ].map((label) => (
                        <th scope="col" key={label}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          {row.timestamp}
                          <br />
                          {row.chainId || 'Wallet chain unspecified'}
                        </td>
                        <td>
                          {row.method}
                          <br />
                          {row.category}
                        </td>
                        <td>
                          {row.requestedTransport} / {row.actualTransport}
                        </td>
                        <td>
                          {row.outcome}
                          {row.anonymized ? ' · Anonymous response' : ''}
                        </td>
                        <td>{row.durationMs} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="mobile-inventory permission-cards">
                {rows.map((row) => (
                  <li className="permission-card" key={row.id}>
                    <strong>
                      {row.method} · {row.category}
                    </strong>
                    <p>
                      {row.timestamp} · Chain {row.chainId || 'unspecified'}
                    </p>
                    <p>
                      {row.requestedTransport} → {row.actualTransport} ·{' '}
                      {row.outcome} · {row.durationMs} ms
                    </p>
                    <p>
                      {row.anonymized
                        ? 'Successful anonymous response'
                        : row.directException
                          ? 'Direct bootstrap exception'
                          : 'No successful anonymous-response claim'}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="button-row">
                <Button
                  disabled={current === 0}
                  onClick={() => setPage(current - 1)}
                >
                  Previous requests
                </Button>
                <span>
                  Page {current + 1} of {pages}
                </span>
                <Button
                  disabled={current >= pages - 1}
                  onClick={() => setPage(current + 1)}
                >
                  Next requests
                </Button>
              </div>
            </>
          )}
          <p id="export-help">
            Export uses a field whitelist: counts, method, chain, transport,
            outcome, duration and timestamps. No owner addresses, parameters,
            transaction hashes, KPS credentials or raw error text. The latest
            1,000 settled records are retained; full-session counters remain
            separate. Reload clears application metrics. No analytics or secret
            storage.
          </p>
        </div>
      </Panel>
      <div className="privacy-boundary">
        <Fingerprint size={20} aria-hidden="true" />
        <p>
          <strong>Anonymous routing has boundaries.</strong> Destination RPC
          providers still see query contents, including the scanned address.
          Timing and correlation attacks remain possible. Wallet submissions and
          public onchain transactions are not anonymous. Anon-RPC's worker may
          maintain its own public-resource IndexedDB cache; application target
          data and metrics stay in memory.
        </p>
      </div>
    </div>
  );
}

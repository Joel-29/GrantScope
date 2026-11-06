import { Download, Fingerprint, Gauge, Network, Route } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { StatePanel } from '../components/ui/StatePanel';
import { MetricCard } from '../components/dashboard/MetricCard';
import { TransportReadiness } from '../components/privacy/TransportReadiness';
import { DiagnosticPanel } from '../features/anon-rpc/DiagnosticPanel';
import { useAnonRpc } from '../features/anon-rpc/runtime';
import { WORKERS } from '../features/anon-rpc/transportRegistry';

export function PrivacyPage() {
  const transport = useAnonRpc();
  return (
    <div className="page">
      <PageHeader
        eyebrow="TRANSPORT TRANSPARENCY"
        title="Privacy Lab"
        description="Follow the route. Understand the exceptions. Make privacy claims with evidence."
        action={
          <Button disabled aria-describedby="export-help">
            <Download size={16} aria-hidden="true" />
            Export report
          </Button>
        }
      />
      <section className="panel privacy-status">
        <div className="privacy-banner-icon">
          <Fingerprint size={30} aria-hidden="true" />
        </div>
        <div>
          <Badge tone="violet">{transport.phase}</Badge>
          <h2>
            {transport.phase === 'ready'
              ? `Hash-verified ${WORKERS[transport.transport].label} worker ready`
              : 'No active anonymizing transport'}
          </h2>
          <p>
            The official harness verifies worker bytes and preserves sandbox
            isolation. Routing is only recorded successful after a worker
            response. No silent direct RPC fallback exists. The diagnostic is
            opt-in.
          </p>
        </div>
      </section>
      <div className="summary-grid">
        {[
          {
            title: 'Application reads',
            icon: Network,
            detail: `${transport.metrics.filter((item) => item.category === 'read').length} recorded attempts in retained ledger`,
          },
          {
            title: 'Anonymous routing',
            icon: Fingerprint,
            detail: `${transport.metrics.filter((item) => item.anonymized).length} successful responses in retained ledger`,
          },
          {
            title: 'Direct exceptions',
            icon: Route,
            detail: `${transport.metrics.filter((item) => item.category === 'bootstrap').length} disclosed bootstrap attempts`,
          },
          {
            title: 'Median latency',
            icon: Gauge,
            detail: 'See per-request durations below',
          },
        ].map((item) => (
          <MetricCard key={item.title} {...item} />
        ))}
      </div>
      <DiagnosticPanel />
      <div className="two-column">
        <TransportReadiness />
        <Panel title="Accounting boundaries">
          <dl className="compact-definitions">
            <div>
              <dt>RPC reads</dt>
              <dd>
                Successful anonymous reads will be counted against all recorded
                application read attempts; failures remain visible.
              </dd>
            </div>
            <div>
              <dt>Bootstrap reads</dt>
              <dd>
                Direct worker-specifier reads will be separate exceptions.
              </dd>
            </div>
            <div>
              <dt>Wallet submissions</dt>
              <dd>
                Reported separately, without claiming visibility into all
                extension traffic.
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
      <Panel
        title="Request ledger"
        description="Only instrumented application requests belong here."
        action={<Badge>{transport.metrics.length} retained records</Badge>}
      >
        <div className="ledger-head" aria-hidden="true">
          <span>RPC method</span>
          <span>Actual route</span>
          <span>Outcome</span>
          <span>Latency</span>
        </div>
        {transport.metrics.length === 0 ? (
          <StatePanel
            title="No request ledger yet"
            description="No requests have been recorded. Explicitly run the diagnostic to initialize Tor. Loading this page alone makes no RPC requests."
          />
        ) : (
          <div className="panel-body">
            <ul className="readiness-list">
              {transport.metrics.map((item) => (
                <li key={item.id}>
                  <strong>{item.method}</strong>
                  <span>
                    {item.actualTransport} · {item.outcome} · {item.durationMs}{' '}
                    ms
                  </span>
                  <Badge>{item.category}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p id="export-help" className="panel-footnote">
          Detailed export is planned for Module 10. Ledger is bounded to the
          latest 1,000 application requests; it does not contain addresses or
          payloads.
        </p>
      </Panel>
      <div className="privacy-boundary">
        <Fingerprint size={20} aria-hidden="true" />
        <p>
          <strong>Anonymous routing has boundaries.</strong> The destination RPC
          provider can still see query contents, including the address.
          Transactions remain public onchain. Wallet-provider submissions are
          not anonymous by default.
        </p>
      </div>
    </div>
  );
}

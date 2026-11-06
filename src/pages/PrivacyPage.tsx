import { Download, Fingerprint, Gauge, Network, Route } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { StatePanel } from '../components/ui/StatePanel';
import { MetricCard } from '../components/dashboard/MetricCard';
import { TransportReadiness } from '../components/privacy/TransportReadiness';

export function PrivacyPage() {
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
          <Badge tone="violet">Not initialized</Badge>
          <h2>No active anonymizing transport</h2>
          <p>
            The official browser harness and anonymous worker have not been
            integrated. No request ledger is active, and no routing percentage
            has been measured.
          </p>
        </div>
      </section>
      <div className="summary-grid">
        {[
          {
            title: 'Application reads',
            icon: Network,
            detail: 'Request instrumentation not active',
          },
          {
            title: 'Anonymous routing',
            icon: Fingerprint,
            detail: 'No successful worker requests',
          },
          {
            title: 'Direct exceptions',
            icon: Route,
            detail: 'Bootstrap accounting not active',
          },
          {
            title: 'Median latency',
            icon: Gauge,
            detail: 'No request durations recorded',
          },
        ].map((item) => (
          <MetricCard key={item.title} {...item} />
        ))}
      </div>
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
        action={<Badge>No request instrumentation</Badge>}
      >
        <div className="ledger-head" aria-hidden="true">
          <span>RPC method</span>
          <span>Actual route</span>
          <span>Outcome</span>
          <span>Latency</span>
        </div>
        <StatePanel
          title="No request ledger yet"
          description="There is no traffic to classify or export. This page makes no RPC requests and does not infer worker health from the interface."
        />
        <p id="export-help" className="panel-footnote">
          Export is unavailable until sanitized, instrumented request metrics
          exist.
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

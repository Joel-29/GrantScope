import { Fingerprint, Info } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';

export function PrivacyPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="TRANSPORT TRANSPARENCY"
        title="Privacy Lab"
        description="Privacy claims should be backed by a request’s actual route."
      />
      <section className="panel privacy-status">
        <div className="privacy-banner-icon">
          <Fingerprint size={30} aria-hidden="true" />
        </div>
        <div>
          <span className="tag">Not initialized</span>
          <h2>No active anonymizing transport</h2>
          <p>
            The official browser harness and anonymous worker have not been
            integrated. No request ledger is active, and no routing percentage
            has been measured.
          </p>
        </div>
      </section>
      <section className="panel prose-panel">
        <h2>What the report will account for</h2>
        <dl className="definition-list">
          <div>
            <dt>Application RPC reads</dt>
            <dd>
              Actual worker route, outcome, and latency. A successful anonymous
              request is required before showing an anonymized indicator.
            </dd>
          </div>
          <div>
            <dt>Bootstrap exceptions</dt>
            <dd>
              Direct worker-specifier reads will be counted separately and
              disclosed.
            </dd>
          </div>
          <div>
            <dt>Wallet submissions</dt>
            <dd>
              Wallet-provider submissions will be separate. The application
              cannot observe all extension network traffic.
            </dd>
          </div>
        </dl>
        <p className="inline-note">
          <Info size={18} aria-hidden="true" />
          Anon-RPC does not hide public onchain transactions or the queried
          address from the destination RPC provider.
        </p>
      </section>
    </div>
  );
}

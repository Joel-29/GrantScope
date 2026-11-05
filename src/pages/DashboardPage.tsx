import { Fingerprint, Layers3, ScanLine, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';

export function DashboardPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="YOUR WORKSPACE"
        title="Wallet overview"
        description="A clear view starts with verified onchain state."
      />
      <div className="notice">
        <ShieldCheck size={19} aria-hidden="true" />
        <p>
          <strong>Foundation build</strong> Wallet inspection will become
          available after the privacy transport is implemented and verified.
        </p>
      </div>
      <div className="summary-grid">
        {[
          { label: 'Active grants', icon: Layers3 },
          { label: 'Review suggested', icon: ShieldCheck },
          { label: 'Scan coverage', icon: ScanLine },
          { label: 'Anonymous routing', icon: Fingerprint },
        ].map(({ label, icon: Icon }) => (
          <section className="summary-card" key={label}>
            <div>
              <span>{label}</span>
              <Icon size={18} aria-hidden="true" />
            </div>
            <strong aria-label="Not measured">—</strong>
            <p>Not measured</p>
          </section>
        ))}
      </div>
      <div className="panel">
        <div className="panel-heading">
          <h2>Permission inventory</h2>
          <span className="tag">Not scanned</span>
        </div>
        <EmptyState title="No wallet has been inspected">
          <p>
            Live balances, allowances, account type, and scan history are
            unavailable in this module. No blockchain requests have been made.
          </p>
          <Link className="text-link" to="/about">
            See the implementation boundaries
          </Link>
        </EmptyState>
      </div>
    </div>
  );
}

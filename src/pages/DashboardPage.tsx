import {
  Fingerprint,
  Layers3,
  ScanLine,
  ShieldCheck,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Notice } from '../components/ui/Notice';
import { Panel } from '../components/ui/Panel';
import { Badge } from '../components/ui/Badge';
import { StatePanel } from '../components/ui/StatePanel';
import { MetricCard } from '../components/dashboard/MetricCard';
import { AccountCard } from '../components/dashboard/AccountCard';
import { InspectionDialog } from '../components/layout/Header';
import { PermissionInventory } from '../components/permissions/PermissionInventory';

export function DashboardPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="YOUR WORKSPACE"
        title="Wallet overview"
        description="Understand spending authority, one verified permission at a time."
        action={<InspectionDialog />}
      />
      <Notice title="Interface release · Live inspection unavailable">
        No wallet has been inspected. The privacy transport, scanner, and
        transaction modules have not been implemented.
      </Notice>
      <AccountCard />
      <div className="summary-grid">
        {[
          {
            title: 'Active grants',
            icon: Layers3,
            detail: 'ERC-20 and Permit2 · Not measured',
          },
          {
            title: 'Review suggested',
            icon: ShieldCheck,
            detail: 'Evidence-based assessment pending',
          },
          {
            title: 'Unlimited allowances',
            icon: InfinityIcon,
            detail: 'Permission sizes · Not measured',
          },
          {
            title: 'Scan coverage',
            icon: ScanLine,
            detail: 'Last scanned block unavailable',
          },
        ].map((item) => (
          <MetricCard key={item.title} {...item} />
        ))}
      </div>
      <PermissionInventory />
      <div className="two-column">
        <Panel
          title="Token exposure"
          description="Overlapping authority will be explained, not added together."
        >
          <StatePanel
            title="Balances and exposure unavailable"
            description="A successful chain read is required to assess token balances and the bounds of spending authority."
          />
        </Panel>
        <Panel
          title="Privacy transport"
          action={<Badge>Not initialized</Badge>}
        >
          <div className="transport-summary">
            <Fingerprint size={34} aria-hidden="true" />
            <h3>No active anonymous route</h3>
            <p>
              There are no recorded application RPC reads, measured latencies,
              or routing percentages.
            </p>
            <Link to="/privacy" className="text-link">
              Inspect the privacy model →
            </Link>
          </div>
        </Panel>
      </div>
      <Panel
        title="Recent revocations"
        description="Only confirmed transactions with a freshly verified allowance will appear here."
      >
        <StatePanel
          title="No revocation activity"
          description="Transaction execution has not been implemented. Nothing has been submitted or confirmed."
        />
      </Panel>
    </div>
  );
}

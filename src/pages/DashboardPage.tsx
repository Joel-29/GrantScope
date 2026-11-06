import { ExposurePanel } from '../features/exposure/ExposurePanel';
import { Fingerprint } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Notice } from '../components/ui/Notice';
import { Panel } from '../components/ui/Panel';
import { Badge } from '../components/ui/Badge';
import { StatePanel } from '../components/ui/StatePanel';
import { SummaryCards } from '../features/exposure/SummaryCards';
import { AccountCard } from '../components/dashboard/AccountCard';
import { InspectionDialog } from '../components/layout/Header';
import { AllowanceInventory } from '../features/erc20/AllowanceInventory';
import { InspectionPanel } from '../features/wallet/InspectionForm';

export function DashboardPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="YOUR WORKSPACE"
        title="Wallet overview"
        description="Understand spending authority, one verified permission at a time."
        action={<InspectionDialog />}
      />
      <Notice title="Read-only account inspection">
        ETH balance and bytecode can be read anonymously. Selected ERC-20 pairs
        can be scanned on demand. Transaction execution is not available yet. No
        wallet connection is required.
      </Notice>
      <InspectionPanel />
      <AccountCard />
      <SummaryCards />
      <AllowanceInventory />
      <ExposurePanel />
      <div className="two-column">
        <Panel
          title="Token exposure"
          description="Overlapping authority will be explained, not added together."
        >
          <StatePanel
            title="Authority depends on the verified snapshot"
            description="Run a permission scan to populate Authority analysis. Bounds are per permission, overlap across layers, and are not estimates of loss."
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

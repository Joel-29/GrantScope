import { TransportSummary } from '../features/privacy-report/TransportSummary';
import { ActivityList } from '../features/revocation/ActivityList';
import { ExposurePanel } from '../features/exposure/ExposurePanel';
import { PageHeader } from '../components/ui/PageHeader';
import { Notice } from '../components/ui/Notice';
import { Panel } from '../components/ui/Panel';
import { StatePanel } from '../components/ui/StatePanel';
import { SummaryCards } from '../features/exposure/SummaryCards';
import { AccountCard } from '../components/dashboard/AccountCard';
import { InspectionDialog } from '../components/layout/Header';
import { AllowanceInventory } from '../features/erc20/AllowanceInventory';
import { InspectionPanel } from '../features/wallet/InspectionForm';
import { lazy, Suspense } from 'react';
const LocalDemoPanel = import.meta.env.DEV
  ? lazy(() =>
      import('../features/demo/LocalDemoPanel').then((module) => ({
        default: module.LocalDemoPanel,
      })),
    )
  : null;

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
        can be scanned on demand. The connected owner can prepare supported
        revocations from a verified permission detail. No wallet connection is
        required.
      </Notice>
      <InspectionPanel />
      {LocalDemoPanel && (
        <Suspense fallback={<p role="status">Loading local demo controls…</p>}>
          <LocalDemoPanel />
        </Suspense>
      )}
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
        <TransportSummary />
      </div>
      <Panel
        title="Recent revocations"
        description="Only confirmed transactions with a freshly verified allowance will appear here."
      >
        <ActivityList />
      </Panel>
    </div>
  );
}

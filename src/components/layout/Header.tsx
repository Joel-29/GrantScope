import type { ReactNode } from 'react';
import { Activity, ArrowRight, Search, Shield } from 'lucide-react';
import { useLocation, useNavigation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '../ui/Button';
import { InfoDialog } from '../ui/InfoDialog';
import { Badge } from '../ui/Badge';
import { StatePanel } from '../ui/StatePanel';
import { env } from '../../lib/config/env';
import { useAnonRpc } from '../../features/anon-rpc/runtime';
import { WORKERS } from '../../features/anon-rpc/transportRegistry';

const names: Record<string, string> = {
  dashboard: 'Dashboard',
  permissions: 'Permissions',
  privacy: 'Privacy Lab',
  settings: 'Settings',
  about: 'Methodology',
  'design-system': 'Design preview',
};

export function InspectionDialog({ compact = false }: { compact?: boolean }) {
  return (
    <InfoDialog
      title="Wallet inspection is not available yet"
      description="Address inspection is not implemented yet. The Privacy Lab diagnostic can explicitly start the anonymous worker."
      trigger={
        <Button
          className={compact ? 'header-inspect' : ''}
          variant="primary"
          aria-label="Inspect an address"
        >
          <Search size={16} aria-hidden="true" />
          <span>Inspect an address</span>
        </Button>
      }
    >
      <div className="dialog-callout">
        <Shield size={20} aria-hidden="true" />
        <p>
          Read-only inspection will be enabled after the anonymous transport is
          implemented and verified. Signing will be a separate, explicit step.
        </p>
      </div>
    </InfoDialog>
  );
}

export function Header({ mobileNavigation }: { mobileNavigation: ReactNode }) {
  const location = useLocation();
  const navigation = useNavigation();
  const transport = useAnonRpc();
  const workerName = WORKERS[transport.transport].label;
  const transportLabel =
    transport.phase === 'initializing'
      ? `${workerName} initializing`
      : transport.phase === 'failed'
        ? `${workerName} failed · No fallback`
        : transport.phase === 'ready'
          ? transport.successfulWorkerReads > 0
            ? `${workerName} worker responses`
            : 'Worker ready · Unproven'
          : 'Transport not initialized';
  const segment = location.pathname.split('/')[1] ?? '';
  return (
    <header className="topbar">
      <div className="topbar-location">
        {mobileNavigation}
        <span className="breadcrumb">
          Workspace <span>/</span>
          <strong>{names[segment] ?? (segment ? 'Page' : 'Overview')}</strong>
        </span>
      </div>
      <div className="header-network">
        <span className="environment-label">{env.VITE_APP_ENV}</span>
        <InfoDialog
          title="Anonymous transport"
          description="The selected official anonymous worker must return a response before successful anonymous routing is reported. Bootstrap reads are direct exceptions."
          trigger={
            <button type="button" className="transport-pill">
              <span className="status-dot" />
              {transportLabel}
              <ArrowRight size={12} aria-hidden="true" />
            </button>
          }
        >
          <dl className="definition-list">
            <div>
              <dt>Active route</dt>
              <dd>
                {transportLabel}. {transport.successfulWorkerReads} successful
                worker responses in this active session.
              </dd>
            </div>
            <div>
              <dt>Privacy accounting</dt>
              <dd>
                Not measured. Worker bootstrap reads and wallet submissions will
                be disclosed separately.
              </dd>
            </div>
          </dl>
        </InfoDialog>
      </div>
      <div className="topbar-status">
        <ThemeToggle />
        <InfoDialog
          drawer
          title="Transaction activity"
          description="Wallet submissions and confirmed revocations will be listed here when transaction execution is implemented."
          trigger={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open transaction activity"
              title="Transaction activity"
            >
              <Activity size={18} aria-hidden="true" />
            </Button>
          }
        >
          <Badge>No wallet connected</Badge>
          <StatePanel
            title="No transaction activity"
            description="No transactions have been submitted by this application. There is no transaction execution module yet."
          />
        </InfoDialog>
        <InspectionDialog compact />
      </div>
      {navigation.state !== 'idle' && (
        <div className="route-progress" role="status">
          <span className="sr-only">Loading page…</span>
        </div>
      )}
    </header>
  );
}

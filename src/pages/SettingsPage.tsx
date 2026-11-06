import { Monitor, Moon, Sun, Palette, PanelLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { InfoDialog } from '../components/ui/InfoDialog';
import { useTheme } from '../hooks/useTheme';
import { useUiStore, type ThemePreference } from '../store/useUiStore';
import { WalletConnection } from '../features/wallet/WalletConnection';
import { useAnonRpc } from '../features/anon-rpc/runtime';
import { useInspectionSession } from '../features/wallet/session';
import { READ_NETWORKS, WORKERS } from '../features/anon-rpc/transportRegistry';
import { useQueryClient } from '@tanstack/react-query';
import { clearInspection } from '../features/wallet/clearInspection';

const themes = [
  {
    value: 'dark',
    label: 'Dark',
    description: 'Calm navy surfaces',
    icon: Moon,
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Clear daylight contrast',
    icon: Sun,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Follow your device',
    icon: Monitor,
  },
] as const;

export function SettingsPage() {
  const transport = useAnonRpc(),
    { target } = useInspectionSession(),
    cache = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  return (
    <div className="page">
      <PageHeader
        eyebrow="MAKE IT YOURS"
        title="Settings"
        description="A workspace that respects your preferences and makes its boundaries explicit."
      />
      <Panel
        title="Appearance"
        description="Theme preferences apply immediately and last for this page session."
        action={<Palette size={18} aria-hidden="true" />}
      >
        <fieldset className="theme-fieldset">
          <legend>Color theme</legend>
          <div className="theme-options">
            {themes.map(({ value, label, description, icon: Icon }) => (
              <label className="theme-option" key={value}>
                <input
                  type="radio"
                  name="color-theme"
                  value={value}
                  checked={theme === value}
                  onChange={(e) => setTheme(e.target.value as ThemePreference)}
                />
                <span
                  className={`theme-swatch swatch-${value}`}
                  aria-hidden="true"
                >
                  <span />
                  <span />
                  <span />
                </span>
                <span className="theme-option-label">
                  <Icon size={16} aria-hidden="true" />
                  <strong>{label}</strong>
                </span>
                <span>{description}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="setting-row">
          <div>
            <strong>Desktop navigation</strong>
            <p>Keep labels visible or make more room for your workspace.</p>
          </div>
          <Button onClick={toggleSidebar} aria-pressed={sidebarCollapsed}>
            <PanelLeft size={16} aria-hidden="true" />
            {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </Button>
        </div>
      </Panel>
      <Panel
        title="Network & transport"
        description="Select the inspected chain with an address. Select an anonymous worker in Privacy Lab."
        action={<Badge>{transport.phase}</Badge>}
      >
        <div className="panel-body">
          <div className="form-grid">
            <div className="form-field">
              <strong>Inspection network</strong>
              <p>
                {target
                  ? READ_NETWORKS[target.chainId].name
                  : 'No address selected'}
              </p>
              <Link className="text-link" to="/dashboard">
                Choose an address and network
              </Link>
            </div>
            <div className="form-field">
              <strong>Read transport</strong>
              <p>
                {WORKERS[transport.transport].label} · {transport.phase}
              </p>
              <Link className="text-link" to="/privacy">
                Configure and verify the worker
              </Link>
            </div>
          </div>
        </div>
        <div className="setting-row">
          <div>
            <strong>Direct RPC fallback</strong>
            <p>
              No automatic direct fallback exists. Application reads require the
              anonymous worker.
            </p>
          </div>
          <Badge>Unavailable</Badge>
        </div>
      </Panel>
      <Panel
        title="Privacy & local data"
        description="Inspection data stays in memory. Worker-internal public-resource caches are separate."
      >
        <div className="setting-row">
          <div>
            <strong>Clear inspection data</strong>
            <p>
              Cancel application scans, forget targets and manual pairs, remove
              scan caches, and close the worker. Payload-free traffic metrics
              and transaction activity remain for this page session.
            </p>
          </div>
          <Button onClick={() => clearInspection(cache)}>
            Clear inspection data
          </Button>
        </div>
        <div className="setting-row">
          <div>
            <strong>Session-only preferences</strong>
            <p>
              Theme, navigation, and query cache stay in memory. Reloading
              resets them. System theme changes are followed while selected.
            </p>
          </div>
          <InfoDialog
            title="What stays in your browser?"
            description="Application preferences and query cache are in memory. The official worker has a separate storage namespace."
            trigger={<Button>View data policy</Button>}
          >
            <p className="prose-copy">
              The application does not persist wallet targets, balances, or
              permission records. Theme preference resets on reload. The
              official harness grants its worker IndexedDB storage scoped to the
              worker specifier; worker caches may persist across reloads.
              Hosting providers see page requests, and direct bootstrap calls
              expose network identity to the bootstrap provider.
            </p>
          </InfoDialog>
        </div>
      </Panel>
      {import.meta.env.DEV && (
        <div className="preview-entry">
          <div>
            <strong>Component workshop</strong>
            <p>
              Isolated design fixtures, loading states, and error recovery.
              Development only.
            </p>
          </div>
          <Link to="/design-system" className="button button-secondary">
            Open design preview
          </Link>
        </div>
      )}
      <WalletConnection />
    </div>
  );
}

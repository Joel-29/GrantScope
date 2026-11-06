import { useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { Notice } from '../components/ui/Notice';
import { PageHeader } from '../components/ui/PageHeader';
import { InfoDialog } from '../components/ui/InfoDialog';
import { StatePanel } from '../components/ui/StatePanel';
import { WorkspaceSkeleton } from '../components/ui/Skeleton';
import { PermissionInventory } from '../components/permissions/PermissionInventory';
import { previewPermissions } from './fixtures';

export function DesignPreviewPage() {
  const [state, setState] = useState<'ready' | 'loading' | 'error'>('ready');
  const [empty, setEmpty] = useState(false);
  return (
    <div className="page design-preview" data-design-preview="true">
      <PageHeader
        eyebrow="DEVELOPMENT ONLY"
        title="Component workshop"
        description="Isolated design fixtures. Nothing on this page represents onchain state, RPC health, or a real transaction."
      />
      <Notice title="Fictional design fixtures · Not live blockchain data">
        Preview amounts, names, statuses, loading states, and failures are
        manually selected for design testing. This route is excluded from
        production builds.
      </Notice>
      <Panel title="Foundations">
        <div className="panel-body">
          <div className="swatch-grid">
            {['Canvas', 'Surface', 'Emerald', 'Violet', 'Amber', 'Danger'].map(
              (name, i) => (
                <div key={name}>
                  <span className={`color-swatch color-${i}`} />
                  <strong>{name}</strong>
                </div>
              ),
            )}
          </div>
          <div className="component-row">
            <Badge>Neutral</Badge>
            <Badge tone="accent">Accent · Fixture</Badge>
            <Badge tone="violet">Privacy · Fixture</Badge>
            <Badge tone="warning">Review · Fixture</Badge>
            <Badge tone="danger">Error · Fixture</Badge>
          </div>
          <div className="component-row">
            <Button variant="primary">Primary example</Button>
            <Button>Secondary example</Button>
            <Button variant="ghost">Ghost example</Button>
            <Button variant="danger" disabled>
              Disabled destructive action
            </Button>
            <InfoDialog
              trigger={<Button>Open preview dialog</Button>}
              title="Design preview dialog"
              description="A real accessible dialog with fictional content. No wallet interaction."
            >
              <p className="prose-copy">
                Tab stays inside the dialog. Escape closes it and restores focus
                to the trigger.
              </p>
            </InfoDialog>
          </div>
        </div>
      </Panel>
      <fieldset className="preview-controls">
        <legend>Permission inventory state</legend>
        {(['ready', 'loading', 'error'] as const).map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="preview-state"
              value={value}
              checked={state === value}
              onChange={() => setState(value)}
            />
            {value}
          </label>
        ))}
        <label>
          <input
            type="checkbox"
            checked={empty}
            onChange={(e) => setEmpty(e.target.checked)}
          />
          Empty fixture set
        </label>
      </fieldset>
      <PermissionInventory
        mode="preview"
        rows={empty ? [] : previewPermissions}
        state={state}
        onRetry={() => setState('ready')}
      />
      <div className="two-column">
        <Panel title="Empty state example">
          <StatePanel
            title="No design records"
            description="An intentional empty preview, not evidence that a wallet has no permissions."
          />
        </Panel>
        <Panel title="Error state example">
          <StatePanel
            kind="error"
            title="Preview unavailable"
            description="An isolated error example. No network request failed."
          />
        </Panel>
      </div>
      <Panel title="Route loading skeleton">
        <WorkspaceSkeleton />
      </Panel>
    </div>
  );
}

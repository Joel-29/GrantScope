import { PageHeader } from '../components/ui/PageHeader';

export function SettingsPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="APPLICATION PREFERENCES"
        title="Settings"
        description="Explicit configuration, with honest defaults."
      />
      <section className="panel prose-panel">
        <h2>Network & transport</h2>
        <dl className="definition-list">
          <div>
            <dt>Blockchain network</dt>
            <dd>Not configured. No network has been contacted.</dd>
          </div>
          <div>
            <dt>Read transport</dt>
            <dd>
              Not implemented. Anon-RPC with an anonymizing worker is the
              planned default.
            </dd>
          </div>
          <div>
            <dt>Direct fallback</dt>
            <dd>
              No RPC transport exists in this module. Later modules must fail
              closed and never silently bypass anonymous routing.
            </dd>
          </div>
          <div>
            <dt>Local storage</dt>
            <dd>
              UI state and query cache are in memory. No wallet targets,
              balances, or permissions are persisted.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

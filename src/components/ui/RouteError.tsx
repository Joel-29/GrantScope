import { StatePanel } from './StatePanel';

export function RouteError() {
  return (
    <main className="fatal-error">
      <h1>This page couldn’t load</h1>
      <StatePanel
        kind="error"
        title="The workspace needs a fresh start"
        description="A page resource could not be loaded. Reload to retry. No blockchain action was submitted."
        action={
          <a className="button button-primary" href="/">
            Return home
          </a>
        }
      />
    </main>
  );
}

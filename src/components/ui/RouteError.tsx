export function RouteError() {
  return (
    <main className="fatal-error">
      <h1>This page couldn’t load</h1>
      <p>Please reload to retry. No blockchain action was submitted.</p>
      <a className="button button-primary" href="/">
        Return home
      </a>
    </main>
  );
}

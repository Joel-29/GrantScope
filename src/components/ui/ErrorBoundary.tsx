import { Component, type PropsWithChildren } from 'react';

export class ErrorBoundary extends Component<
  PropsWithChildren,
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError)
      return (
        <main className="fatal-error">
          <h1>GrantScope couldn’t load</h1>
          <p>Reload the application to try again.</p>
          <button
            className="button button-primary"
            onClick={() => window.location.reload()}
          >
            Reload application
          </button>
        </main>
      );
    return this.props.children;
  }
}

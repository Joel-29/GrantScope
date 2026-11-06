import { Component, type PropsWithChildren } from 'react';
import { StatePanel } from './StatePanel';
import { Button } from './Button';

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
          <StatePanel
            kind="error"
            title="Something interrupted the interface"
            description="Reload the application to try again. No blockchain action was submitted."
            action={
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
              >
                Reload application
              </Button>
            }
          />
        </main>
      );
    return this.props.children;
  }
}

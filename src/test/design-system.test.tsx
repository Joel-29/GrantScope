import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { router } from '../app/router';
import { AppProviders } from '../app/providers';
import { useUiStore } from '../store/useUiStore';
import { DesignPreviewPage } from '../design-system/DesignPreviewPage';
import { WorkspaceSkeleton } from '../components/ui/Skeleton';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

function renderPage(path: string) {
  const memoryRouter = createMemoryRouter(router.routes, {
    initialEntries: [path],
  });
  render(
    <AppProviders>
      <RouterProvider router={memoryRouter} />
    </AppProviders>,
  );
}

beforeEach(() =>
  useUiStore.setState({ theme: 'dark', sidebarCollapsed: false }),
);

describe('Module 2 design system', () => {
  it('applies native appearance settings without persisting user information', async () => {
    const user = userEvent.setup();
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderPage('/settings');
    await user.click(await screen.findByRole('radio', { name: /Light/ }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    await user.click(
      screen.getByRole('button', { name: 'Switch to dark theme' }),
    );
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it('responds to OS theme changes only while system preference is selected', async () => {
    const user = userEvent.setup();
    let dark = false;
    const listeners = new Set<() => void>();
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      get matches() {
        return query.includes('color-scheme') ? dark : false;
      },
      media: query,
      onchange: null,
      addEventListener: (
        _event: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        listeners.add(listener as () => void);
      },
      removeEventListener: (
        _event: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        listeners.delete(listener as () => void);
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    renderPage('/settings');
    await user.click(await screen.findByRole('radio', { name: /System/ }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    act(() => {
      dark = true;
      listeners.forEach((listener) => listener());
    });
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    await user.click(screen.getByRole('radio', { name: /Light/ }));
    act(() => {
      dark = false;
      listeners.forEach((listener) => listener());
      dark = true;
      listeners.forEach((listener) => listener());
    });
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('opens the inspection boundary and returns focus without a network request', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderPage('/permissions');
    await screen.findByRole('heading', { name: 'Permissions' });
    const trigger = screen.getByRole('button', { name: 'Inspect an address' });
    await user.click(trigger);
    expect(
      screen.getByRole('dialog', {
        name: 'Inspect a public address',
      }),
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(
      screen.getByRole('searchbox', { name: 'Search permissions' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('combobox', { name: 'Permission type' }),
    ).toBeDisabled();
    expect(screen.queryByText('Preview emerald')).not.toBeInTheDocument();
  });

  it('keeps transaction activity empty without suggesting a pending or successful submission', async () => {
    const user = userEvent.setup();
    renderPage('/privacy');
    await screen.findByRole('heading', { name: 'Privacy Lab' });
    expect(
      screen.getByRole('button', { name: 'Export report' }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole('button', { name: 'Open transaction activity' }),
    );
    const drawer = screen.getByRole('dialog', { name: 'Transaction activity' });
    expect(
      within(drawer).getByRole('heading', { name: 'No transaction activity' }),
    ).toBeInTheDocument();
    expect(
      within(drawer).queryByText(/confirmed successfully/i),
    ).not.toBeInTheDocument();
  });

  it('lets isolated fixtures demonstrate filtering, clear filters, and error recovery', async () => {
    const user = userEvent.setup();
    render(<DesignPreviewPage />);
    const table = screen.getByRole('table', {
      name: 'Fictional permission design fixtures',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Permission type' }),
      'Permit2',
    );
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    await user.type(screen.getByRole('searchbox'), 'nonexistent');
    expect(
      screen.getByRole('heading', { name: 'No matching preview permissions' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    await user.click(screen.getByRole('radio', { name: 'error' }));
    expect(
      screen.getByRole('heading', { name: 'Preview request failed' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry preview' }));
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    await user.click(screen.getByRole('radio', { name: 'loading' }));
    expect(
      screen.getByText('Loading design fixture permissions…').parentElement,
    ).toHaveAttribute('aria-busy', 'true');
  });

  it('announces a route skeleton once and keeps decorative blocks hidden', () => {
    const { container } = render(<WorkspaceSkeleton />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading GrantScope workspace…',
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(
      container.querySelectorAll('.skeleton[aria-hidden="true"]').length,
    ).toBeGreaterThan(0);
  });

  it('renders a recovery action after a real render failure', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function BrokenView(): never {
      throw new Error('Isolated render failure');
    }
    render(
      <ErrorBoundary>
        <BrokenView />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something interrupted the interface',
    );
    expect(
      screen.getByRole('button', { name: 'Reload application' }),
    ).toBeInTheDocument();
  });
});

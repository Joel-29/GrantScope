import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { router } from '../app/router';
import { AppProviders } from '../app/providers';

function renderRoute(path = '/') {
  const memoryRouter = createMemoryRouter(router.routes, {
    initialEntries: [path],
  });
  render(
    <AppProviders>
      <RouterProvider router={memoryRouter} />
    </AppProviders>,
  );
  return memoryRouter;
}

describe('application foundation', () => {
  it('navigates to the dashboard without suggesting a scan has happened', async () => {
    const user = userEvent.setup();
    renderRoute();
    await user.click(
      screen.getByRole('link', { name: /Explore the workspace/i }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Wallet overview' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'No account selected' }),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText('Not measured')).toHaveLength(4);
    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
  });

  it('keeps the unimplemented privacy state truthful and makes no RPC calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderRoute('/privacy');
    expect(
      await screen.findByRole('heading', {
        name: 'No active anonymizing transport',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Transport not initialized')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows measured traffic accounting in the header transport dialog', async () => {
    const user = userEvent.setup();
    renderRoute('/privacy');
    await screen.findByRole('heading', {
      name: 'No active anonymizing transport',
    });
    await user.click(
      screen.getByRole('button', { name: 'Transport not initialized' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Anonymous transport' });
    expect(
      within(dialog).getByText(
        /0 completed read attempts; 0 successful anonymous responses/,
      ),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText(/Not measured/)).not.toBeInTheDocument();
  });
  it('supports keyboard dismissal and focus restoration in mobile navigation', async () => {
    const user = userEvent.setup();
    renderRoute();
    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Navigation' });
    expect(
      within(dialog).getByRole('link', { name: 'Privacy Lab' }),
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it.each([
    ['/permissions', 'Choose an address to scan'],
    ['/permissions/unknown', 'Permission unavailable'],
    ['/settings', 'Settings'],
    ['/about', 'Authority, made understandable.'],
    ['/missing', 'This page isn’t here'],
  ])('renders a useful state at %s', async (path, heading) => {
    renderRoute(path);
    expect(
      await screen.findByRole('heading', { name: heading }),
    ).toBeInTheDocument();
  });
});

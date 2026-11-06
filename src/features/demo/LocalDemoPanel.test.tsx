import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { LocalDemoPanel } from './LocalDemoPanel';
import { scanAllowances } from '../erc20/engine';
import { anonRpc } from '../anon-rpc/runtime';
import { DEMO_READ_TIMEOUT_MS } from './read';

vi.mock('../erc20/engine', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../erc20/engine')>()),
  scanAllowances: vi.fn(),
}));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  anonRpc.selectTransport('nym');
});
function setup() {
  // Isolated mock configuration; these are not the user's demo identities.
  vi.stubEnv('VITE_DEMO_OWNER', '0x0000000000000000000000000000000000000001');
  vi.stubEnv('VITE_DEMO_TOKEN', '0x0000000000000000000000000000000000000002');
  vi.stubEnv('VITE_DEMO_SPENDER', '0x0000000000000000000000000000000000000003');
  const select = vi.spyOn(anonRpc, 'selectTransport');
  vi.mocked(scanAllowances).mockImplementation(
    async (_manager, _owner, _chain, _pairs, options) => {
      options?.onStage?.('reading-token');
      return new Promise(() => {});
    },
  );
  const client = new QueryClient();
  const view = render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <LocalDemoPanel />
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return { ...view, select, client };
}
it('shows actual scan stages, permits cancellation, and ignores a late stale result', async () => {
  const t = setup();
  let resolve!: (value: Awaited<ReturnType<typeof scanAllowances>>) => void;
  vi.mocked(scanAllowances).mockImplementation(
    async (_manager, _owner, _chain, _pairs, options) => {
      options?.onStage?.('reading-token');
      return new Promise((done) => {
        resolve = done;
      });
    },
  );
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Load configured Sepolia demo' }),
    );
  });
  expect(screen.getByTestId('demo-read-stage')).toHaveTextContent(
    'Reading token metadata',
  );
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Cancel demo read' }));
  });
  expect(screen.getByText(/Demo read cancelled/)).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Load configured Sepolia demo' }),
  ).toBeEnabled();
  await act(async () => {
    resolve({
      rows: [],
      failures: [],
      owner: '0x0000000000000000000000000000000000000001',
      chainId: 11155111,
      blockNumber: 1n,
      attempted: 1,
      readAt: 1,
      coverage: 'Mocked late result',
    });
  });
  expect(
    screen.queryByTestId('configured-demo-live-status'),
  ).not.toBeInTheDocument();
  expect(t.client.getQueryCache().getAll()).toHaveLength(0);
  expect(t.select).not.toHaveBeenCalled();
});
it('stops a stalled scan at four minutes and requires an explicit Nox selection', async () => {
  vi.useFakeTimers();
  const t = setup();
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Load configured Sepolia demo' }),
    );
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(DEMO_READ_TIMEOUT_MS);
  });
  expect(screen.getByRole('alert')).toHaveTextContent('4-minute limit');
  expect(
    screen.getByRole('button', { name: 'Load configured Sepolia demo' }),
  ).toBeEnabled();
  expect(t.select).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Try Nox anonymously on Sepolia' }),
    );
  });
  expect(t.select).toHaveBeenCalledWith('nox');
  expect(vi.mocked(scanAllowances).mock.calls.at(-1)?.[0].transport).toBe(
    'nox',
  );
  t.unmount();
});
it('aborts on navigation without starting a replacement worker or committing a result', async () => {
  const t = setup();
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Load configured Sepolia demo' }),
    );
  });
  const signal = vi.mocked(scanAllowances).mock.calls.at(-1)?.[4]?.signal;
  t.unmount();
  expect(signal?.aborted).toBe(true);
  expect(t.select).not.toHaveBeenCalled();
  expect(t.client.getQueryCache().getAll()).toHaveLength(0);
});

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { LocalDemoPanel } from './LocalDemoPanel';
import { scanAllowances } from '../erc20/engine';
import { anonRpc } from '../anon-rpc/runtime';
import { DEMO_READ_TIMEOUT_MS } from './read';
import { useInspectionSession } from '../wallet/session';
import { usePairStore } from '../erc20/pairStore';
import type { AllowanceScan } from '../erc20/types';
import { useTransactions } from '../revocation/store';

vi.mock('../erc20/engine', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../erc20/engine')>()),
  scanAllowances: vi.fn(),
}));
vi.mock('../wallet/useInspection', () => ({
  useInspection: () => ({ data: { kind: 'eoa' } }),
}));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  useInspectionSession.getState().clear();
  usePairStore.setState({ extra: {} });
  useTransactions.setState({ busy: false, activity: [] });
  anonRpc.selectTransport('nym');
});
function setup() {
  // Isolated mock configuration; these are not the user's demo identities.
  vi.stubEnv('VITE_DEMO_OWNER', '0x0000000000000000000000000000000000000001');
  vi.stubEnv('VITE_DEMO_TOKEN', '0x0000000000000000000000000000000000000002');
  vi.stubEnv('VITE_DEMO_SPENDER', '0x0000000000000000000000000000000000000003');
  const select = vi.spyOn(anonRpc, 'selectTransport');
  vi.mocked(scanAllowances).mockReset();
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
  const remount = () =>
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <LocalDemoPanel />
        </QueryClientProvider>
      </MemoryRouter>,
    );
  return { ...view, select, client, remount };
}
function fixtureScan(): AllowanceScan {
  const owner = '0x0000000000000000000000000000000000000001';
  return {
    owner,
    chainId: 11155111,
    blockNumber: 100n,
    readAt: Date.now(),
    attempted: 1,
    failures: [],
    coverage: 'Isolated test fixture, one pair',
    rows: [
      {
        id: 'isolated-demo-permission',
        kind: 'erc20',
        owner,
        chainId: 11155111,
        token: '0x0000000000000000000000000000000000000002',
        spender: '0x0000000000000000000000000000000000000003',
        amount: 100n,
        balance: 100n,
        decimals: 0,
        symbol: 'MOCK',
        name: 'Test fixture',
        warnings: [],
        size: 'limited',
        blockNumber: 100n,
        readAt: Date.now(),
        knownSpender: false,
        spenderName: 'Unknown spender',
        source: 'manual',
      },
    ],
  };
}
it('restores the same-session verified snapshot and permission link after navigating away without another network read', async () => {
  const t = setup();
  vi.mocked(scanAllowances).mockResolvedValue(fixtureScan());
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Load configured Sepolia demo' }),
    );
  });
  expect(screen.getByTestId('configured-demo-live-status')).toHaveTextContent(
    '100 MOCK',
  );
  expect(
    screen.getByRole('button', { name: 'Connect signing wallet' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Prepare revocation' }),
  ).toBeDisabled();
  t.unmount();
  t.remount();
  expect(
    screen.getByRole('link', { name: 'Review owner-authorized revocation' }),
  ).toBeInTheDocument();
  expect(vi.mocked(scanAllowances)).toHaveBeenCalledTimes(1);
});
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
  expect(
    t.client
      .getQueryCache()
      .getAll()
      .filter((query) => query.state.data !== undefined),
  ).toHaveLength(0);
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
  expect(
    t.client
      .getQueryCache()
      .getAll()
      .filter((query) => query.state.data !== undefined),
  ).toHaveLength(0);
});
it.each(['transport', 'restart', 'inspection', 'clear'])(
  'does not restore a cached permission after %s changes',
  async (change) => {
    const t = setup();
    vi.mocked(scanAllowances).mockResolvedValue(fixtureScan());
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Load configured Sepolia demo' }),
      );
    });
    expect(
      screen.getByRole('link', { name: 'Review owner-authorized revocation' }),
    ).toBeInTheDocument();
    t.unmount();
    if (change === 'transport') anonRpc.selectTransport('nox');
    if (change === 'restart') anonRpc.selectTransport('nym');
    if (change === 'inspection')
      useInspectionSession
        .getState()
        .inspect('0x0000000000000000000000000000000000000004', 11155111);
    if (change === 'clear') {
      useInspectionSession.getState().clear();
      t.client.removeQueries({ queryKey: ['local-demo'] });
    }
    t.remount();
    expect(
      screen.queryByRole('link', {
        name: 'Review owner-authorized revocation',
      }),
    ).not.toBeInTheDocument();
    expect(vi.mocked(scanAllowances)).toHaveBeenCalledTimes(1);
  },
);
it('reports a failed stage without leaking provider payloads and restarts the same Nox transport only on click', async () => {
  anonRpc.selectTransport('nox');
  const t = setup();
  const previousManager = anonRpc.current();
  vi.mocked(scanAllowances).mockImplementation(
    async (_manager, _owner, _chain, _pairs, options) => {
      options?.onStage?.('pinning-block');
      throw new Error('private-provider-payload');
    },
  );
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Load configured Sepolia demo' }),
    );
  });
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Selecting and checking the read block via nox',
  );
  expect(screen.getByRole('alert')).not.toHaveTextContent(
    'private-provider-payload',
  );
  expect(t.select).not.toHaveBeenCalled();
  vi.mocked(scanAllowances).mockResolvedValue(fixtureScan());
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Restart Nox and retry anonymously' }),
    );
  });
  expect(t.select).toHaveBeenCalledExactlyOnceWith('nox');
  expect(anonRpc.current()).not.toBe(previousManager);
  await waitFor(() =>
    expect(screen.getByTestId('configured-demo-live-status')).toHaveTextContent(
      '100 MOCK',
    ),
  );
});
it('does not offer a cached snapshot as the result of a new failed attempt', async () => {
  setup();
  vi.mocked(scanAllowances)
    .mockResolvedValueOnce(fixtureScan())
    .mockRejectedValueOnce(new Error('private failure'));
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Load configured Sepolia demo' }),
    );
  });
  expect(screen.getByTestId('demo-snapshot-note')).toHaveTextContent(
    'not a new read',
  );
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Load configured Sepolia demo' }),
    );
  });
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(
    screen.queryByTestId('configured-demo-live-status'),
  ).not.toBeInTheDocument();
});
it('disables worker restarts and transport changes while a transaction workflow is active', async () => {
  const t = setup();
  vi.mocked(scanAllowances).mockRejectedValue(new Error('private failure'));
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Load configured Sepolia demo' }),
    );
    useTransactions.setState({ busy: true });
  });
  const restart = screen.getByRole('button', {
    name: 'Restart Nym and retry anonymously',
  });
  const alternative = screen.getByRole('button', {
    name: 'Try Nox anonymously on Sepolia',
  });
  expect(restart).toBeDisabled();
  expect(alternative).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Load configured Sepolia demo' }),
  ).toBeDisabled();
  fireEvent.click(restart);
  fireEvent.click(alternative);
  expect(t.select).not.toHaveBeenCalled();
});

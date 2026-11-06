import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { AnalysisRecord, ExposurePanel } from './ExposurePanel';
import { useInspectionSession } from '../wallet/session';
import { anonRpc } from '../anon-rpc/runtime';
import type { Erc20Permission } from '../erc20/types';
describe('analysis presentation', () => {
  it('updates from real query state and filters records without initiating reads', async () => {
    const address = '0x0000000000000000000000000000000000000001';
    useInspectionSession.getState().inspect(address, 1);
    const { revision } = useInspectionSession.getState();
    const manager = anonRpc.current();
    const client = new QueryClient();
    const record: Erc20Permission = {
      id: 'ui-record',
      kind: 'erc20',
      chainId: 1,
      owner: address,
      token: address,
      spender: address,
      symbol: 'TEST',
      name: 'Unit fixture',
      decimals: 18,
      amount: 1n,
      balance: 2n,
      size: 'limited',
      blockNumber: 1n,
      readAt: 1000,
      knownSpender: false,
      spenderName: 'Unclassified',
      source: 'manual',
      warnings: [],
    };
    const key = [
      'allowances',
      1,
      address,
      manager.transport,
      manager.sessionId,
      revision,
      [],
    ];
    client.setQueryData(key, {
      rows: [record],
      failures: [],
      coverage: 'One test pair',
      blockNumber: 1n,
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ExposurePanel />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText(/1 unique checked records/)).toBeInTheDocument();
    const user = userEvent.setup();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Assessment filter' }),
      'zero',
    );
    expect(screen.getByText(/No verified records match/)).toBeInTheDocument();
    act(() =>
      client.setQueryData(key, {
        rows: [{ ...record, amount: 0n, size: 'zero' }],
        failures: [],
        coverage: 'One test pair',
        blockNumber: 1n,
      }),
    );
    expect(
      screen.getByRole('link', { name: /ERC-20 approval/ }),
    ).toBeInTheDocument();
    useInspectionSession.getState().clear();
    client.clear();
  });
  it('renders unsupported claims as explicit limits, with exact units', () => {
    const address = '0x0000000000000000000000000000000000000001';
    const record: Erc20Permission = {
      id: 'test',
      kind: 'erc20',
      chainId: 1,
      owner: address,
      token: address,
      spender: address,
      symbol: 'TEST',
      name: 'Test fixture',
      decimals: 18,
      amount: 1n,
      balance: 2n,
      size: 'limited',
      blockNumber: 1n,
      readAt: 1,
      knownSpender: false,
      spenderName: 'Unknown',
      source: 'manual',
      warnings: [],
    };
    render(<AnalysisRecord record={record} />);
    expect(screen.getByText(/0.000000000000000001 TEST/)).toBeInTheDocument();
    expect(
      screen.getByText(/Unknown does not mean malicious/),
    ).toBeInTheDocument();
    expect(screen.getByText('Evidence limits')).toBeInTheDocument();
  });
});

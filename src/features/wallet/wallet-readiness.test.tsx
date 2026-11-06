import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { WalletConnection } from './WalletConnection';
import { useWallet } from './provider';
import { useInspectionSession } from './session';

// Isolated wallet metadata fixtures; no real wallet is connected in these tests.
const owner = '0x0000000000000000000000000000000000000001';
const other = '0x0000000000000000000000000000000000000002';
afterEach(() => {
  useWallet.getState().disconnect();
  useInspectionSession.getState().clear();
  Reflect.deleteProperty(window, 'ethereum');
});
function setup(address = other, chainId = 84532) {
  const request = vi.fn();
  Object.defineProperty(window, 'ethereum', {
    configurable: true,
    value: { request },
  });
  useWallet.setState({ address: address as typeof owner, chainId });
  render(
    <MemoryRouter>
      <WalletConnection />
    </MemoryRouter>,
  );
  return request;
}
it('shows both unsupported-network and wrong-owner guidance, then updates as wallet metadata changes without requesting anything', () => {
  useInspectionSession.getState().inspect(owner, 11155111);
  const request = setup();
  expect(
    screen.getByText(/Wallet network: Unsupported network \(84532\)/),
  ).toBeInTheDocument();
  expect(
    screen.getByText('Choose a supported wallet network'),
  ).toBeInTheDocument();
  expect(
    screen.getByText('Connected account is not the inspected owner'),
  ).toBeInTheDocument();
  act(() => useWallet.setState({ chainId: 11155111 }));
  expect(
    screen.queryByText('Choose a supported wallet network'),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText('Connected account is not the inspected owner'),
  ).toBeInTheDocument();
  act(() => useWallet.setState({ address: owner }));
  expect(screen.getByText('Owner and network match')).toBeInTheDocument();
  expect(
    screen.queryByText('Connected account is not the inspected owner'),
  ).not.toBeInTheDocument();
  expect(screen.queryByText('Allowance verified zero')).not.toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();
});
it('does not treat a supported but different chain as matching the inspected owner network', () => {
  useInspectionSession.getState().inspect(owner, 11155111);
  const request = setup(owner, 1);
  expect(
    screen.getByText('Wallet and inspection networks differ'),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Select Ethereum Sepolia \(11155111\) in MetaMask/),
  ).toBeInTheDocument();
  expect(screen.queryByText('Owner and network match')).not.toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();
});
it('requires a selected inspection before showing owner/network agreement', () => {
  const request = setup(owner, 11155111);
  expect(
    screen.getByText('Select the inspected owner first'),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open dashboard' })).toHaveAttribute(
    'href',
    '/dashboard',
  );
  expect(screen.queryByText('Owner and network match')).not.toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();
});

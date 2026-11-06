import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { DiagnosticPanel } from './DiagnosticPanel';
import { anonRpc } from './runtime';

afterEach(() => {
  vi.restoreAllMocks();
  anonRpc.close();
});

it('retains actual partial responses and requires an explicit alternative after failure', async () => {
  const manager = anonRpc.current();
  vi.spyOn(manager, 'initialize').mockResolvedValue();
  vi.spyOn(manager, 'request')
    .mockResolvedValueOnce('0xaa36a7')
    .mockResolvedValueOnce('0x2a')
    .mockRejectedValueOnce(new Error('TunnelTimeoutError'));
  const alternative = vi.spyOn(anonRpc, 'selectTransport');
  render(<DiagnosticPanel />);
  await userEvent.click(
    screen.getByRole('button', { name: 'Run live anonymous diagnostic' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('TunnelTimeoutError'),
  );
  expect(screen.getByTestId('diagnostic-chain')).toHaveTextContent('11155111');
  expect(screen.getByTestId('diagnostic-block')).toHaveTextContent('42');
  expect(screen.getByTestId('diagnostic-balance')).toHaveTextContent(
    'Not returned',
  );
  expect(screen.queryByTestId('live-rpc-result')).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Try Nox anonymously on Sepolia' }),
  ).toBeEnabled();
  expect(alternative).not.toHaveBeenCalled();
  expect(manager.request).toHaveBeenCalledTimes(3);
});

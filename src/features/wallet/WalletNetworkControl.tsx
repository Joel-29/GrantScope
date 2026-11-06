import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { injectedProvider, useWallet, walletChain } from './provider';
import { walletNetworkLabel } from './networkLabel';
import { walletRequest } from './requests';
import { useInspectionSession } from './session';

export function WalletNetworkControl() {
  const wallet = useWallet();
  const { target } = useInspectionSession();
  const desiredChain = target?.chainId ?? 11155111;
  const pending = useRef<AbortController | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(
    () => () => {
      pending.current?.abort();
      pending.current = null;
    },
    [],
  );

  async function switchNetwork() {
    if (pending.current || !wallet.address) return;
    const provider = injectedProvider();
    if (!provider) {
      setError('Wallet unavailable. Reconnect explicitly.');
      return;
    }
    const controller = new AbortController();
    pending.current = controller;
    setRunning(true);
    setError(null);
    const initial = useWallet.getState();
    const inspection = useInspectionSession.getState();
    const unsubscribeWallet = useWallet.subscribe((next) => {
      if (next.address !== initial.address || next.connecting)
        controller.abort();
    });
    const unsubscribeInspection = useInspectionSession.subscribe((next) => {
      if (next.revision !== inspection.revision) controller.abort();
    });
    controller.signal.addEventListener(
      'abort',
      () => {
        unsubscribeWallet();
        unsubscribeInspection();
      },
      { once: true },
    );
    const checkContext = () => {
      if (controller.signal.aborted || injectedProvider() !== provider)
        throw new Error('Wallet context changed');
    };
    try {
      const result = await walletRequest(provider, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${desiredChain.toString(16)}` }],
      });
      checkContext();
      if (result !== null) throw new Error('Invalid network switch response');
      const snapshot = useWallet.getState();
      const chainId = walletChain(
        await walletRequest(provider, { method: 'eth_chainId' }),
      );
      checkContext();
      if (chainId !== desiredChain || useWallet.getState() !== snapshot)
        throw new Error('Wallet network changed during verification');
      useWallet.setState({ chainId });
    } catch (cause) {
      if (!controller.signal.aborted) {
        const code =
          cause && typeof cause === 'object' && 'code' in cause
            ? cause.code
            : null;
        setError(
          code === 4001
            ? 'Wallet network change rejected. Retry when ready.'
            : code === 4902
              ? 'Enable the requested network in MetaMask, then retry. For Sepolia, enable test networks.'
              : 'Wallet network change could not be verified. Review MetaMask and retry explicitly.',
        );
      }
    } finally {
      unsubscribeWallet();
      unsubscribeInspection();
      if (pending.current === controller) {
        pending.current = null;
        setRunning(false);
      }
    }
  }

  if (!wallet.address) return null;
  if (wallet.chainId === desiredChain && !running && !error) return null;
  return (
    <div>
      <Button onClick={() => void switchNetwork()} disabled={running}>
        {running
          ? 'Waiting for wallet network change…'
          : `Switch wallet to ${walletNetworkLabel(desiredChain)}`}
      </Button>
      {running && <p role="status">Review the network change in MetaMask.</p>}
      <p>This changes the wallet network only. No transaction is requested.</p>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

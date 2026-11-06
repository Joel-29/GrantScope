import { Link } from 'react-router-dom';
import { Notice } from '../../components/ui/Notice';
import { useInspectionSession } from './session';
import { supportedWalletChain, walletNetworkLabel } from './networkLabel';

// Metadata guidance only. Never connect, switch networks, read the chain or sign
// while rendering this panel; authorization remains in the revocation engine.
export function WalletReadiness({
  address,
  chainId,
}: {
  address: string;
  chainId: number | null;
}) {
  const { target } = useInspectionSession();
  const supported = supportedWalletChain(chainId);
  const sameOwner = target?.address.toLowerCase() === address.toLowerCase();
  const sameNetwork = target?.chainId === chainId;
  return (
    <section aria-label="Signing prerequisites" aria-live="polite">
      {!supported && (
        <Notice title="Choose a supported wallet network">
          {chainId === null
            ? 'MetaMask has not reported a network. Reconnect the wallet. '
            : 'The connected wallet network is unsupported. '}
          {target
            ? `Select ${walletNetworkLabel(target.chainId)} in MetaMask.`
            : 'Supported networks are Ethereum mainnet (1) and Ethereum Sepolia (11155111). The Sepolia demo requires Ethereum Sepolia.'}
        </Notice>
      )}
      {!target ? (
        <Notice title="Select the inspected owner first">
          Choose the address and network to inspect, then select that owner
          account in MetaMask.{' '}
          <Link className="text-link" to="/dashboard">
            Open dashboard
          </Link>
        </Notice>
      ) : (
        <>
          {supported && !sameNetwork && (
            <Notice title="Wallet and inspection networks differ">
              Select {walletNetworkLabel(target.chainId)} in MetaMask to match
              the inspected network.
            </Notice>
          )}
          {!sameOwner && (
            <Notice title="Connected account is not the inspected owner">
              Select the inspected owner account in MetaMask. A spender account
              cannot revoke the owner's allowance.
            </Notice>
          )}
          {sameOwner && sameNetwork && (
            <Notice title="Owner and network match">
              Open a verified permission to check whether revocation is
              supported. Matching account and network does not authorize a
              transaction.
            </Notice>
          )}
        </>
      )}
    </section>
  );
}

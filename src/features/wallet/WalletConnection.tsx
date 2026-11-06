import { Button } from '../../components/ui/Button';
import { Panel } from '../../components/ui/Panel';
import { useWallet } from './provider';

export function WalletConnection() {
  const wallet = useWallet();
  return (
    <Panel
      title="Signing wallet"
      description="Optional. Read-only inspection needs no wallet. Wallet-provider traffic is outside anonymous-read guarantees."
    >
      <div className="panel-body prose-copy">
        {wallet.address ? (
          <>
            <p className="address-value">{wallet.address}</p>
            <p>
              Wallet network: {wallet.chainId}. Connection alone grants no
              transaction authority to this application.
            </p>
            <Button onClick={wallet.disconnect}>Disconnect locally</Button>
          </>
        ) : (
          <Button
            onClick={() => void wallet.connect()}
            disabled={wallet.connecting}
          >
            {wallet.connecting
              ? 'Waiting for wallet…'
              : 'Connect signing wallet'}
          </Button>
        )}
        {wallet.error && <p role="alert">{wallet.error}</p>}
        <p>
          No seed phrase or private key is ever requested. No transaction
          execution is implemented yet.
        </p>
      </div>
    </Panel>
  );
}

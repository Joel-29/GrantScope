import { useState } from 'react';
import { Wallet, Copy } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useInspection } from '../../features/wallet/useInspection';
import { useInspectionSession } from '../../features/wallet/session';
import { READ_NETWORKS } from '../../features/anon-rpc/transportRegistry';

export function AccountCard() {
  const { target } = useInspectionSession();
  const query = useInspection();
  const [copyStatus, setCopyStatus] = useState('');
  const data = query.data;
  return (
    <section className="account-card" aria-label="Inspected account">
      <div className="account-avatar">
        <Wallet size={25} aria-hidden="true" />
      </div>
      <div className="account-card-copy">
        <p className="eyebrow">ACCOUNT WORKSPACE</p>
        <h2>
          {target ? READ_NETWORKS[target.chainId].name : 'No account selected'}
        </h2>
        {target ? (
          <p className="address-value">{target.address}</p>
        ) : (
          <p>Inspect any public address without connecting a wallet.</p>
        )}
      </div>
      <div className="account-card-status">
        <Badge>
          {query.isFetching
            ? 'Reading anonymously'
            : data
              ? query.isStale
                ? 'Snapshot · Refresh suggested'
                : 'Account read verified'
              : target
                ? 'No verified result'
                : 'Not scanned'}
        </Badge>
        {target && (
          <Button
            size="sm"
            aria-label="Copy inspected address"
            onClick={() => {
              if (!navigator.clipboard?.writeText) {
                setCopyStatus(
                  'Clipboard unavailable. Select and copy the address.',
                );
                return;
              }
              void navigator.clipboard.writeText(target.address).then(
                () => setCopyStatus('Address copied.'),
                () =>
                  setCopyStatus(
                    'Clipboard unavailable. Select and copy the address.',
                  ),
              );
            }}
          >
            <Copy size={14} aria-hidden="true" />
            Copy address
          </Button>
        )}
      </div>
      {data && (
        <div className="account-details">
          <dl>
            <div>
              <dt>Native ETH balance</dt>
              <dd data-testid="native-balance">{data.eth} ETH</dd>
            </div>
            <div>
              <dt>Bytecode detection</dt>
              <dd data-testid="account-kind">
                {data.kind === 'eoa'
                  ? 'EOA · No code at this block'
                  : 'Code present · Read-only account'}
              </dd>
            </div>
            <div>
              <dt>Verified read block</dt>
              <dd>{data.blockNumber.toString()}</dd>
            </div>
            <div>
              <dt>Read route</dt>
              <dd>
                {data.transport} · {new Date(data.readAt).toLocaleTimeString()}
              </dd>
            </div>
          </dl>
          <p>
            State is a snapshot at the displayed block. Bytecode does not
            identify every smart-account standard or delegation scheme. Generic
            revocation is disabled for code-present accounts without a supported
            execution adapter.
          </p>
        </div>
      )}
      <span className="sr-only" role="status">
        {copyStatus}
      </span>
    </section>
  );
}

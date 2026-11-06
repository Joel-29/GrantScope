import { StatePanel } from '../../components/ui/StatePanel';
import { READ_NETWORKS } from '../anon-rpc/transportRegistry';
import { useTransactions } from './store';
export function ActivityList() {
  const { activity } = useTransactions();
  return activity.length === 0 ? (
    <StatePanel
      title="No transaction activity"
      description="No transactions have been requested by this application in this session."
    />
  ) : (
    <ul className="activity-list" aria-label="Revocation activity">
      {activity.map((entry) => (
        <li key={entry.id}>
          <strong>
            {entry.phase === 'verified-zero'
              ? 'Allowance verified zero'
              : entry.phase}
          </strong>
          <p>
            {READ_NETWORKS[entry.chainId].name}
            {entry.verifiedBlock !== undefined
              ? ` · Verified block ${entry.verifiedBlock}`
              : ''}
          </p>
          {entry.hash && (
            <p className="address-value">Transaction: {entry.hash}</p>
          )}
          {entry.message && <p>{entry.message}</p>}
          {entry.phase === 'confirmed' && (
            <p>
              Receipt obtained. Current allowance has not yet been verified.
            </p>
          )}
          {entry.phase === 'unverified' && (
            <p>
              The transaction may still be pending, replaced, dropped or mined.
              Check your wallet. No revoked status is claimed.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

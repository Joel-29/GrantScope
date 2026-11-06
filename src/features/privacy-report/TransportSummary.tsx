import { Link } from 'react-router-dom';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { useAnonRpc } from '../anon-rpc/runtime';
import { WORKERS } from '../anon-rpc/transportRegistry';
export function TransportSummary() {
  const state = useAnonRpc();
  return (
    <Panel
      title="Privacy transport"
      action={
        <Badge>{state.phase === 'ready' ? 'Connected' : state.phase}</Badge>
      }
    >
      <div className="transport-summary">
        <h3>
          {state.phase === 'ready'
            ? `${WORKERS[state.transport].label} worker ready`
            : 'No active anonymous route'}
        </h3>
        <p>
          {state.totals.read.anonymized} successful anonymous responses ·{' '}
          {state.totals.read.failed} failed reads ·{' '}
          {state.totals.bootstrap.completed} direct bootstrap calls. Wallet
          activity is separate.
        </p>
        <Link className="text-link" to="/privacy">
          Inspect measured routes →
        </Link>
      </div>
    </Panel>
  );
}

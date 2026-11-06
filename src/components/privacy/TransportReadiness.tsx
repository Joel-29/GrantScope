import { Badge } from '../ui/Badge';
import { Panel } from '../ui/Panel';
import { useAnonRpc } from '../../features/anon-rpc/runtime';

export function TransportReadiness() {
  const state = useAnonRpc();
  return (
    <Panel
      title="Worker readiness"
      description="Each prerequisite needs independent verification."
    >
      <ol className="readiness-list">
        {[
          ['01', 'Browser harness', 'Official 0.4.0'],
          [
            '02',
            'Worker specifier',
            state.verifiedHash ? 'Hash resolved' : 'Not resolved',
          ],
          [
            '03',
            'Hash-pinned worker',
            state.phase === 'ready' ? 'Verified & ready' : state.phase,
          ],
          [
            '04',
            'Anonymous network',
            state.successfulWorkerReads > 0 && state.phase === 'ready'
              ? 'Worker response received'
              : 'No response proof',
          ],
        ].map(([number, title, status]) => (
          <li key={number}>
            <span className="step-number">{number}</span>
            <strong>{title}</strong>
            <Badge>{status}</Badge>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

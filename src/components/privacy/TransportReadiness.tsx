import { Badge } from '../ui/Badge';
import { Panel } from '../ui/Panel';

export function TransportReadiness() {
  return (
    <Panel
      title="Worker readiness"
      description="Each prerequisite needs independent verification."
    >
      <ol className="readiness-list">
        {[
          ['01', 'Browser harness', 'Not integrated'],
          ['02', 'Worker specifier', 'Not resolved'],
          ['03', 'Hash-pinned worker', 'Not verified'],
          ['04', 'Anonymous network', 'Not checked'],
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

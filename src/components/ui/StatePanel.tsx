import { CircleAlert, ScanLine, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';

export function StatePanel({
  kind = 'empty',
  title,
  description,
  action,
}: {
  kind?: 'empty' | 'error' | 'no-results';
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const Icon =
    kind === 'error' ? CircleAlert : kind === 'no-results' ? SearchX : ScanLine;
  return (
    <div
      className={`state-panel state-${kind}`}
      role={kind === 'error' ? 'alert' : undefined}
    >
      <div className="empty-icon">
        <Icon size={26} aria-hidden="true" />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="state-actions">{action}</div>}
    </div>
  );
}

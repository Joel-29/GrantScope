import { ScanLine } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="empty-state">
      <div className="empty-icon">
        <ScanLine size={28} aria-hidden="true" />
      </div>
      <h2>{title}</h2>
      <div className="empty-description">{children}</div>
      <span className="tag">Module 1 · Foundation</span>
    </section>
  );
}

import type { LucideIcon } from 'lucide-react';

export function MetricCard({
  title,
  icon: Icon,
  detail,
}: {
  title: string;
  icon: LucideIcon;
  detail: string;
}) {
  return (
    <section className="summary-card">
      <div>
        <span>{title}</span>
        <Icon size={18} aria-hidden="true" />
      </div>
      <strong aria-label="Not measured">—</strong>
      <p>{detail}</p>
    </section>
  );
}

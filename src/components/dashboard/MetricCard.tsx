import type { LucideIcon } from 'lucide-react';

export function MetricCard({
  title,
  icon: Icon,
  detail,
  value,
}: {
  title: string;
  icon: LucideIcon;
  detail: string;
  value?: string | undefined;
}) {
  return (
    <section className="summary-card">
      <div>
        <span>{title}</span>
        <Icon size={18} aria-hidden="true" />
      </div>
      <strong aria-label={value === undefined ? 'Not measured' : undefined}>
        {value ?? '—'}
      </strong>
      <p>{detail}</p>
    </section>
  );
}

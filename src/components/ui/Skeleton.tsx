export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton ${className}`} />;
}

export function WorkspaceSkeleton() {
  return (
    <div className="workspace-skeleton" aria-busy="true" role="status">
      <span className="sr-only">Loading GrantScope workspace…</span>
      <Skeleton className="skeleton-heading" />
      <Skeleton className="skeleton-line" />
      <div className="summary-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="summary-card" key={i}>
            <Skeleton className="skeleton-line" />
            <Skeleton className="skeleton-number" />
          </div>
        ))}
      </div>
      <Skeleton className="skeleton-block" />
    </div>
  );
}

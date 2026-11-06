import { useId, type PropsWithChildren, type ReactNode } from 'react';

export function Panel({
  title,
  description,
  action,
  children,
  className = '',
}: PropsWithChildren<{
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}>) {
  const id = useId();
  return (
    <section className={`panel ${className}`} aria-labelledby={id}>
      <header className="panel-heading">
        <div>
          <h2 id={id}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

import type { PropsWithChildren } from 'react';

export type BadgeTone = 'neutral' | 'accent' | 'violet' | 'warning' | 'danger';

export function Badge({
  children,
  tone = 'neutral',
}: PropsWithChildren<{ tone?: BadgeTone }>) {
  return (
    <span className="badge" data-tone={tone}>
      {children}
    </span>
  );
}

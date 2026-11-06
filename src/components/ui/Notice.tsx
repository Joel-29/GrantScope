import { Info } from 'lucide-react';
import type { PropsWithChildren } from 'react';

export function Notice({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <div className="notice">
      <Info size={19} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  );
}

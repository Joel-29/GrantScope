import { Wallet } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function AccountCard() {
  return (
    <section className="account-card" aria-label="Inspected account">
      <div className="account-avatar">
        <Wallet size={25} aria-hidden="true" />
      </div>
      <div className="account-card-copy">
        <p className="eyebrow">ACCOUNT WORKSPACE</p>
        <h2>No account selected</h2>
        <p>Inspection will work without connecting a wallet.</p>
      </div>
      <div className="account-card-status">
        <Badge>Not scanned</Badge>
        <span>Account type & last block unavailable</span>
      </div>
    </section>
  );
}

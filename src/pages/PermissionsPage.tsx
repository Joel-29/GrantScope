import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';

export function PermissionsPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="SPENDING AUTHORITY"
        title="Permissions"
        description="Supported ERC-20 and Permit2 permissions will appear here after a live scan."
      />
      <div className="panel">
        <EmptyState title="Permission scanning is not implemented">
          <p>
            This foundation contains no permission records. Historical
            discovery, allowance reads, and transaction actions are planned for
            later modules.
          </p>
          <Link to="/about" className="text-link">
            Explore the methodology
          </Link>
        </EmptyState>
      </div>
    </div>
  );
}

export function PermissionDetailPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="PERMISSION INSPECTION"
        title="Permission unavailable"
        description="No verified permission records exist in this foundation build."
      />
      <div className="panel">
        <EmptyState title="Nothing to inspect yet">
          <p>
            A URL alone does not identify a verified allowance. Permission
            details will require a successful live scan.
          </p>
          <Link to="/permissions" className="button button-secondary">
            Back to permissions
          </Link>
        </EmptyState>
      </div>
    </div>
  );
}

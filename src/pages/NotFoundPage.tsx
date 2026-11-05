import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';

export function NotFoundPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="404"
        title="This page isn’t here"
        description="Return to the workspace to continue exploring GrantScope."
      />
      <Link to="/" className="button button-primary">
        Back to overview
      </Link>
    </div>
  );
}

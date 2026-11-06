import { Link } from 'react-router-dom';

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="GrantScope home">
      <img src="/icons/grantscope.svg" alt="" width="36" height="36" />
      <span>
        GrantScope<span className="brand-subtitle">PERMISSION OBSERVATORY</span>
      </span>
    </Link>
  );
}

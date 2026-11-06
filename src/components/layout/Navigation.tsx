import {
  Activity,
  ArrowUpRight,
  Fingerprint,
  House,
  LayoutDashboard,
  ListFilter,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Overview', icon: House },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/permissions', label: 'Permissions', icon: ListFilter },
  { to: '/privacy', label: 'Privacy Lab', icon: Fingerprint },
  { to: '/settings', label: 'Settings', icon: Settings2 },
  { to: '/about', label: 'Methodology', icon: ShieldCheck },
];

export function Navigation({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav aria-label="Main navigation" className="nav-links">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={19} aria-hidden="true" />
            <span className={collapsed ? 'sr-only' : ''}>{label}</span>
            {to === '/privacy' && !collapsed && <span className="nav-dot" />}
          </NavLink>
        ))}
      </nav>
      {!collapsed && (
        <div className="sidebar-bottom">
          <div className="build-note">
            <Activity size={16} aria-hidden="true" />
            <span>
              Anonymous read transport
              <span className="muted">Nym primary · Explicit routing</span>
            </span>
          </div>
          <a
            href="https://ethereum.github.io/anon-rpc/"
            target="_blank"
            rel="noreferrer"
          >
            Anon-RPC documentation
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      )}
    </>
  );
}

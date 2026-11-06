import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, Menu, Shield, X } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { useUiStore } from '../../store/useUiStore';
import { Navigation } from './Navigation';
import { Header } from './Header';
import { Brand } from './Brand';
import { Button } from '../ui/Button';

export function AppShell() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(location.pathname);
  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      previousPath.current = location.pathname;
      main.current?.focus();
      window.scrollTo({ top: 0 });
    }
  }, [location.pathname]);

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Brand />
        <p className={`nav-label ${sidebarCollapsed ? 'sr-only' : ''}`}>
          WORKSPACE
        </p>
        <Navigation collapsed={sidebarCollapsed} />
        <button
          className="collapse-button"
          onClick={toggleSidebar}
          aria-label={
            sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'
          }
          aria-expanded={!sidebarCollapsed}
        >
          <ChevronLeft size={17} aria-hidden="true" />
          <span>{sidebarCollapsed ? '' : 'Collapse sidebar'}</span>
        </button>
      </aside>
      <div className="workspace">
        <Header
          mobileNavigation={
            <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
              <Dialog.Trigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mobile-menu"
                  aria-label="Open navigation"
                >
                  <Menu size={22} aria-hidden="true" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="dialog-overlay" />
                <Dialog.Content className="mobile-navigation">
                  <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Browse the GrantScope workspace.
                  </Dialog.Description>
                  <Brand />
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="dialog-close"
                      aria-label="Close navigation"
                    >
                      <X size={20} aria-hidden="true" />
                    </Button>
                  </Dialog.Close>
                  <Navigation onNavigate={() => setMobileOpen(false)} />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          }
        />
        <main id="main-content" tabIndex={-1} ref={main}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>
            <Shield size={14} aria-hidden="true" />
            Your permissions. Your perspective.
          </span>
          <span>
            Module 2<span className="footer-divider">/</span>No blockchain
            requests
          </span>
        </footer>
      </div>
    </div>
  );
}

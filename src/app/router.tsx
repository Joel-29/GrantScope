import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LandingPage } from '../pages/LandingPage';
import { RouteError } from '../components/ui/RouteError';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    hydrateFallbackElement: (
      <main className="fatal-error" aria-busy="true">
        <p role="status">Loading GrantScope workspace…</p>
      </main>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, Component: LandingPage },
      {
        path: 'dashboard',
        lazy: async () => ({
          Component: (await import('../pages/DashboardPage')).DashboardPage,
        }),
      },
      {
        path: 'permissions',
        lazy: async () => ({
          Component: (await import('../pages/PermissionsPage')).PermissionsPage,
        }),
      },
      {
        path: 'permissions/:id',
        lazy: async () => ({
          Component: (await import('../pages/PermissionsPage'))
            .PermissionDetailPage,
        }),
      },
      {
        path: 'privacy',
        lazy: async () => ({
          Component: (await import('../pages/PrivacyPage')).PrivacyPage,
        }),
      },
      {
        path: 'settings',
        lazy: async () => ({
          Component: (await import('../pages/SettingsPage')).SettingsPage,
        }),
      },
      {
        path: 'about',
        lazy: async () => ({
          Component: (await import('../pages/AboutPage')).AboutPage,
        }),
      },
      {
        path: '*',
        lazy: async () => ({
          Component: (await import('../pages/NotFoundPage')).NotFoundPage,
        }),
      },
    ],
  },
]);

import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LandingPage } from '../pages/LandingPage';
import { RouteError } from '../components/ui/RouteError';
import { WorkspaceSkeleton } from '../components/ui/Skeleton';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    hydrateFallbackElement: <WorkspaceSkeleton />,
    errorElement: <RouteError />,
    children: [
      { index: true, Component: LandingPage },
      ...(import.meta.env.DEV
        ? [
            {
              path: 'design-system',
              lazy: async () => ({
                Component: (await import('../design-system/DesignPreviewPage'))
                  .DesignPreviewPage,
              }),
            },
          ]
        : []),
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

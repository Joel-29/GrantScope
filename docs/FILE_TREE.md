# Module 2 file tree

Generated dependencies, build output, caches and transient test artifacts are excluded. Feature boundaries containing only .gitkeep are reserved for later integrations.

```text
GrantScope/
|-- .github/
|   `-- workflows/
|       `-- ci.yml
|-- docs/
|   |-- screenshots/
|   |   |-- dashboard-dark.png
|   |   |-- dashboard-light.png
|   |   |-- overview-desktop.png
|   |   |-- overview-mobile.png
|   |   `-- settings-mobile-light.png
|   |-- ARCHITECTURE.md
|   |-- CROPS.md
|   |-- DEMO.md
|   |-- DESIGN_SYSTEM.md
|   |-- FILE_TREE.md
|   |-- LIMITATIONS.md
|   |-- PRIVACY.md
|   |-- PRIZE_COMPLIANCE.md
|   `-- TESTING.md
|-- e2e/
|   |-- design-system.spec.ts
|   `-- shell.spec.ts
|-- public/
|   |-- icons/
|   |   `-- grantscope.svg
|   `-- illustrations/
|       `-- .gitkeep
|-- scripts/
|   `-- check-production.mjs
|-- src/
|   |-- app/
|   |   |-- App.tsx
|   |   |-- providers.tsx
|   |   |-- router.tsx
|   |   `-- ThemeProvider.tsx
|   |-- components/
|   |   |-- dashboard/
|   |   |   |-- AccountCard.tsx
|   |   |   `-- MetricCard.tsx
|   |   |-- layout/
|   |   |   |-- AppShell.tsx
|   |   |   |-- Brand.tsx
|   |   |   |-- Header.tsx
|   |   |   |-- Navigation.tsx
|   |   |   `-- ThemeToggle.tsx
|   |   |-- permissions/
|   |   |   `-- PermissionInventory.tsx
|   |   |-- privacy/
|   |   |   `-- TransportReadiness.tsx
|   |   `-- ui/
|   |       |-- Badge.tsx
|   |       |-- Button.tsx
|   |       |-- EmptyState.tsx
|   |       |-- ErrorBoundary.tsx
|   |       |-- InfoDialog.tsx
|   |       |-- Notice.tsx
|   |       |-- PageHeader.tsx
|   |       |-- Panel.tsx
|   |       |-- RouteError.tsx
|   |       |-- Skeleton.tsx
|   |       `-- StatePanel.tsx
|   |-- data/
|   |   `-- .gitkeep
|   |-- design-system/
|   |   |-- DesignPreviewPage.tsx
|   |   `-- fixtures.ts
|   |-- features/
|   |   |-- anon-rpc/
|   |   |   `-- .gitkeep
|   |   |-- discovery/
|   |   |   `-- .gitkeep
|   |   |-- erc20/
|   |   |   `-- .gitkeep
|   |   |-- exposure/
|   |   |   `-- .gitkeep
|   |   |-- permit2/
|   |   |   `-- .gitkeep
|   |   |-- privacy-report/
|   |   |   `-- .gitkeep
|   |   |-- revocation/
|   |   |   `-- .gitkeep
|   |   `-- wallet/
|   |       `-- .gitkeep
|   |-- hooks/
|   |   `-- useTheme.ts
|   |-- lib/
|   |   |-- abi/
|   |   |   `-- .gitkeep
|   |   |-- config/
|   |   |   `-- env.ts
|   |   |-- ethereum/
|   |   |   `-- .gitkeep
|   |   `-- utils/
|   |       `-- .gitkeep
|   |-- pages/
|   |   |-- AboutPage.tsx
|   |   |-- DashboardPage.tsx
|   |   |-- LandingPage.tsx
|   |   |-- NotFoundPage.tsx
|   |   |-- PermissionsPage.tsx
|   |   |-- PrivacyPage.tsx
|   |   `-- SettingsPage.tsx
|   |-- store/
|   |   `-- useUiStore.ts
|   |-- styles/
|   |   |-- components.css
|   |   |-- globals.css
|   |   `-- tokens.css
|   |-- test/
|   |   |-- design-system.test.tsx
|   |   |-- setup.ts
|   |   `-- shell.test.tsx
|   `-- main.tsx
|-- .editorconfig
|-- .env.example
|-- .gitignore
|-- .nvmrc
|-- .prettierignore
|-- .prettierrc.json
|-- AGENTS.md
|-- eslint.config.js
|-- index.html
|-- LICENSE
|-- package-lock.json
|-- package.json
|-- playwright.config.ts
|-- README.md
|-- tsconfig.app.json
|-- tsconfig.json
|-- tsconfig.node.json
|-- vercel.json
`-- vite.config.ts
```

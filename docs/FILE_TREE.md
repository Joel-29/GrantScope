# Module 1 file tree

Generated dependencies, build output, npm cache, and test artifacts are excluded. Reserved feature directories contain only `.gitkeep`; no blockchain services are stubbed out.

```text
GrantScope/
├── .github/workflows/ci.yml
├── .editorconfig
├── .env.example
├── .gitignore
├── .nvmrc
├── .prettierignore
├── .prettierrc.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CROPS.md
│   ├── DEMO.md
│   ├── FILE_TREE.md
│   ├── LIMITATIONS.md
│   ├── PRIVACY.md
│   ├── PRIZE_COMPLIANCE.md
│   ├── TESTING.md
│   └── screenshots/
│       ├── overview-desktop.png
│       └── overview-mobile.png
├── e2e/shell.spec.ts
├── public/
│   ├── icons/grantscope.svg
│   └── illustrations/.gitkeep
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── providers.tsx
│   │   └── router.tsx
│   ├── components/
│   │   ├── dashboard/.gitkeep
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   └── Navigation.tsx
│   │   ├── permissions/.gitkeep
│   │   ├── privacy/.gitkeep
│   │   └── ui/
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── PageHeader.tsx
│   │       └── RouteError.tsx
│   ├── data/.gitkeep
│   ├── features/
│   │   ├── anon-rpc/.gitkeep
│   │   ├── discovery/.gitkeep
│   │   ├── erc20/.gitkeep
│   │   ├── exposure/.gitkeep
│   │   ├── permit2/.gitkeep
│   │   ├── privacy-report/.gitkeep
│   │   ├── revocation/.gitkeep
│   │   └── wallet/.gitkeep
│   ├── hooks/.gitkeep
│   ├── lib/
│   │   ├── abi/.gitkeep
│   │   ├── config/env.ts
│   │   ├── ethereum/.gitkeep
│   │   └── utils/.gitkeep
│   ├── pages/
│   │   ├── AboutPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── LandingPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── PermissionsPage.tsx
│   │   ├── PrivacyPage.tsx
│   │   └── SettingsPage.tsx
│   ├── store/useUiStore.ts
│   ├── styles/globals.css
│   ├── test/
│   │   ├── setup.ts
│   │   └── shell.test.tsx
│   └── main.tsx
├── eslint.config.js
├── index.html
├── LICENSE
├── package-lock.json
├── package.json
├── playwright.config.ts
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts
```

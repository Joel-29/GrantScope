# Architecture

Status: Module 2 design system and application shell.

`main.tsx` mounts the strict-mode React application. `app/providers.tsx` owns an in-memory TanStack Query client, a render error boundary, and Motion’s reduced-motion policy. `app/router.tsx` owns route composition and lazy secondary pages. `components/layout` handles navigation and route-change focus. Pages contain presentation, not blockchain logic.

`store/useUiStore.ts` contains sidebar and theme preferences and has no persistence middleware. Query retries are disabled by default until feature-specific retry and cancellation policies exist. There is no query persistence adapter or service worker.

Module 2 adds session-only theme preference to that store. `ThemeProvider` applies document theme tokens, and `hooks/useTheme.ts` follows device theme changes when requested. `components/ui` owns shared primitives; dashboard, permissions, and privacy subfolders own presentation only. The development-only `design-system` route has isolated, labeled fixture records and is removed from production builds. See [DESIGN_SYSTEM](DESIGN_SYSTEM.md).

Reserved feature directories: anon-rpc, wallet, erc20, discovery, permit2, exposure, revocation, privacy-report. They contain no pretend implementations. Future services must use a single explicit transport boundary; chain reads must never be embedded in UI components or silently fall back to ordinary fetch.

Future ownership:

- AnonRpcManager: official harness lifecycle, hash-pinned worker verification, route readiness and shutdown.
- JSON-RPC adapter: typed validated requests/results, cancellation and local route instrumentation.
- Scanning: known-pair reads and bounded event discovery with coverage.
- Exposure: deterministic BigInt analysis, explicit evidence, overlapping permissions.
- Revocation: account/chain authorization, simulation, wallet submission, receipt and fresh allowance verification.

All remain unimplemented. No smart-account execution adapter is included.

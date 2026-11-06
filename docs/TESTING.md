# Testing

Run `npm ci`, then `npm run check`. For browser tests, run `npx playwright install chromium` and `npm run test:e2e`.

To use an already-installed Chrome instead of downloading Playwright Chromium, set `PLAYWRIGHT_CHANNEL=chrome` before running the browser tests. In PowerShell: `$env:PLAYWRIGHT_CHANNEL='chrome'; npm.cmd run test:e2e`. CI uses the default Playwright-managed Chromium.

The current suite covers route entry, useful empty and missing-page states, navigation, focus restoration, mobile dialog behavior, unavailable measurements, no application fetch on the Privacy Lab page, and desktop/mobile overflow. CI runs TypeScript, ESLint, Prettier, unit tests, build, and Chromium browser smoke tests.

Module 2 extends this coverage to native theme controls, device theme changes, dialog focus containment, activity drawer, disabled network controls, fixture filtering/recovery, mobile fixture cards, skeleton announcements and reduced-motion behavior. CI runs the browser suite against both the development server and production preview; set `PLAYWRIGHT_PRODUCTION=1` to select the latter locally after building. The default suite uses the development-only workshop, while the production suite asserts its 404 boundary. The build also runs `scripts/check-production.mjs` to reject fixture payloads in shipped JavaScript.

Foundation tests do not cover blockchain or security logic that does not exist. Do not use them as evidence of anonymity. Later modules require deterministic unit tests for validation, ABI/BigInt handling, event discovery limits, transport failures and no fallback, route accounting, smart-account restrictions, signing failures, and fresh post-revocation verification. A separate opt-in live suite must verify the real official worker with actual RPC reads. Wallet signing tests require a controlled test wallet and explicit chain evidence.

Browser traces and screenshots are ignored under `test-results/` and `playwright-report/`. Never check in artifacts containing wallet secrets. Validation results must describe commands actually executed and distinguish missing environmental capabilities from passing tests.

## Toolchain compatibility notes

Installation reports that ESLint 9 is no longer supported. It is retained because `eslint-plugin-jsx-a11y@6.10.2` declares peer support only through ESLint 9; do not force an incompatible peer override. Upgrade the accessibility plugin and ESLint together when supported. The test-only jsdom 26 dependency also brings the deprecated `whatwg-encoding@3.1.1`. These warnings are tooling limitations, not evidence that checks failed or passed.

The initial audit identified a moderate denial-of-service advisory in the TypeScript lint tooling's minimatch dependency ([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)). A scoped override pins that dependency to the patched `11.0.1`. Its Node engine range supports this project's runtime, and the consumer uses its named CommonJS `minimatch` export. Recheck compatibility and remove the override when typescript-estree natively accepts a patched release. This package is development tooling, not application wallet logic.

## Module 1 validation performed

Validated locally with Node 20.20.1 and npm 10.8.2:

| Check                                                               | Result                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------- |
| TypeScript (`tsc -b --pretty false`)                                | Passed                                                        |
| ESLint (`eslint . --max-warnings 0`)                                | Passed                                                        |
| Prettier (`prettier --check .`)                                     | Passed                                                        |
| Vitest                                                              | 8 tests passed                                                |
| Production build (`npm run build`)                                  | Passed; lazy route chunks and a separate Motion chunk emitted |
| Production preview HTTP response                                    | 200                                                           |
| Playwright against production preview, installed Chrome, one worker | 4 tests passed, desktop and emulated Pixel 7                  |
| Patched minimatch named CommonJS import and glob matching           | Passed                                                        |
| npm audit after scoped override                                     | 0 vulnerabilities reported                                    |

The initial TypeScript run found missing DOM libraries for browser-evaluated E2E code; `tsconfig.node.json` was corrected. The first browser run could not launch because the Playwright-managed Chromium revision was absent. The installed Chrome channel passed. Automatic test-server teardown hung in this Windows sandbox, so final browser verification used a separately started production preview with Playwright's existing-server reuse. The final browser command exited successfully; the preview was shut down separately.

PowerShell's default npm launcher was restricted in this environment. Validation used Node to invoke the bundled `C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js` and local tool entrypoints. Dependency installation needed sandbox network approval and a workspace-local npm cache.

Rollup reports two upstream Zod comment-annotation warnings and strips those comments; the production build succeeds. The installation deprecation notes above remain. CI, a Vercel deployment, a live anonymous worker, and blockchain workflows have not been executed or verified.

## Module 2 validation performed

Local checks passed with the existing dependency versions; no new packages were added:

| Check                                                             | Result                                              |
| ----------------------------------------------------------------- | --------------------------------------------------- |
| Strict TypeScript                                                 | Passed                                              |
| ESLint including the production guard script                      | Passed                                              |
| Vitest / Testing Library                                          | 15 tests passed across 2 files                      |
| Production build and fixture-exclusion check                      | Passed                                              |
| Development Playwright suite, installed Chrome                    | 12 tests passed across desktop and emulated Pixel 7 |
| Focused workshop/mobile-card verification after adding assertions | 2 tests passed                                      |
| Production Playwright suite, installed Chrome                     | 12 tests passed, including workshop 404             |

Browser coverage includes both themes on all live routes, a 320px viewport, session reset on reload, system theme updates, focus trapping/restoration, unique DOM IDs, no external requests during the settings/dialog flow, no fixture records on live routes, mobile fixture cards, and reduced-motion skeletons. Actual production screenshots are in `docs/screenshots/`; they contain no mock wallet state.

Development checks initially caught a restricted-name icon import and test-only type mistakes; these were corrected. The new Node build guard needed a Node ESLint environment, which is now scoped to `scripts/**/*.mjs`. The final checks passed. Inherited upstream Zod annotation/deprecation warnings remain as described above. No blockchain transport, signing, or live integration test exists or was claimed.

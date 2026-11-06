# Testing

## Module 8 evidence

53 unit/Testing Library tests passed across nine files. Adversarial cases cover negative/out-of-width amounts, uint256 maximum with zero balance, one-wei precision, expired/dependency-blocked Permit2, exact expiry boundary, unknown spenders, unknown/future event age and mixed-block grouping. A Testing Library query-cache test verifies state updates and accessible filtering without RPC. TypeScript, ESLint and production build passed. The production browser suite passed 20 deterministic tests with ten opt-in live cases skipped. Analysis uses previously verified chain records; these deterministic tests do not create new live blockchain evidence or prove maliciousness detection.

## Module 7 evidence

45 unit tests passed across seven files, including both official Permit2 grant event layouts, foreign emitters, uint160 maximum, uint48 maximum nonce, expiry at the exact boundary, shared zero underlying approval and chain mismatch. TypeScript, ESLint and production build passed. The deterministic production browser suite passed 20 tests with ten live cases skipped. The separately opted-in Nox browser test passed in 58.8 seconds, reading four canonical Sepolia Permit2 pairs and their actual ERC-20 dependencies with zero unreadable pairs. The zero owner produced no claimed positive authorization; no signed Permit or lockdown transaction has been demonstrated. Reproduce with `e2e/permit2.spec.ts --grep "live canonical"` and the explicit live environment variables.

## Module 6 evidence

42 unit tests passed across six files, including encoded known Approval logs, duplicate events, ERC-721 ambiguity, range-limit splitting, permanent provider failure and changed canonical anchors. TypeScript, ESLint and the production build passed. The production browser suite passed 18 deterministic tests with eight live cases skipped. The opted-in Nox browser test successfully queried Sepolia block 1,000,000 for the zero owner: one anonymous log request, zero coverage gaps, 28.7 seconds (30.1 seconds total). This establishes a real configured-network log query, not discovery of a positive historical grant. No exhaustive history or mainnet discovery evidence is claimed.

Reproduce with the live environment variables described below and `npx playwright test e2e/discovery.spec.ts --grep "live anonymous" --project desktop-chromium --workers=1`.

## Module 5 evidence

37 unit tests passed across five files; TypeScript, ESLint, formatting and production build passed. The production deterministic browser suite passed 16 tests, with six live cases skipped. A separately opted-in real Nox Sepolia ERC-20 scan passed in 57.9 seconds (59.1 seconds total): six USDC/WETH ? registered-spender pairs, valid metadata/balance/allowance responses, zero failed pair reads, and a working maximum-size filter. The zero address was inspected; this proves real allowance reads, not a positive grant or a signed revocation. Browser request auditing permitted only the two fixed bootstrap selectors directly; no target reads used conventional RPC. The first live run returned all six pairs but stalled at an overly strict label selector; the corrected test passed.

Reproduce: set `PLAYWRIGHT_CHANNEL=chrome`, `PLAYWRIGHT_PRODUCTION=1`, `LIVE_ANON_RPC=1`, and explicitly `LIVE_TRANSPORT=nox`, then run `npx playwright test e2e/allowances.spec.ts --grep "live anonymous" --project desktop-chromium --workers=1`. Nym remains the default; Nox was selected explicitly after the preceding documented Nym timeout.

## Module 4 evidence

32 unit tests passed across four files. Strict TypeScript, ESLint and production build passed. The deterministic production browser suite passed 14 tests with four live cases skipped. A separately opted-in real Sepolia inspection via explicitly selected Nox passed in 30.4 seconds, displaying native ETH and no-code account detection without a wallet connection and without direct target RPC. A preceding Nym initialization timed out and remained a visible failure. No signing or transaction was exercised. See [INSPECTION](INSPECTION.md).

## Module 3 live and deterministic evidence

The official harness/adapter integration adds nine deterministic transport tests (24 unit tests overall), covering viem compatibility, worker reuse, unavailable Tor, restricted bootstrap, malformed RPC responses, initialization timeout, stale-session protection, cancellation, and no direct fallback. Strict TypeScript, ESLint and production fixture isolation passed. The ordinary production browser suite passed 12 tests with two opt-in live tests correctly skipped.

Separately, the real production browser test passed for Nym (42.2 seconds) and explicitly selected Nox (15.0 seconds), returning valid Sepolia chain ID, block and balance results via actual workers. Two specifier calls were the only direct RPC reads observed. Independent probes and a same-worker raw/manager comparison also returned real data. Tor failed KPS dialing, and earlier Nym request attempts timed out; neither was reported as an anonymous success. See [ANON_RPC](ANON_RPC.md) for the observed values, source/API verification, storage trust boundaries and reproduction commands.

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

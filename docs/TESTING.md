# Testing

## Live rehearsal follow-up, 6 November 2026

The [latest follow-up](DEMO_CHECK.md) records real successful Nym/Nox probes, positive configured-allowance UI reads and additional failed sessions. It also documents the new read-only rehearsal command, private session URLs, corrected bootstrap URL normalization and isolated browser artifacts. Fresh checks passed 106 unit/UI tests, nine release-tool tests, the production build and 26 browser checks in each mode, with twelve opt-in live skips per regular suite. Signing and hosted deployment remain owner-run steps. The preceding failed review below remains historical evidence.

## Latest deployment review, 6 November 2026

The [final review](FINAL_REVIEW.md) supersedes the readiness implications of earlier successful runs below. The latest real Nym diagnostic timed out, the fresh Nox diagnostic failed bootstrap, and the configured scan reached a ready Nox worker but failed its first application read. No real allowance or anonymous diagnostic succeeded in this review. Historical successes remain historical evidence, not current availability proof. Fresh deterministic checks and exact live accounting are recorded in that review and its sanitized export.

## Release handoff checks, 6 November 2026

The release tooling adds a bounded HTTPS route/header/asset verifier, a remote-origin Playwright runner, and a local-only post-revocation verifier. Fresh strict TypeScript and ESLint checks passed. Vitest passed 95 tests across 14 files; Node's release-tool suite passed five tests covering URL credentials/target rejection, response limits, headers/assets, private-input requirements and unsupported transport refusal. The production build and fixture/local-address exclusion passed with the existing upstream warnings.

Fresh desktop/mobile browser runs each passed 26 deterministic tests on development and production, with twelve opt-in live cases skipped in each run. No hosted origin was tested or deployment created. The local verifier's missing-hash guard was exercised separately and exited before browser launch; the first shell assertion needed correction for PowerShell's wrapped stderr formatting. No signed hash was supplied, so the full private verification path remains unexecuted against a real revocation. Its underlying receipt/intent/reorg/state guards retain the application's security-unit coverage. Do not present those mocked cases as live signed evidence.

The latest preceding review commit's GitHub CI run also reported success: [run 42192068037](https://github.com/Joel-29/GrantScope/actions/runs/42192068037), commit `1b033ab`. That result applies to that commit, not unobserved later CI runs. No additional real allowance read or wallet submission was made during release handoff; earlier live successes/failures below remain dated evidence.

Use `npm run test:release` for the Node checks. After the owner deploys, use the commands in [DEPLOYMENT](DEPLOYMENT.md#verify-the-actual-hosted-origin). Hosted tests cannot load the private local demo, even if its opt-in environment flag is accidentally set. `.env.local`, local CLI authentication and private verification artifacts remain ignored and excluded from deployment uploads.

## Follow-up review, 6 November 2026

Fresh results after the follow-up fixes, using Node 20.20.1, npm 10.8.2 and installed Chrome:

| Check                                                           | Actual result                                                                                                                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Strict TypeScript, ESLint, Prettier and diff whitespace         | Passed                                                                                                                                                                                                 |
| Vitest / Testing Library                                        | 95 passed across 14 files                                                                                                                                                                              |
| Development browser suite                                       | 26 passed; 12 opt-in live cases skipped                                                                                                                                                                |
| Production browser suite                                        | 26 passed; 12 opt-in live cases skipped                                                                                                                                                                |
| Production build and development-fixture/local-config exclusion | Passed                                                                                                                                                                                                 |
| npm advisory audit, including development dependencies          | Zero known vulnerabilities reported at review time                                                                                                                                                     |
| Tracked/staged local configuration guard                        | Passed; `.env.local` remains ignored                                                                                                                                                                   |
| Real primary Nym diagnostic                                     | Failed: initialization deadline reached at 120 seconds; two successful direct bootstrap calls, zero application read attempts and zero anonymous successes                                             |
| Explicit real Nox Sepolia diagnostic                            | Passed in 31.5 seconds (34.1 seconds total): actual `eth_chainId`, `eth_blockNumber` and `eth_getBalance` through the worker; three anonymous successes, two direct bootstrap calls, zero wallet calls |
| Configured local Sepolia ERC-20 browser scan via Nox            | Passed in approximately 1.7 minutes: returned 100 GST, 18 decimals, displayed real state/unsigned zeroing intent and required owner authorization; no wallet submission                                |

The [fresh sanitized traffic export](evidence/review-nox-traffic.json) contains route/method/outcome/timing only. Its 100.0% share describes three successful anonymous responses divided by three completed application reads; bootstrap and wallet activity are separate. Local demo addresses never enter this report or committed evidence. Screenshot, trace and video capture were disabled for the configured scan; its existing allowance was preserved.

Regression tests cover pre-dispatch route accounting, reorgs affecting preparation or only the later zero-state block, noncanonical allowance results, preflight cancellation on leaving the view, cache removal, lower canonical heads, later positive grants and Permit2 dependency supersession. They are mocked security/state evidence, not live signed-transaction evidence. Initial new-test assertions and TypeScript issues were corrected. Concurrent transform load exposed a lazy-route timeout; four bounded Vitest workers resolved it without relaxing assertions. A development browser run was interrupted by a Vite configuration restart; the complete stable-server rerun passed. No failed Nym attempt was relabeled successful.

Reproduce deterministic checks with the commands below. For these Windows browser runs, separate existing servers were used on development port 4174 and production preview port 4173, `PLAYWRIGHT_CHANNEL=chrome`, and one Playwright worker. Live commands targeted `e2e/anon-rpc.live.spec.ts` with `LIVE_ANON_RPC=1` and explicit `LIVE_TRANSPORT=nym` then `nox`. The private-config case targeted only `e2e/local-demo.live.spec.ts` with `LIVE_LOCAL_DEMO=1` and `LIVE_TRANSPORT=nox` on port 4174. External live cases remain opt-in.

Owner-signed revocation and fresh post-signing zero evidence, positive Permit2 lockdown, a deployed HTTPS-origin check and a completed judging recording remain unperformed. Build warnings remain two upstream Zod comment annotations and a 528.27 kB main JavaScript chunk. No complete coverage percentage, remote CI success or independent security audit is claimed.

## Module 12 final release checks

TypeScript, ESLint, Prettier, 82 unit/Testing Library tests across thirteen files, production build, fixture/local-demo exclusion and tracked/staged configuration guards passed. The final production Playwright suite passed 24 deterministic desktop/mobile tests with twelve opt-in live cases skipped. Four focused route/navigation tests passed again after final copy cleanup. Development browser checks in Module 11 passed 24 tests with twelve live skips; those are separate from the real configured-pair success.

Actual final production dashboard captures were generated in dark, light and mobile views using fresh browser contexts with no account selected and no external requests. No local demo identities were captured. The production output contains neither the development loader nor locally configured addresses.

The latest real configured Sepolia positive-allowance browser scan passed with documented Nox settings and no wallet signing/submission. Earlier Nym and Nox failures remain recorded above/below; no blind retry or direct fallback is presented as success. Owner-signed revocation, verified post-signing zero state, hosted Vercel-origin checks, judging video and published demo URL remain pending. The configured allowance was intentionally preserved. Build warnings remain the two upstream Zod annotations and a main chunk above 500 kB. No remote CI run or independent audit is claimed.

## Module 11 evidence

82 unit/Testing Library tests passed across thirteen files. Strict TypeScript, ESLint, Prettier, production build and the production/local-configuration exclusion guards passed. Regressions cover stalled SDK deadlines, pre-dispatch cancellation, bounded/ambiguous RPC bodies, wallet startup races and partial listener cleanup, all-cache cancellation, unsupported chains, scan-local metadata reuse and reorg-discarded snapshots. The development and production browser suites each passed 24 deterministic checks with twelve opt-in live cases skipped. No full test-coverage percentage is claimed.

The first configured local Sepolia browser scan failed while the default Nox tunnel settings were unstable; a separate sequential probe returned some real reads before a tunnel-open failure. A fresh Nym attempt also timed out and remained a failure. After applying documented Nox 0.4.0 timeout bounds with TLS required and background spare tunnels disabled, the real configured-pair browser test passed in approximately 1.7 minutes. It verified positive ERC-20 allowance/metadata on the dashboard, unsigned approve-to-zero calldata, no direct target RPC, no wallet submission, and a disabled owner-signing action without a connected wallet. Local identities are omitted from source, tests, screenshots and committed evidence; screenshots, tracing and video were disabled for that case. No revocation was executed.

GitHub public API returned HTTP 200 with public visibility, MIT license and main as the default branch. This verifies repository metadata, not a Vercel deployment or CI run.

## Module 10 evidence

72 unit/Testing Library tests passed across twelve files, including full-session counters after 1,100 records, separate read/bootstrap/wallet denominators, failed-worker no-fallback behavior, wallet-read refusal and export field exclusion. TypeScript, ESLint, formatting and production build passed. The production browser suite passed 24 tests with ten live cases skipped, including unavailable Tor and accurate empty export.

The fresh primary Nym worker initialized but its first chain-ID request timed out after 24,037 ms: zero anonymous successes, one failed read, two direct bootstrap calls, and 0.0% anonymous-read share. This live test failed and is retained as failure evidence. An explicitly selected Nox run then passed in 16.0 seconds (17.2 seconds total). Its real exported report recorded exactly three successful anonymous Sepolia reads, two fixed direct bootstrap calls and zero wallet API calls; anonymous-read share was 100.0% of those completed application reads, not overall network traffic. No automated fallback occurred. The sanitized report is preserved in `docs/evidence/module10-nox-traffic.json`.

## Module 9 evidence

67 unit/Testing Library tests passed across eleven files. Security cases cover exact approve-to-zero and canonical lockdown calldata, ownership/network mismatch, code-present accounts, missing contract, already-zero state, false-return simulation, insufficient ETH, unsafe nonce precision, changed allowance/gas/context, wallet rejection, canonical receipt and transaction identity, nonzero post-state, reorg, replacement intent and timeout. UI tests disable smart-account signing, serialize submissions and distinguish receipt confirmation from verified zero. TypeScript, ESLint and production fixture isolation/build passed. The build currently reports the inherited Zod annotation warnings and a larger viem-containing chunk warning. The production browser suite passed 22 tests with ten live cases skipped; wallet rejection remains rejected on desktop and mobile. No signed live transaction or positive allowance revocation has been run: a funded owner-controlled wallet is unavailable in the automated environment. Mocked security cases are not live transaction evidence.

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

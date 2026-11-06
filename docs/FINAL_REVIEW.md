# Final deployment review — 6 November 2026

**Buildable for a Vercel preview; not verified ready for a reliable end-to-end judging demo.** The official Nym and Nox routes failed in fresh real browser sessions. No direct fallback, wallet connection, signature or transaction was performed. Existing local demo identities remain private and the allowance was left untouched.

## Corrected defects

- A ready worker previously retained a misleading connected label after a failed read. Read health now appears separately in the header, Privacy Lab, readiness panel and sanitized export.
- A diagnostic previously discarded earlier valid results when a later request failed. It now retains actual chain/block/balance responses individually, guards against stale sessions and cancels reads when closed or unmounted. Switching from Nym to Nox still requires an explicit user action.
- Transient fixed-specifier bootstrap failures now receive one bounded retry. Each attempt is counted; malformed data and RPC rejection remain failures. Application reads never fall back to direct RPC.
- The owner confirmation dialog now displays exact calldata and zero transaction value alongside owner, chain, target and gas conditions. No action submits before wallet confirmation.
- The ordinary browser command previously failed three tests under six-worker resource contention while its single-worker rerun passed. The default is now one worker; assertions were not relaxed. Live request auditing checks every page JSON-RPC request against the exact specifier, selector, provider and parameters, including bounded bootstrap retries.
- Stale HTML metadata was corrected. Coverage language explicitly qualifies the fixed project tagline; scans cannot enumerate every authority.

## Executed checks

Environment: Node 20.20.1, npm 10.8.2, installed Chrome, Windows. Dependency versions and lockfile were unchanged by these fixes.

| Check                            | Result                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm ci`, preceding audit        | Passed: 446 installed, 453 audited, zero vulnerabilities reported. Earlier attempts failed with `EPERM` while Vite held a native binary; installation succeeded after stopping that process. Not rerun while current servers were running. |
| TypeScript                       | Passed on final application/test sources.                                                                                                                                                                                                  |
| ESLint                           | Passed with zero warnings.                                                                                                                                                                                                                 |
| Vitest / Testing Library         | 100 passed, zero failed, 16 files; final run 24.35 s.                                                                                                                                                                                      |
| Release-tool Node tests          | Five passed, zero failed.                                                                                                                                                                                                                  |
| Development Playwright           | 26 passed, zero failed, 12 opt-in live cases skipped, 1.9 min. A skip is not live evidence.                                                                                                                                                |
| Production Playwright            | 26 passed, zero failed, 12 opt-in live cases skipped, 1.2 min.                                                                                                                                                                             |
| Production build                 | Passed; Vite build 15.93 s; private local configuration and development fixtures excluded.                                                                                                                                                 |
| Formatting / local configuration | Prettier, diff whitespace and local-configuration exclusion passed; private local configuration remains ignored.                                                                                                                           |

Tests include mocked security/ABI/state cases; they do not establish a real signed revocation. Build warnings remain two upstream Zod annotation warnings and a 529.24 kB main JavaScript chunk. No independent security/anonymity audit or complete coverage percentage is claimed.

## Actual external connectivity

All diagnostics used the official unmodified hash-verifying browser harness and PublicNode. The report below came from the application's **Export report** button, not a separate probe manager. The [sanitized evidence](evidence/final-review-connectivity.json) includes actual session ledgers and page request classifications.

| Real check                                    | Actual outcome                                                                                                                                                                                          | Ledger                                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Primary Nym Sepolia diagnostic                | Failed at 120.2 s: `Anonymous worker initialization timed out. No direct fallback was used.` Never ready; chain, block and zero-address balance not returned.                                           | Two successful direct bootstrap calls; zero application reads; zero wallet calls; anonymous share unavailable.                      |
| Explicit Nox Sepolia diagnostic               | Failed at 21.7 s: `Failed to fetch. No direct fallback was used.` Never ready; chain, block and zero-address balance not returned.                                                                      | Two failed bootstrap attempts, including the bounded retry; zero application reads; zero wallet calls; anonymous share unavailable. |
| Separate configured Sepolia pair scan via Nox | Failed after 82.6 s. Worker became ready, but its first `eth_chainId` failed after 45,017 ms. UI showed a local-demo read failure; latest-read status was failed. No current allowance amount verified. | Two successful bootstrap calls; one failed Nox read; zero anonymous successes; zero wallet calls; share **0.0%**.                   |

During the configured scan, page requests were: Sepolia PublicNode 2, raw.githubusercontent.com 1, local origin 2, Blob resources 3. Both page-direct JSON-RPC calls were fixed specifier bootstrap calls; no direct target request was observed. Worker-internal connections are not fully observable through a page listener. Nym's fresh session additionally loaded jsDelivr infrastructure. These are measured session counts, not an anonymity guarantee.

An additional officially documented provider was investigated but returned `Invalid JSON-RPC response envelope` during bootstrap. It was removed from application configuration rather than presented as a working recovery route. No provider switch is automatic and no passthrough worker was used.

## Prize and demonstration boundary

The [official EF Best Use of Anon-RPC criteria](https://ethglobal.com/events/mumbai/prizes#ethereum-foundation) require default Anon-RPC reads and judge demo functionality, UX, traffic share, shipping potential and technical depth. The implementation routes application-controlled blockchain reads through the selected worker by default; fixed public bootstrap and wallet-provider exclusions are explicit. Source inspection found the manager's restricted bootstrap fetch and worker fetch, with no new application network path or tracking client introduced by these fixes.

This review cannot certify a working end-to-end demonstration: live connectivity failed, owner-signed revocation and fresh zero verification remain unperformed, no Vercel origin was tested and no judging video was produced. Historical successful reads remain in the test history but do not override these failures. The owner will deploy; deployed-origin checks and actual recording evidence are still outstanding. No prize qualification, placement or wallet safety guarantee is claimed.

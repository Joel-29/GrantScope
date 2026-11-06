# Slow local demo reads

The configured-pair loader reads Ethereum Sepolia through the selected anonymous worker. MetaMask's selected network does not control these read-only RPC requests. MetaMask ownership/network checks matter separately when preparing a signed revocation. No wallet connection or transaction is required to load the allowance.

## Recover the current session

1. Reload Dashboard once after updating the code so the new loading controls are present. Reload clears in-memory inspection state.
2. Start the configured demo. The panel now displays worker startup, network verification, block selection, token/allowance reads and final snapshot verification, with elapsed time.
3. If Nym is taking too long, choose **Cancel demo read**, then explicitly choose **Try Nox anonymously on Sepolia**. Alternatively select Nox in Privacy Lab, then return to Dashboard and load the pair.
4. A single attempt stops after four minutes. Failure or cancellation never produces a zero allowance or a verified result. Privacy Lab has the worker's sanitized diagnostic and actual traffic counters.

Cancellation stops this loader promptly without closing a worker shared by other reads. An already-started worker may continue its own startup; use **Close worker** in Privacy Lab to close that worker. Switching to Nox closes the old manager and starts an explicitly selected anonymous session. No worker/provider switch or conventional RPC fallback is automatic.

## Corrected behavior

Previously the loader showed only a generic reading message, offered no cancel control, and had no total deadline across multiple RPC calls. The scan could also continue waiting for shared initialization after its caller cancelled. The loader now has a cancellable four-minute deadline, actual engine-stage notifications, elapsed time, explicit recovery controls and stale-attempt guards. A late result cannot populate the cache after cancellation or navigation.

The deadline is a UI limit, not a promise that anonymous networking will succeed. Initialization and individual RPC requests retain their own limits. The external SDK/network may still fail; the app does not manufacture results or weaken privacy to make loading succeed.

## Executed evidence — 6 November 2026

The real read-only rehearsal on local port 5174 passed through explicitly selected official Nox after this fix. Diagnostic startup/reads took **107.3 seconds**, then the warmed configured-pair scan took **41 seconds**. Actual allowance was **100 GST** in 18-decimal raw units. Native account state, token/spender/read block, unsigned approve-to-zero calldata, opaque permission links and the disconnected-owner guard passed. No wallet call or transaction was requested.

The actual exported ledger recorded **19 successful anonymous reads**, **three fixed bootstrap attempts** (two successful, one failed and retried), and **zero wallet calls**. The 100.0% share is of completed application reads; bootstrap and worker-internal infrastructure are not part of that denominator. [Sanitized real-session evidence](evidence/demo-loading-recheck.json).

Fresh TypeScript and ESLint checks passed. Vitest passed **116 tests across 21 files**; nine release-tool tests passed; production build and fixture/local-configuration exclusion passed. Development and production browser suites each passed **28 cases**, with twelve opt-in live skips per run. Prettier, diff whitespace and local-configuration guards passed. Unit regressions include stalled operations that ignore abort, cancellation during shared initialization, the four-minute deadline, explicit-only transport retry, navigation cleanup and ignored late results. Existing build warnings remain two upstream Zod annotations and a 529.48 kB main chunk.

Revocation remains paused at the owner's request. This read-only correction does not authorize MetaMask, submit a transaction, verify post-signing zero state or deploy a site.

# Demo read recovery — 7 November 2026

The owner's Nox read failed with the previous generic message. That message does not establish whether the historical failure was a tunnel/provider failure, unreadable token response, changed block or changed inspection. Do not describe that failed attempt as a verified allowance or zero state. Separate fresh sessions succeeded; they do not erase the failure or guarantee future network availability.

## Corrected application behavior

- Navigating from Dashboard to Settings and back used to lose the local demo result/link, even though the verified scan remained cached. A regression test reproduced that failure before the fix. The panel now observes the existing session cache without an automatic fetch, restores the permission link, and labels the result with its verified block/time and snapshot limits.
- Cache reuse requires the same configured pair, inspected owner/chain, inspection revision and worker session. A worker restart, transport change or cleared/changed inspection cannot restore a previous session's result. A failed new attempt never presents a cached snapshot as that attempt's success.
- **Restart Nox and retry anonymously** explicitly closes the selected worker, creates a new worker of the same transport and retries the read. The control is available while idle as well as after failure. Nym remains the default; selecting Nox is deliberate. No conventional RPC or passthrough fallback exists. Restart and transport-retry controls are disabled during a transaction workflow.
- Failures show the actual last scan stage and captured transport/worker state, without echoing arbitrary provider messages. Context changes are distinguished from unreadable results. An individual operation timeout is distinguished from the actual four-minute overall deadline.
- The permission-review link is now a prominent styled link. Preparing revocation still requires fresh owner/network/contract/simulation/fee checks and actual MetaMask confirmation before submission.

## Local recovery steps

1. Use the same existing tab at `http://127.0.0.1:5174/dashboard`. Refresh once if the updated controls are missing; refreshing clears in-memory results and the application's wallet connection.
2. Nym is primary. After a failed Nym attempt, explicitly select Nox in Privacy Lab for Sepolia, then return to Dashboard. Selecting the transport does not itself submit a transaction.
3. Click **Restart Nox and retry anonymously** once and leave the tab open. If it fails, preserve the stage-specific error and check Privacy Lab's measured ledger. Do not keep restarting indefinitely or substitute direct RPC.
4. After a verified allowance appears, use **Review owner-authorized revocation**. If wallet setup is needed, visit Settings, connect the owner, and select Ethereum Sepolia (11155111); returning to Dashboard retains the same-session snapshot and link. Fresh preflight checks remain mandatory.

## Actual read-only evidence

The updated real-browser rehearsal used explicit official Nox on port 5174. It returned **100 GST**, raw allowance `100000000000000000000`, at block **12078377**. The diagnostic took **40.6 seconds**, then the warmed pair scan took **27.2 seconds**. All 15 rehearsal steps passed, including Settings-to-Dashboard restoration without another token `eth_call`, actual account state, unsigned zeroing calldata, opaque permission URLs and the disconnected signing guard.

The exported ledger recorded **19 successful anonymous application reads**, **two successful fixed bootstrap calls**, **zero wallet calls** and **zero submissions**. The 100.0% share covers completed application reads, not all network traffic or unobserved SDK/extension internals. Direct page RPC consisted only of the two fixed worker-specifier bootstrap calls. [Sanitized real-session report](evidence/demo-recovery-recheck.json).

This rehearsal did not connect MetaMask, sign, submit or verify a post-transaction zero allowance. The owner has resumed the request to complete that verification, but actual confirmation and receipt/zero-state proof remain pending. Vercel deployment and a public recording remain owner-run steps; existing local identities must stay private.

## Executed code checks

TypeScript, ESLint, the production build and private-configuration/fixture exclusion passed. The final default `npm test` run passed **142 tests across 23 files** in 109.49 seconds. Nine Node release-tool tests passed. Development and production browser suites each passed **28 checks**, with twelve opt-in live cases skipped per run (2.2 and 1.3 minutes respectively); skipped cases are separate from the actual Nox rehearsal above. Prettier and diff whitespace checks passed.

Two preceding four-worker unit runs each had one dashboard navigation timeout (141 passed, one failed). The isolated shell file passed all nine checks, and a complete single-worker run passed all 142. A separate Vitest configuration now serializes test files; default `npm test` also passed without changing assertions or DOM-query deadlines. The production build retains two upstream Zod annotation warnings and the 529.48 kB main chunk.

If the app reports no injected wallet despite the MetaMask icon being present, check that the extension has access to this local site in the same browser profile, then retry connecting. This is separate from worker RPC connectivity. The owner reported that the wallet connected after checking site access; this is a user report, not an independently signed proof. Confirm Ethereum Sepolia in the app before preparing a transaction; Base Sepolia (84532) is a different network.

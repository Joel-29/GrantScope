# Revocation preparation follow-up — 7 November 2026

The owner reported the generic message “Anonymous verification or wallet request failed” after clicking Prepare. The historical message does not identify the failed check, so its exact cause remains unproven. A fresh independent unsigned Nox diagnostic subsequently passed all tested blockchain checks. Neither result proves a signed revocation.

## Corrected flow

The verified local demo result now includes **Signing wallet** and **Prepare revocation** together. Verified permission detail pages also include wallet setup beside the revocation action. Loading a result alone never requests wallet access or signing. The owner must connect explicitly, match the inspected owner and Ethereum Sepolia (11155111), prepare, review the preview and confirm in MetaMask. Base Sepolia (84532) is a different network.

Preparation displays fourteen stages covering wallet metadata, worker/network readiness, pinned block, owner/target code, current allowance, simulation, gas, fees, funds, nonce, wallet recheck and canonical snapshot. Errors identify the last stage and retain safe categories or numeric RPC/HTTP codes; arbitrary provider messages and request payloads are omitted. Wallet metadata is explicitly outside anonymous-read accounting. No conventional RPC fallback, automatic retry or automatic submission was added.

Cancellation settles stalled wallet metadata and shared worker initialization promptly, prevents late follow-up reads, and does not close a shared worker. Per-request and initialization limits remain in force. Preparation retains the original owner, chain, bytecode, ABI, amount, simulation, gas, balance, nonce and reorg checks. Final submission still repeats fresh checks, requires unchanged reviewed conditions and explicit wallet authorization. Receipt inclusion and verified zero remain separate states.

The demo's load/restart controls are disabled during an active transaction workflow. Navigating away cannot commit a late preparation result. Local editor `debug.log` output is ignored and was not published.

## Actual unsigned evidence

The independent read-only diagnostic returned the configured positive allowance at block **12078620**, checked EOA bytecode, canonical true approve-to-zero simulation, bounded gas, positive gas price, sufficient Sepolia ETH, supported pending nonce and canonical block identity through Nox. Its ledger recorded **18 successful anonymous reads** and **two bootstrap calls**. It did not test actual wallet ownership, connect a wallet, sign, submit or verify a receipt. [Sanitized unsigned result](evidence/revocation-preflight-recheck.json).

The updated real UI rehearsal passed all fifteen existing checks, including actual allowance/account state, unsigned calldata, cached navigation, opaque permission links and the disconnected signing guard. It recorded **19 successful anonymous reads**, **two bootstrap calls**, **zero wallet calls** and **zero submissions**. Cold diagnostic startup/reads took **132.4 seconds** and the warmed pair scan took **19 seconds**. This latency can exceed a timed demo budget; prior success does not guarantee availability. [Sanitized UI result](evidence/revocation-ui-recheck.json).

These read-only results leave actual owner-confirmed submission, receipt verification and fresh zero allowance **NOT RUN**. A real mined hash must be supplied privately before the separate verifier can establish those results. Never publish the existing demo identities or transaction hash.

## Executed checks

The full `npm run check` command passed: strict TypeScript, ESLint, formatting, **149 unit/UI tests across 24 files** (107.60 seconds), **nine Node release-tool tests**, production build, and local-configuration/fixture exclusion. The new cases cover failed anonymous gas estimation, refused wallet metadata, cancellation during wallet/worker waits, sanitized malformed errors, visible stages and disabled inline signing without an owner. The build retains two upstream Zod annotation warnings and a 529.49 kB main JavaScript chunk.

Development and production browser suites each passed **28 cases**, with **twelve opt-in live cases skipped per run** (2.0 and 1.3 minutes respectively). Live evidence is the separately executed real diagnostics above. The first sandboxed aggregate command failed before checks began because npm's nested executable lookup was denied; the permitted rerun completed successfully.

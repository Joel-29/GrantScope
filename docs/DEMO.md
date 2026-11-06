# Three-minute judging runbook

This is a reproducible script to execute, not a claim that a signed demonstration or video already exists. The configured local allowance is intentionally preserved. Never submit a transaction merely to make a recording look complete.

## Preparation, before the recording clock

1. Use a dedicated funded Sepolia wallet and standard ERC-20 token with a legitimate positive allowance to a controlled spender. Confirm the deployment/chain and record actual transaction evidence privately. Keep keys in MetaMask. Do not capture the private local configuration identities; use a separately consented public demonstration identity for any recording or published screenshot.
2. Install and run the app. Configure only public owner/token/spender values in ignored `.env.local` for the development-only loader, or enter arbitrary owner and manual pair through ordinary production forms. The committed example contains no identities.
3. Initialize Nym explicitly. If it fails, show the failure and explicitly select the tested Nox Sepolia alternative. Do not silently switch routes, choose passthrough, or improvise a Tor gateway. Nox uses documented bounded tunnel settings with TLS required. Keep the worker warm before the timed demonstration.
4. Load the real allowance and account state, inspect the block/time and coverage, connect the actual owner in Settings, and select Sepolia in MetaMask. A prior successful real read may be shown with its actual timestamp; do not call it a new read or substitute fixtures.
5. Rehearse the flow without signing to confirm address, target, calldata and gas. Keep the positive grant intact until the owner's intentional live confirmation. Never hardcode an expected amount in the interface.

## Timed script

| Time      | Onscreen action                                                                                                  | What to explain                                                                                                                               |
| --------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:25 | Privacy Lab: run a real anonymous diagnostic on the warm selected worker                                         | Show current block/balance responses, actual route and separately counted bootstrap calls. Readiness alone is not response proof.             |
| 0:25–0:50 | Dashboard: show the actual positive allowance, owner/network, token/spender and read block/time                  | Inspection needed no wallet. This is one checked permission, not exhaustive discovery.                                                        |
| 0:50–1:15 | Permission detail: explain the bound and, if relevant, Permit2 dependency                                        | Unknown is not malicious; maximum authority is not certain theft. Overlapping layers are not added.                                           |
| 1:15–1:40 | Prepare revocation, inspect owner/network/target/action/gas, then intentionally choose Confirm in wallet         | Fresh anonymous preflight must pass. Only the owner authorizes MetaMask submission. Rejecting stops the workflow.                             |
| 1:40–2:25 | Confirm in MetaMask, show the returned real hash and wait for receipt/two confirmations                          | Wallet submission is outside anonymous-read guarantees. Pending/confirmed is not yet verified zero. Do not shorten or fake confirmation time. |
| 2:25–2:45 | Show fresh zero-state verification and its actual block; refresh inventory                                       | The zero result must come through Anon-RPC and match the canonical transaction. Later grants can restore authority.                           |
| 2:45–3:00 | Privacy Lab: show read attempts/successes, routes, failures, bootstrap exceptions and wallet submissions; export | Explain the denominator and unobserved SDK/extension traffic. The report contains no targets or payloads.                                     |

Public-chain and mixnet delays can exceed this budget. Prewarm and rehearse on the real connection. If the network is too slow, stop and retry the recording later; do not claim a pending or failed operation succeeded. The script targets three minutes, not a guaranteed external confirmation SLA.

## Optional Permit2 demonstration

The canonical Sepolia deployment has returned real stored-grant/dependency reads. A positive Permit2 grant and owner-signed lockdown have not been demonstrated. Only add this flow when an actual grant exists and time permits. Explain that lockdown clears stored amount, not all unused signed permits, SignatureTransfer permissions or underlying approval. Do not double-count it with the ERC-20 approval.

## Evidence and recovery

- Copy a transaction hash only from the wallet/application response and match it to the receipt and fresh state. No hash is supplied here because this session did not submit a transaction.
- On rejection, revert, different replacement, timeout, reorg, nonzero state or worker failure, show the real status and stop any revoked claim. An unknown transaction may still be pending/mined; check the wallet before another attempt.
- Retry deliberately through the selected anonymous worker or explicitly choose another verified anonymous route. Tor requires an authenticated reachable KPS gateway; its failed demo gateway is not a recovery plan.
- Use **Export report** for sanitized accounting. Do not publish traces/screenshots containing local demo identities. The configured browser test disables screenshot, trace and video capture and never requests signing.

See [executed evidence](TESTING.md), [revocation semantics](REVOCATION.md), [traffic accounting](TRAFFIC.md) and [submission readiness](SUBMISSION_READINESS.md).

## Private verification after owner confirmation

The configured local allowance remains preserved. Perform the revocation only when the owner intentionally approves the exact zeroing action in MetaMask. Inspection, loading a demo, deployment and the verification tool below never authorize a transaction. Keep the existing local identities and transaction hash out of public recordings and commits.

After the owner-confirmed transaction is mined, keep the development server on `http://127.0.0.1:4174`. Supply its actual hash through a local environment variable, not a tracked file. For PowerShell:

```powershell
$env:GRANTSCOPE_REVOCATION_HASH='paste the actual owner-confirmed transaction hash locally'
$env:PLAYWRIGHT_CHANNEL='chrome'
$env:LIVE_TRANSPORT='nox'
npm.cmd run verify:local-revocation
Remove-Item Env:GRANTSCOPE_REVOCATION_HASH
```

Nox is an explicit Sepolia alternative after a failed Nym attempt; omit `LIVE_TRANSPORT` to use primary Nym. The verifier reads the configured owner/token/spender from ignored local environment configuration, uses the application Anon-RPC adapter, reads actual token state, and verifies the supplied transaction/receipt, exact approve-to-zero action, nonce, canonical anchors, two confirmations and fresh zero allowance. Missing hashes and unsupported transports are refused. It never connects a wallet or calls `eth_sendTransaction`.

On success, its private hash-bearing proof is saved only in ignored `.npm-cache/release/verified-revocation.json`. Console output omits that hash and target addresses; no screenshots, tracing or video are recorded. Do not commit or publish the private proof: a transaction hash can reveal all involved identities. No real signed result is claimed until this flow or the application's owner-signing flow actually succeeds. A failed or nonzero result remains unverified.

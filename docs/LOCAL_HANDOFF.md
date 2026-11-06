# Local project handoff

The application and deployment configuration are implemented. A real read-only rehearsal has returned the configured positive allowance, account state, unsigned revocation intent and measured anonymous traffic. This is not a claim that an owner-signed revocation or a published deployment has occurred.

**Latest follow-up — 7 November:** [demo recovery](DEMO_RECOVERY.md) fixes the disappearing local permission link, adds explicit same-transport restarts and stage-specific errors, and records a fresh real Nox read plus successful navigation restoration. Its checks/evidence supersede the older wallet-switch test counts below. Actual owner-confirmed receipt/zero-state verification remains pending.

## What to use locally

Keep your current development server open (the interactive session uses `http://127.0.0.1:5174`), or use `npm run dev` on Vite's default port 5173. Use one origin consistently during a session so the wallet connection and in-memory scan stay together. No production hosting account is needed for these local flows.

1. Open Privacy Lab and run the primary Nym diagnostic. If it fails, explicitly choose Nox for Sepolia. No direct RPC fallback is available.
2. On Dashboard, load the configured Sepolia demo or inspect any address and enter manual token/spender pairs. The existing private demo configuration remains in ignored `.env.local` and is excluded from production.
3. Review the actual allowance, read block, coverage and account state. Opening an unsigned preview never requests a transaction.
4. Settings names the connected wallet network and explains unsupported networks, a different inspection chain, a different owner, or the need to select an inspected owner first. The Sepolia demo requires **Ethereum Sepolia, chain 11155111**; Base Sepolia (84532) is a different network. When needed, click **Switch wallet to Ethereum Sepolia (11155111)** and approve the network change in MetaMask. Without an inspection, the switch targets Sepolia; otherwise it targets the inspection's supported chain. A spender account cannot revoke the owner's allowance. No switch happens automatically and changing networks does not authorize a transaction.
5. Matching owner and network are only prerequisites. Supported revocation still requires verified permission data, fresh contract/account checks, simulation, fee conditions, and deliberate owner confirmation in MetaMask.

**Owner-confirmed revocation has been requested again; completion is not yet verified.** The owner reported that MetaMask now shows Ethereum Sepolia after using the explicit switch. That report is not independent onchain evidence. No transaction was signed or submitted by the assistant. Do not mark allowance zero or a live signed demonstration complete without actual post-transaction evidence.

The switch follows [EIP-3326](https://eips.ethereum.org/EIPS/eip-3326), requests only the selected chain ID and verifies `eth_chainId` afterward. It rejects malformed parameters and RPC URLs, never adds a network automatically, reports rejection/unknown-network errors, and ignores stale results after account, inspection, provider or connection changes. Wallet-network calls remain separate from anonymous-read statistics. Revocation still performs its own fresh owner, network and chain-state checks.

For a repeatable read-only rehearsal, keep the app on port 5173 and run `npm run demo:check -- --local`. Explicit Nox is `npm run demo:check -- --local --transport nox`. On port 4174, add `--url http://127.0.0.1:4174`. See [actual rehearsal evidence and privacy limits](DEMO_CHECK.md). This command closes its own isolated browser; it never connects or signs with the user's actual MetaMask.

## Final local checks

The explicit wallet-network switch update passed strict TypeScript, ESLint, **131 unit/UI tests across 22 files**, nine release-tool tests, and the production build. The development and production desktop/mobile suites each passed **28 checks**, with twelve opt-in live cases skipped in each run. The production run required stopping its own stalled preview-server process after assertions completed; it then exited successfully (3.2 minutes). The final parameter/lifecycle tightening also passed the focused 18 wallet tests and a fresh build. Prettier, diff whitespace and local-configuration exclusion checks passed. Wallet browser cases use an isolated mock provider; they are not evidence of a real wallet authorization or signed transaction. The production build retains two upstream Zod annotation warnings and a 529.48 kB main chunk.

The preceding demo-loading commit's [GitHub CI run](https://github.com/Joel-29/GrantScope/actions/runs/42240825646) succeeded for `a17ac98`; it does not establish CI success for later commits. The working configuration remains ignored. Historical live evidence includes the complete Nox rehearsal with 19 successful anonymous reads and a real production-build diagnostic. During the interactive follow-up, the owner reported the actual dashboard showing 100 GST through Nox at block 12078240. This report is separate from the automated evidence and does not establish a signed revocation or zero allowance.

Vercel work was deferred at the owner's request. The repository contains its configuration and [deployment instructions](DEPLOYMENT.md); an actual hosted-origin result can only be recorded after a deployment exists. A judging video has not been produced. These are owner-run evidence steps, not missing application implementations. Network availability and the [documented limits](LIMITATIONS.md) still apply.

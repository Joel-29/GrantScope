# Local project handoff

The application and deployment configuration are implemented. A real read-only rehearsal has returned the configured positive allowance, account state, unsigned revocation intent and measured anonymous traffic. This is not a claim that an owner-signed revocation or a published deployment has occurred.

## What to use locally

Keep the existing development server open at `http://127.0.0.1:4174`, or use `npm run dev` on Vite's default port 5173. Use one origin consistently during a session so the wallet connection and in-memory scan stay together. No production hosting account is needed for these local flows.

1. Open Privacy Lab and run the primary Nym diagnostic. If it fails, explicitly choose Nox for Sepolia. No direct RPC fallback is available.
2. On Dashboard, load the configured Sepolia demo or inspect any address and enter manual token/spender pairs. The existing private demo configuration remains in ignored `.env.local` and is excluded from production.
3. Review the actual allowance, read block, coverage and account state. Opening an unsigned preview never requests a transaction.
4. Settings now names the connected wallet network and explains unsupported networks, a different inspection chain, a different owner, or the need to select an inspected owner first. The Sepolia demo requires **Ethereum Sepolia, chain 11155111**. A spender account cannot revoke the owner's allowance. Guidance updates from existing wallet metadata; it makes no automatic wallet requests or network switches.
5. Matching owner and network are only prerequisites. Supported revocation still requires verified permission data, fresh contract/account checks, simulation, fee conditions, and deliberate owner confirmation in MetaMask.

**Revocation is currently paused at the owner's request.** No transaction was signed or submitted in this local handoff. The positive grant remains preserved by this session's actions. Do not mark allowance zero or a live signed demonstration complete without actual post-transaction evidence.

For a repeatable read-only rehearsal, keep the app on port 5173 and run `npm run demo:check -- --local`. Explicit Nox is `npm run demo:check -- --local --transport nox`. On port 4174, add `--url http://127.0.0.1:4174`. See [actual rehearsal evidence and privacy limits](DEMO_CHECK.md). This command closes its own isolated browser; it never connects or signs with the user's actual MetaMask.

## Final local checks

The wallet-guidance change passed strict TypeScript, ESLint, **109 unit/UI tests across 19 files**, nine release-tool tests, and the production build. The development and production desktop/mobile suites each passed **28 checks**, with twelve opt-in live cases skipped in each run. Prettier, diff whitespace and local-configuration exclusion checks passed. The new wallet browser case uses an isolated mock provider; it is not evidence of a real wallet authorization or signed transaction. The production build retains two upstream Zod annotation warnings and a 529.47 kB main chunk.

The previously pushed commit's [GitHub CI run](https://github.com/Joel-29/GrantScope/actions/runs/42227161752) succeeded, and GitHub's API confirmed a public MIT repository on main. That result applies to commit `5138649`, not unobserved later CI runs. The working configuration remains ignored. Historical live evidence includes the complete Nox rehearsal with 19 successful anonymous reads, two bootstrap calls and zero wallet calls, plus a real production-build diagnostic. No additional live blockchain read is claimed for this metadata-only UI change.

Vercel work was deferred at the owner's request. The repository contains its configuration and [deployment instructions](DEPLOYMENT.md); an actual hosted-origin result can only be recorded after a deployment exists. A judging video has not been produced. These are owner-run evidence steps, not missing application implementations. Network availability and the [documented limits](LIMITATIONS.md) still apply.

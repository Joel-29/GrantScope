# Read-only demo readiness check

For the latest local wallet-setup guidance and code validation, see [LOCAL_HANDOFF](LOCAL_HANDOFF.md). The real blockchain sessions below remain dated evidence; the wallet-guidance update did not submit a transaction or repeat those reads.

Run the application in one terminal, then the rehearsal in another:

```sh
npm run dev
```

```sh
npm run demo:check -- --local
```

The default is Nym. `--local` uses only the development dashboard's configured demo loader on loopback; it never reads keys or sends the configuration to a hosted origin. Your existing ignored local configuration is sufficient. The command starts a fresh Chrome session, runs the actual UI diagnostic, verifies the actual positive allowance, checks token/spender/read-block display and ETH/account-type inspection, inspects unsigned approve-to-zero calldata, checks the disconnected-owner guard and a fresh-tab detail link, and audits the actual exported ledger and direct page RPC requests. It closes the browser afterward; it does not prewarm a separate recording browser.

Installed Chrome is the default. Set `PLAYWRIGHT_CHANNEL=chromium` to use Playwright's installed Chromium instead. Progress goes to stderr; the final sanitized JSON goes to stdout and a uniquely named ignored evidence file. The displayed percentage covers completed application reads; bootstrap, wallet and unobserved worker-internal traffic have separate limits.

If Nym fails, explicitly choose the official Nox Sepolia alternative:

```sh
npm run demo:check -- --local --transport nox
```

No retry loop, provider switch, conventional RPC or passthrough fallback is used. A failed check exits nonzero and remains failed. The report saves only sanitized counts, status, timing and numeric read evidence under ignored `.npm-cache/demo-rehearsals/`. No screenshots, traces, accessibility snapshots, owner/token/spender addresses, request bodies or transaction hashes are saved by this library-mode runner. Private identities must still never enter public recordings.

For a public deployed origin, omit `--local`:

```sh
npm run verify:deployment -- https://your-deployment.vercel.app
npm run test:hosted -- https://your-deployment.vercel.app
npm run demo:check -- --url https://your-deployment.vercel.app
```

These are placeholders, not claimed deployments. The hosted diagnostic reads Sepolia's zero address. `--local` is refused on hosted origins before browser launch. Arbitrary-address production inspection and manual pairs remain available through ordinary forms.

## Latest executed follow-up, 6 November 2026

- Actual official SDK/manager probes returned chain ID, block and zero-address balance through both Nym and Nox. Nym became ready in 19.8 s, Nox in 15.2 s. Both probes recorded three successful worker reads and two separate direct specifier bootstrap calls. [Sanitized probe evidence](evidence/live-transport-followup.json).
- The actual development dashboard displayed a live **100 GST**, 18-decimal allowance through Nym, then showed the unsigned transaction and a disabled signing action without an owner wallet. Its first browser-test verdict failed because the audit helper compared a browser-normalized trailing slash against an unnormalized endpoint. The classifier is corrected and has adversarial regressions; this was a test defect, not a direct target-RPC fallback.
- The Nox UI rehearsal returned all three diagnostic responses, the actual positive configured allowance, token/spender/read block, native ETH balance, bytecode account type and correct unsigned calldata. Diagnostic time was 112.4 s and pair-scan time 48.9 s in that session. The first runner stopped on a navigation-timing assertion; it now waits for the opaque permission route before checking it. This intermediate runner failure is not reported as a complete pass.
- A later primary Nym rehearsal timed out at 120.5 s with two successful bootstrap calls and zero application reads. The [earlier failed sessions](evidence/final-review-connectivity.json) remain preserved. A successful run does not imply continuous availability.
- **Final complete read-only Nox rehearsal passed.** The actual UI returned the diagnostic in 77.1 s and the configured pair scan in 95.3 s. It verified the positive allowance, token/spender/read block, native ETH and bytecode account type, unsigned zeroing intent, opaque detail URL, disabled signing without an owner and an unavailable fresh-tab deep link. The final export recorded **19 successful anonymous reads, two successful bootstrap calls and zero wallet calls**: 100.0% of completed application reads, not overall traffic. [Sanitized complete rehearsal](evidence/read-only-rehearsal.json). No transaction was submitted.
- **Built-production anonymous diagnostic passed** on local preview port 4173 using explicit Nox in 54.1 s. The actual production UI returned chain ID, block and zero-address balance with three successful worker reads, two bootstrap calls, zero wallet calls and no direct target RPC. This is local production-bundle evidence, not a Vercel-origin result. [Sanitized production diagnostic](evidence/production-anonymous-diagnostic.json).
- Automated checks passed: strict TypeScript, ESLint, **106 unit/UI tests**, **9 Node release-tool tests**, production build, and **26 browser checks each in development and production**, with 12 opt-in live cases skipped in each regular suite. The production build excluded local configuration and development fixtures. Remaining warnings are two upstream Zod annotations and a 529.43 kB main chunk.

The follow-up also removed raw owner/token/spender values from permission URLs. Links now use a random session salt and opaque identifiers; clearing inspection rotates the salt. Reloading or opening a new tab cannot manufacture a verified permission. Internal IDs and record validation are unchanged. The browser test's private pages close before artifact teardown, preventing automatic failure-page snapshots; `test:live` uses a unique output directory to avoid collisions with other test runs.

## Actions that require the owner

This command deliberately reports signing and deployment-header verification separately. It does not connect MetaMask, simulate wallet ownership, sign, submit or revoke. A live signed revocation and fresh canonical zero-state verification still require the owner's deliberate wallet confirmation. The existing grant remains intact. The actual Vercel URL and judging recording also require owner publication; neither exists in this follow-up's evidence.

Before recording, warm the worker in the actual browser being recorded, confirm the current allowance and route, and follow [DEMO](DEMO.md). Use only identities whose publication is explicitly permitted. The existing local identities remain private. Network delays can exceed the three-minute script; never replace a failed/pending result with a fixture or claim an unperformed step passed.

# Anonymous RPC · Module 3

Primary transport: **Nym**, explicitly selected by the user after Tor's official demonstration gateway timed out. The application uses the unmodified official `@anon-rpc/browser-harness@0.4.0` and viem. No ordinary RPC or passthrough fallback is implemented.

## Verified integration surface

The official [wallet guide](https://ethereum.github.io/anon-rpc/wallets/) and installed package source expose `AnonRpcWorker({ address, config, preExisting })`, `ready`, bound `fetch`, `acceptLog`, and `close`. GrantScope preserves the harness's original bundle hash validation and null-origin iframe/worker isolation.

The [official registry](https://ethereum.github.io/anon-rpc/adopters/) publishes Nym specifier `0x3aCD9742C68F6d993066Ae25533e09b9e1f60eD0` on Ethereum mainnet. No Nym-specific config is invented. Tor's specifier is `0x700dA3193D35fA54Cd3fBf29B66f2a2A0385659e`; optional Tor requires an explicitly supplied operational KPS gateway with certificate hash. Syntactic validation does not establish reachability. No alternative gateway address is fabricated. Nox's official Sepolia specifier is `0x35133267A8F7EC35046a83DCA0f4Ca8A6e1b7A9A`; it is an explicit Sepolia alternative after independent live verification, not an automatic fallback.

## Data path

1. A user explicitly starts the diagnostic; merely opening the application does not initialize a worker.
2. The restricted bootstrap provider allows only `eth_call` to the selected official specifier, with the `workerHash()` or `workerResolvers()` selector and no arbitrary account fields. Nym and Tor resolve on mainnet; Nox resolves on Sepolia. This bootstrap chain is separate from the destination chain.
3. The harness resolves and verifies worker bytes itself. Resolver downloads and KPS/WebRTC/mixnet connections are infrastructure traffic, separate from JSON-RPC read accounting.
4. The long-lived worker must report ready before application reads are accepted.
5. The JSON-RPC adapter calls only `worker.fetch()`. It validates HTTP status, JSON-RPC version, correlation ID, result/error structure and quantity format where applicable. viem uses a custom transport with retries disabled; it has no HTTP fallback.
6. Only a successful worker JSON-RPC response is marked anonymized. Read failure, cancellation, bootstrap, and unavailable-worker attempts are never counted as anonymous successes.

`AnonRpcManager` owns initialization deduplication, timeout, cancellation, generation checks, worker closure, and payload-free request metrics. A stale initialization cannot close a replacement worker. Runtime selection explicitly closes the old worker; a session ledger retains bounded records across changes, including late cancellations. Worker shutdown occurs on pagehide and provider cleanup.

Fixed bootstrap requests receive at most one retry after a transient network/timeout/429/5xx failure, with a 300 ms cancellable backoff. Every dispatched attempt has its own ledger entry. Invalid envelopes, invalid hashes and RPC rejection are not retried. The same selected public bootstrap provider is used; no alternative provider or direct application read is attempted. Application reads still have no implicit retry or fallback.

Worker readiness and the latest application-read outcome are separate. A ready worker whose read failed displays **Read failed** rather than connected; earlier successful-response counts remain historical. The diagnostic retains each actual chain/block/balance response independently if a subsequent read fails. After a Nym failure, **Try Nox anonymously on Sepolia** requires a user click. Closing or leaving the diagnostic cancels its application reads.

The [latest review](FINAL_REVIEW.md) failed on both transports and did not reverify an allowance. Earlier successes below must not be used as current connectivity evidence.

## Privacy boundaries

- The bootstrap provider is trusted for specifier identity and sees the caller's IP. Hash verification does not eliminate this trust.
- The destination RPC provider sees query contents, including any requested account. Anonymous routing does not hide public chain state or transactions.
- The worker is trusted to anonymize its own requests and return honest results. UI instrumentation is route evidence, not a cryptographic proof of network anonymity or blockchain truth.
- The official harness grants IndexedDB storage scoped to the specifier. Worker caches may persist across reloads. Application targets, balances, permission records, and request payloads are not stored by the metrics system.
- The adapter forwards `isolationKey` for Tor, whose client documentation describes circuit isolation. Nym-specific isolation guarantees are not claimed; no undocumented Nym option is required.
- Metrics retain at most 1,000 records and exclude RPC params, addresses, payloads, endpoint credentials, worker raw logs, and response data. Selected startup messages are sanitized and kept separately for troubleshooting, not privacy export.
- No worker is called anonymous solely because it initialized. The interface separately reports initializing, connected, failed, unavailable, and whether a response has actually succeeded.

## Live evidence and failure investigation

An independent real browser probe of the official Nym worker returned valid Sepolia `eth_chainId` (`0xaa36a7`), `eth_blockNumber` (`0xb839df`), and zero-address `eth_getBalance` (`0x1c5ba241a44d0e88a4e0`), all HTTP 200, after exactly two bootstrap specifier reads. These are observed responses, not fixtures or an allowance demonstration. Later reads naturally differ.

A same-worker comparison subsequently returned `0xb83a21` through raw Nym `worker.fetch` and twice through GrantScope's actual `AnonRpcManager`, with `actualTransport: nym`, successful outcomes, and two separately counted bootstrap reads. Nym also had real request-timeout failures in fresh sessions; those were recorded as failed, never anonymous successes. No claim of guaranteed availability is made.

The official Nox probe returned Sepolia chain ID `0xaa36a7`, block `0xb83a21`, and zero-address balance `0x1c5ba553f5ed3665d4e0`, all HTTP 200. Nox uses a Sepolia bootstrap provider and is constrained to the verified Sepolia use case in GrantScope.

The production UI integration test subsequently passed for **both Nym and Nox**. Each test validated the Sepolia chain ID, a real block number, and the zero-address balance; observed exactly two browser-direct specifier calls; observed no direct `eth_getBalance`/`eth_blockNumber` query; and captured the actual worker route in the app ledger. Nym's successful run completed in 42.2 seconds, Nox's in 15.0 seconds. These timings describe those runs only, not an availability guarantee. Earlier real Nym timeouts remain part of the evidence rather than being discarded as successes.

Tor's official gateway timed out during KPS dialing for `/bootstrap.zip.zst`. The application did not make a direct substitute query. Both specifier reads succeeded; independently downloaded worker bytes (6,874,306 bytes) hashed to `0x5b62f358ce7a2b94ee9bc3a0e6a08757db68fa08fc348276f31eda788aec818b`, matching the reported pin. Matching bytes does **not** prove a successful Tor circuit. The official Tor demo uses the same unavailable gateway. Tor is retained only as an optional configured route, not retried indefinitely.

## Reproduce

During the later configured-token scan, Nox's default five-second tunnel-open deadline produced `TunnelOpenTimeoutError`; some subsequent calls failed immediately after exits had become unavailable. The official `@hisoka-io/anon-rpc-worker` 0.4.0 package README documents `tlsOpenTimeoutMs`, `attemptTimeoutMs`, `callDeadlineMs` and `tlsSpares`. GrantScope now uses 15-second tunnel open, 30-second attempts, 45-second call deadlines and zero background spare sessions, retaining `tls: required` and the official hash-verified worker. A subsequent real browser scan of an ignored local Sepolia configuration succeeded and displayed a positive ERC-20 allowance without a wallet submission. This is an observed improvement, not an availability guarantee. Nym remains primary; the failed Nym attempt was never relabeled successful. See [published configuration](https://www.npmjs.com/package/@hisoka-io/anon-rpc-worker/v/0.4.0).

Run `npm ci`, `npm run dev`, open `/privacy`, leave Nym selected, and choose **Run live anonymous diagnostic**. It validates the Sepolia chain ID, reads a block number, and reads the public zero-address balance. Inspect the recorded actual route and disclosed bootstrap records.

`npm run test:live` opts into real external browser networking. To use installed Chrome, set `PLAYWRIGHT_CHANNEL=chrome`. To test built output, build first and set `PLAYWRIGHT_PRODUCTION=1`. The live test is skipped in the ordinary deterministic suite; a skip is not a passing integration test. Browser artifacts stay in ignored `test-results/`.

Set `LIVE_TRANSPORT=nox` to explicitly test Nox instead of Nym. Independent investigation scripts `scripts/probe-nym.mjs` (add `--nox` for Nox) and `scripts/probe-adapter.mjs` use a local Vite server on port 4174; they make only fixed public diagnostics through the official workers. They do not turn a failed app read into a direct query.

Provider refusal, mixnet availability, WebRTC policy, gateway failure and browser restrictions can cause real failures. Retry is explicit. Never replace these failures with direct RPC and never present mock unit responses as proof of anonymous routing.

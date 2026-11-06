# Privacy threat model

GrantScope runs blockchain inspection in the browser. Every application-controlled account, allowance, discovery, simulation, gas, nonce, receipt and verification read uses the selected official Anon-RPC worker. Nym is primary; Nox is an explicitly selected Sepolia alternative after failure. Optional Tor requires an operational authenticated KPS gateway. There is no ordinary-RPC or passthrough fallback. Loading the application alone starts no worker.

## What anonymous routing protects

The worker aims to reduce linkage between the user's network identity and destination RPC requests. The RPC provider still sees the queried address, calldata and other request contents. Public transactions, balances and relationships remain public. Timing, traffic volume, browser fingerprinting, a compromised wallet/browser/OS and colluding observers can defeat privacy. GrantScope is not a light client and cannot prove an RPC provider's data is truthful. A successful anonymous response is route evidence, not a universal anonymity guarantee.

## Bootstrap and worker trust

The official `@anon-rpc/browser-harness` resolves a fixed official worker specifier, fetches its bytes, checks the reported code hash and preserves the SDK sandbox. GrantScope does not patch verification, accept arbitrary worker-code URLs, or use passthrough. Initial specifier `eth_call` reads are direct to the bootstrap chain's configured RPC; the adapter restricts their target, selector, parameters and category so they cannot carry a scanned owner.

Hash integrity depends on the specifier/provider response and worker publication chain. It is not an independent audit of worker behavior, an authenticated Ethereum state proof, or a defense against a compromised bootstrap provider substituting both metadata and source. The worker and SDK, their dependencies, RPC services and anonymous-network infrastructure remain trust assumptions. Official specifiers may resolve updated worker code over time; the active reported hash is visible in Privacy Lab and verification must complete before readiness.

Worker code resources and network bootstrap may contact additional infrastructure. Nym gateway discovery and Tor KPS dialing can expose connection metadata. The report counts the application's fixed direct specifier calls, not every internal SDK or transport operation. KPS certificate pinning authenticates the configured peer; syntactically valid gateway input does not establish reachability or reliability. The failed Tor demonstration gateway is not automatically reused. A self-hosted gateway can be configured explicitly.

The SDK grants worker-scoped IndexedDB storage for public-resource caches, which can outlive a page session. Application targets, balances, grants and metrics use in-memory state/query caches only. These are separate storage boundaries. Clearing application state does not claim to erase wallet or worker-internal storage.

## Wallet and onchain exposure

The optional injected wallet reveals locally authorized accounts/network through EIP-1193 and sends explicitly confirmed transactions. Those API requests are counted separately from anonymous reads. The application cannot observe the wallet's internal RPC connections, retries, analytics or broadcast path. Wallet submissions are not anonymous, and the public sender, target, calldata and transaction remain observable. No seed phrase or private key is requested or stored. Code-present accounts are read-only unless a dedicated execution adapter is added.

## Local state and export

An optional development-only `.env.local` can contain public demo identities supplied with the user's explicit consent. This ignored local configuration is distinct from runtime scan persistence and is excluded from production. Clearing inspection data does not delete that file, revoke wallet permissions or erase worker-internal storage. Its values must not enter public screenshots, fixtures or commits.

There is no application backend, analytics, tracking pixel, remote font or third-party address indexer. Theme preferences, bounded address history and query caches remain local in memory. Static hosting still sees asset/page requests, and navigating an external documentation/explorer link contacts its destination. The development workshop contains labeled fictional fixtures; the production build excludes its route and payloads.

Privacy Lab uses actual centrally measured outcomes. Anonymous-read share is successful worker RPC responses divided by all completed application read attempts, including failures/cancellations. Bootstrap and wallet activity have separate counts. The latest 1,000 settled records are retained; full-session counters continue beyond that window. Export explicitly selects safe fields and omits target addresses, parameters, transaction hashes, gateway credentials, raw worker logs and raw errors. It is generated locally, not uploaded. Reload clears application memory; export is the user's local file.

## Failure behavior

Initialization, worker loss, provider refusal and malformed results are visible failures. Failed or cancelled reads do not become anonymous successes, zero allowances, exhaustive discovery or verified revocations. Retry and transport selection are explicit. Worker-ready and real-response proof are separate states. A confirmed transaction is marked verified zero only after the canonical receipt and fresh allowance checks described in [REVOCATION](REVOCATION.md). Two confirmations reduce risk but do not establish finality or prevent later grants.

See [live transport evidence](ANON_RPC.md), [traffic accounting](TRAFFIC.md), and [known limitations](LIMITATIONS.md). This is a code-level privacy model, not an independent anonymity audit.

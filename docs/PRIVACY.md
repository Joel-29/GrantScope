# Privacy

Status: Module 2 interface only; no Anon-RPC integration or anonymity claim.

The current shell makes no application blockchain reads and contains no analytics, third-party fonts, indexers, or wallet connection code. UI state and query cache are in memory. No wallet targets, permission relationships, payloads, or balances are persisted. Hosting providers still observe ordinary page/asset requests. Opening a documentation link contacts its destination.

Theme and sidebar preferences are session-only. The system-theme option reads a browser media preference and subscribes to changes; it does not transmit the value. The development-only design workshop contains labeled fictional records. Those fixtures and the preview route are excluded from production, and a build check guards against accidental inclusion. Privacy Lab has no active ledger or export; its export control stays disabled.

## Planned threat model

Anonymous transport should reduce linkage between a user’s network identity and RPC requests. The destination provider still sees the requested chain data, including addresses. Public transactions and timing correlations remain observable. Anonymous transport does not prove provider integrity or eliminate browser compromise.

## Future trust boundaries

- Use the official browser harness without disabling original worker hash verification or sandbox isolation.
- Resolve configured official specifiers; do not load arbitrary unverified JavaScript.
- Disclose specifier bootstrap chain reads as direct exceptions.
- Report actual route success before showing anonymity. Passthrough is direct traffic.
- Never silently switch to direct RPC. Direct comparison requires explicit opt-in.
- Wallet submissions and extension traffic are outside anonymous-read guarantees; the application cannot observe all internal extension operations.
- Do not send addresses to an indexer or analytics service. Sanitize any future local metrics export so it excludes target addresses, payloads, URLs containing credentials, and permission relationships.

Worker isolation, WebAssembly, CSP, cross-origin requirements, and endpoint compatibility must be independently tested in the transport module. No live worker test has run in Module 1.

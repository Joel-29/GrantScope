# Read-only inspection · Module 4

Inspection accepts a 20-byte Ethereum address, validates mixed-case checksums with viem, and renders the checksummed form. ENS names are rejected locally; no resolver or indexer receives arbitrary input. A wallet connection is optional and separate from inspection.

The inspection service initializes the selected official anonymous worker, validates the endpoint's chain ID anonymously **before** sending account queries, reads a block number, and queries `eth_getBalance` and `eth_getCode` at that explicit block. Failures never invoke a direct provider. Sepolia and Ethereum are configured destinations; every inspection verifies the destination chain. Nox is constrained to its verified Sepolia use case.

Balances are BigInt and formatted with viem's exact decimal formatter. Bytecode is validated as even-length hex. No code yields “EOA · No code at this block”; code-present accounts are read-only, including potential EIP-7702 delegation markers. Code alone does not enumerate account standards, modules, session keys or all delegation schemes. A snapshot is not a guarantee that state cannot change or reorg.

TanStack Query deduplicates account readers and keys cache by chain, address, transport session and explicit inspection revision. Requests propagate cancellation. Address history is bounded to eight deduplicated chain/address targets in memory. “Clear inspection session” removes the target/history, cancels account requests and removes account query records. Reloading resets application history. Anonymous workers may have their own specifier-scoped IndexedDB caches, as disclosed in [PRIVACY](PRIVACY.md).

## Optional wallet connection

The injected EIP-1193 adapter requests `eth_requestAccounts` only after the user selects Connect, then reads the wallet's local chain ID. It validates returned account/chain data, subscribes to account/network/disconnect events and removes subscriptions on local disconnect. It never uses the wallet provider for balances, bytecode, allowance reads or arbitrary scanned-account queries. Wallet extension traffic is outside anonymous transport guarantees.

This release supports injected providers only; WalletConnect and smart-account execution adapters are not included. Connection is not ownership proof for an unrelated inspected account and does not submit transactions. Revocation must independently revalidate account, chain, code, allowance, simulation and final state in its own module.

## Validation

Eight new deterministic cases cover address/checksum rejection, exact ETH arithmetic above JavaScript's safe integer range, same-block reads, wrong-chain prevention, malformed/delegated bytecode, cancellation, bounded session history, wallet rejection, and wallet event handling. UI browser tests reject invalid addresses without any RPC or wallet connection. Real network checks are opt-in and are recorded separately from mocks in [TESTING](TESTING.md).

The real production browser inspection test passed through explicitly selected Nox on Sepolia (30.4 seconds), reading the public zero address's ETH balance and empty code without a connected wallet. The test rejected any direct browser RPC method other than fixed specifier calls. A fresh Nym inspection attempt timed out at initialization and was not reported as successful. The application did not switch routes automatically; the Nox test explicitly selected it through the UI.

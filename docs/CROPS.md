# CROPS

The canonical one-to-two-line C/O/P/S section is in the [README](../README.md#crops). The [official EF criteria](https://ethglobal.com/events/mumbai/prizes#ethereum-foundation) separately assess an end-to-end demonstration, meaningful structural properties and explicit tradeoffs.

| Property              | Implemented evidence                                                                                                          | Dependency or remaining gap                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Censorship resistance | Static, rehostable frontend; explicit anonymous-worker selection; no private application server                               | Bootstrap/RPC availability and anonymous-network operators can still refuse service. No direct fallback conceals failure.                              |
| Open source           | Public GitHub repository, MIT license, lockfile, setup and CI                                                                 | Public visibility/MIT metadata verified through GitHub API; independent reproducibility and hosted-origin validation remain external checks.           |
| Privacy               | Official sandbox/hash verification, real anonymous reads, no analytics/indexers, in-memory state and field-whitelisted export | RPC query contents, bootstrap identity exposure, timing, SDK internals and wallet traffic remain visible within their documented boundaries.           |
| Security              | Typed ABI/BigInt handling, authorization/preflight, canonical receipt and zero-state checks, adversarial tests                | No independent audit, unsupported smart accounts/nonstandard contracts, unseen signatures and provider trust. Owner-signed live revocation is pending. |

These are supported properties and stated tradeoffs, not an assertion that all attacks or censorship paths are eliminated.

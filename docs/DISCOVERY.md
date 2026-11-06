# Approval event discovery (Module 6)

The Permissions page scans a user-selected bounded range with `eth_getLogs` filtered by the indexed owner and the standard Approval signature. Default coverage is the latest 2,000 blocks ending 12 blocks behind the observed head. This lag reduces reorg exposure; it is not a finality guarantee. Maximum requested span is 50,000 blocks, with 128 log requests per run. Re-run a range explicitly to refresh; there is no persisted cursor that can silently skip a reorg.

Pages start at 2,000 blocks. Provider refusals and dense responses reduce the chunk down to one block. A failed single block becomes a disclosed gap. The request cap bounds persistent errors. Responses of 1,000 or more logs are split because successful responses may still be truncated; a dense single block is incomplete. Undetectable provider omissions remain a limitation. Duplicate block-hash/transaction-hash/log-index events are ignored. Removed events are ignored with a warning. Range, quantity, hash, topic and data shapes are checked.

The range-end block hash is captured before and after scanning. Event blocks are checked against canonical headers. A changed range anchor discards all candidates; a noncanonical event is excluded. The UI displays actual requested blocks, request count, gaps, warnings and failed current-state reads. It never equates an empty range with no approvals.

ERC-721 shares `Approval(address,address,uint256)` but indexes the token ID. Only three-topic, 32-byte-data ERC-20-shaped events become candidates. This rejects normal NFT approvals, but cannot establish that an arbitrary emitter implements ERC-20. Nonstandard event layouts are unsupported. Candidate token/spender pairs are therefore verified with the same metadata, bytecode, balance and current allowance calls as Module 5 through Anon-RPC. Events do not establish current spending authority.

Observed approval timestamps come from canonical event block headers. They describe the latest observed event within this scan, not necessarily the permission's creation time. Tokens can alter allowance without emitting standard events; a bounded historical window cannot enumerate every grant. Verification is capped at 500 candidate pairs, with a warning if candidates exceed the cap. Unknown contracts remain unclassified.

RPC semantics: [Ethereum JSON-RPC](https://ethereum.org/developers/docs/apis/json-rpc/) and [execution API eth_getLogs](https://ethereum.github.io/execution-apis/api/methods/eth_getLogs/). No indexer or direct-RPC recovery is used.

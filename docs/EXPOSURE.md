# Deterministic authority analysis (Module 8)

Analysis is a pure function of verified permission records, explicit analysis time and coverage context. It returns explanatory statuses, reasons and per-permission bounds, not a maliciousness score or dollar-loss prediction. A record's captured read time supplies age context in the UI; Permit2 expiration uses the actual read block timestamp. Re-rendering does not change an assessment through the local clock.

- ERC-20 bound: `min(balance, allowance)`.
- Unexpired Permit2 bound: `min(balance, ERC20 allowance to Permit2, stored grant amount)`.
- Zero allowance, expired stored grant, or zero underlying approval: bound zero at that snapshot. Positive dormant authority can cover future deposits; a later underlying approval can reactivate an unexpired Permit2 grant.
- Maximum/near-maximum, authority exceeding current balance, an unclassified spender, or a latest observed Approval event older than 180 days suggests review. These facts do not establish maliciousness or certain theft. Registry membership is not a safety guarantee.
- Age stays unknown without an observed event timestamp. An event timestamp describes that observed Approval, not necessarily the permission's creation. A future timestamp is disclosed as clock uncertainty.

All quantities remain BigInt. Invalid negative or out-of-width inputs are rejected. Bounds are never summed across spenders, tokens, or overlapping Permit2 layers. There is no price API or aggregate expected loss.

The dashboard and Permissions page merge successful current-session records by identity, retaining the later captured read, with block height as a tie-breaker. A later checked lower head can supersede an older higher head after a reorg. Chain, owner, worker session and inspection revision isolate results. Removing source queries removes their assessments immediately. Token groups expose mixed block snapshots and do not combine them. Detail URLs resolve only to actual successful records in this session; direct entry cannot synthesize an allowance. Filters operate on deterministic statuses. Failure counts and bounded coverage remain visible; no empty result is called exhaustive safety.

A timestamped zero verification supersedes earlier permission snapshots, including older Permit2 bounds dependent on that ERC-20 approval. This does not rewrite the stored grant as zero or claim it was cleared. Refresh both layers to assess current authority. Later positive checked reads supersede historical zero evidence even at the same block height; later approvals, permits and reorgs can change authority.

The model cannot prove token/contract semantics, solvency, proxy implementation safety, malicious intent, future signatures, or behavior after the snapshot. All assessments require a fresh preflight before any later revocation transaction.

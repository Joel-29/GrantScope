# Ethereum Foundation prize mapping

Source: [official ETHGlobal Mumbai EF prizes](https://ethglobal.com/events/mumbai/prizes#ethereum-foundation), reviewed 6 November 2026. Target: **Best Use of Anon-RPC**. This mapping is evidence, not a guarantee of qualification or placement.

The app qualification requirement is:

> Your app routes its RPC reads through Anon-RPC by default.

| Published area                               | GrantScope implementation/evidence                                                                                                        | Remaining gap                                                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Default Anon-RPC reads                       | `AnonRpcManager`, strict bootstrap capability, worker-only JSON-RPC/viem adapter; live Nym/Nox responses and sanitized traffic report     | Availability depends on external infrastructure; bootstrap/wallet exclusions are disclosed.                  |
| End-to-end demo                              | Real anonymous account/allowance/Permit2 reads and positive configured-token browser scan; guarded revocation/verification implementation | Owner-signed live revocation, fresh zero-state evidence and completed recording are pending.                 |
| User experience                              | Responsive themes, native forms, Radix dialogs, progress, coverage/failure states and tested desktop/mobile flows                         | Rehearse the actual wallet/network setup; avoid latency surprises in the recording.                          |
| Anonymous traffic and intentional exclusions | Central request instrumentation; distinct read, direct-bootstrap and wallet counts; field-whitelisted export                              | Worker/extension internals cannot be fully observed. Read-share percentage is not overall traffic anonymity. |
| Shipping potential                           | Static build, MIT source, no private app backend, Vercel configuration, reproducible setup                                                | No hosted-origin validation or public deployment URL yet.                                                    |
| Technical depth                              | Typed ABI/BigInt engines, bounded/reorg-aware discovery, Permit2 dependencies, deterministic bounds and guarded post-state verification   | Development audit and tests do not replace an independent security/anonymity review.                         |

The separate CROPS app criteria additionally call for a public licensed runnable repository, a C/O/P/S README section, a demonstration video within three minutes, and no client trackers; personal data/key handling must be local or explained. The page limits a project to placement in one EF prize. These are distinct from the Anon-RPC app qualification above. [README CROPS](../README.md#crops), [privacy model](PRIVACY.md) and [demo runbook](DEMO.md) address them; a completed recording is still missing.

GitHub's unauthenticated API confirmed public visibility, MIT and `main`. The [test record](TESTING.md) preserves actual successes and failures. No mocked test, unsigned calldata, unseen deployment or invented transaction is presented as completed live integration evidence.

## Follow-up evidence

The 6 November review rechecked the official wallet guide and EF page. [Worker-only reads and bootstrap restrictions](../src/features/anon-rpc/AnonRpcManager.ts), [measured counters](../src/features/privacy-report/ledger.ts), [guarded revocation](../src/features/revocation/engine.ts), [no-fallback browser regressions](../e2e/inspection.spec.ts), the [README CROPS section](../README.md#crops), MIT license and runnable setup support the implementation mapping. The [fresh real Nox report](evidence/review-nox-traffic.json) records three successful worker reads and two excluded bootstrap calls. The configured positive ERC-20 allowance also returned real state without signing. Nym's initialization failure remains an external connectivity blocker; prior success is not a guarantee of current availability.

The master specification's live signed revocation/zero-state demonstration remains outstanding. CROPS additionally requires the actual recording, not only a script. Public deployment and hosted-origin verification also remain outstanding for the project's own delivery requirements. Published EF placement and event eligibility are determined by the organizers; these checks cannot guarantee them.

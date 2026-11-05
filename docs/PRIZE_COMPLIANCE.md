# Prize compliance status

**Not submission ready. Module 1 only.**

Source: [Ethereum Foundation — Best Use of Anon-RPC](https://ethglobal.com/events/mumbai/prizes#ethereum-foundation), reviewed during foundation setup. Qualification requires application RPC reads to use Anon-RPC by default. Judging considers a working end-to-end demo, user experience, anonymous traffic share (with intentional exclusions explained), feasibility of shipping after the event, and technical depth. CROPS is also a project principle and a separate EF prize; it is not listed as an Anon-RPC judging criterion. Re-check the official page before submission.

The application's exact qualification requirement is:

> Your app routes its RPC reads through Anon-RPC by default.

| Area              | Code/document reference                            | Evidence and gap                                                                                              |
| ----------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| User experience   | `src/components/layout`, `src/pages`, `src/styles` | Foundation shell only; real workflow pending                                                                  |
| Anonymous traffic | `src/pages/PrivacyPage.tsx`, `docs/PRIVACY.md`     | Honest not-initialized state; harness, worker, traffic instrumentation and live reads missing                 |
| End-to-end demo   | `docs/DEMO.md`                                     | Plan only; allowance reading, signing, revocation and verification missing                                    |
| CROPS             | `LICENSE`, `docs/CROPS.md`                         | Source repository and license exist; public submission access and operational transport remain to be verified |
| Reproducibility   | `package.json`, lockfile, CI, README               | Development/check setup; deployment and independent integration evidence missing                              |

No mock data, test fixtures, planned worker, or explanatory Permit2 content may be submitted as evidence of operational integrations. No success screenshots, chain receipts, or transaction hashes have been fabricated.

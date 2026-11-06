# File map

Generated dependencies, caches, build output, dotenv values and transient test artifacts are excluded from Git.

```text
GrantScope/
├── .github/workflows/ci.yml       Deterministic checks and dev/production browsers
├── .env.example                  Empty public demo configuration template
├── .gitignore / .vercelignore     Local configuration and artifact exclusions
├── AGENTS.md                     Four-commit module and privacy workflow
├── LICENSE                       MIT
├── README.md                     Setup, CROPS, architecture, status and disclosure
├── package.json / package-lock.json
├── vercel.json                   Static Vite build, SPA routes and headers
├── src/
│   ├── app/                      Routing, providers and appearance lifecycle
│   ├── components/               Layout, accessible UI, account cards and previews
│   ├── data/                     Official-source token/spender registries
│   ├── design-system/            Development-only fictional component workshop
│   ├── features/
│   │   ├── anon-rpc/             Worker lifecycle, strict adapter, diagnostics
│   │   ├── wallet/               Address/account inspection, wallet metadata, clearing
│   │   ├── erc20/                Typed state reads, bounded scan and inventory
│   │   ├── discovery/            Chunked owner-filtered logs and canonical coverage
│   │   ├── permit2/              Official ABI state/events and approval dependencies
│   │   ├── exposure/             Pure authority analysis, summaries and details
│   │   ├── revocation/           Preflight, explicit wallet request, receipt/zero proof
│   │   ├── privacy-report/       Counters, bounded ledger and sanitized export
│   │   └── demo/                 Development-only ignored-config real read loader
│   ├── lib/                      Typed ABIs, public configuration and abort utility
│   ├── pages/                    Landing, dashboard, permissions, privacy and settings
│   ├── store/ / hooks/           In-memory UI state
│   ├── styles/                   Responsive tokens and component CSS
│   └── test/                     Testing Library, mocked RPC and audit regressions
├── e2e/                          Deterministic browsers and explicit opt-in live tests
├── scripts/
│   ├── check-production.mjs      Fixture/demo/configured-address exclusion
│   ├── check-local-config.mjs    Tracked/staged/four-commit address guard
│   ├── capture-public-ui.mjs     Empty production captures with no target data
│   ├── run-live.mjs              Explicit public worker diagnostic
│   └── probe-*.mjs               Local real-worker investigation, sanitized output
└── docs/
    ├── ANON_RPC.md / INSPECTION.md / ALLOWANCES.md / DISCOVERY.md
    ├── PERMIT2.md / EXPOSURE.md / REVOCATION.md / TRAFFIC.md
    ├── ARCHITECTURE.md / PRIVACY.md / CROPS.md / AUDIT.md
    ├── LIMITATIONS.md / PRIZE_COMPLIANCE.md / TESTING.md
    ├── DEMO.md / DEPLOYMENT.md / SCREENSHOTS.md / SUBMISSION_READINESS.md
    ├── DESIGN_SYSTEM.md / FILE_TREE.md
    ├── evidence/                 Sanitized real public diagnostic traffic
    └── screenshots/              Actual public UI/worker captures, no local targets
```

The optional `.env.local` is deliberately absent: it is local-only and ignored, and its values must not appear in public source, captures or fixtures.

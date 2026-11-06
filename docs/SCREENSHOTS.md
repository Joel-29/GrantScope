# Real screenshot policy and reproduction

Screenshots must be actual application captures with truthful state labels. Do not create wallet balances, permissions, worker readiness or successful transaction images from fixtures. The development workshop is fictional and cannot serve as integration evidence.

The public captures in this repository use no selected account or the fixed public zero-address diagnostic. Historical Module 2 images document the earlier shell. `privacy-live-nym.png`, `privacy-live-nox.png` and `privacy-lab-module10-nox.png` came from real successful worker sessions described in [TESTING](TESTING.md). They are dated evidence, not guarantees that a worker is available now. Final dashboard captures show the real production empty state, not a live permission claim.

Never capture the ignored local demonstration identities. The configured-pair browser test explicitly disables screenshot, trace and video capture. Use a separate, explicitly consented public demonstration identity for any future recording or populated inventory screenshot; keep original local addresses out of README files, fixtures and Git.

To capture the public empty interface:

```sh
npm run build
npm run preview -- --port 4173
npm run screenshots
```

The capture script uses a fresh browser context and only the production dashboard, with no account input, wallet authorization or worker initialization. It refuses output if local demo controls are present. Set `PLAYWRIGHT_CHANNEL=chrome` to use installed Chrome. It records desktop dark/light and mobile dark views into `docs/screenshots/`; review them before committing.

For new live transport evidence, run the opted-in public diagnostic test using only its fixed zero-address queries. Review its output and sanitized ledger. Never edit a failed/unavailable banner into a successful one. Do not publish traces or request payloads from local target testing.

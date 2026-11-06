# Vercel deployment configuration

The repository contains a deployment configuration, not a published deployment. No production URL or hosted-origin anonymous-worker result has been verified.

1. Import the public GitHub repository into Vercel. Choose the repository root and Vite framework preset.
2. Use `npm ci`, `npm run build`, and output directory `dist`, as defined in `vercel.json`. Use a Node version satisfying `package.json` engines; local checks ran on Node 20.20.1 and CI is configured for Node 22.
3. No RPC credential, database, backend, seed or private key is required. Do not add local demo variables to Vercel. `.vercelignore` and Git ignore rules exclude local environment/test artifacts; the production guard excludes development loaders and locally configured addresses.
4. Deploy to an HTTPS preview first. The SPA rewrite supports direct entry to `/dashboard`, `/permissions`, `/privacy`, `/settings`, `/about` and permission details. An unverified detail URL must still show unavailable state; it cannot synthesize a grant.
5. Check HTTP asset delivery and the configured no-sniff, no-referrer and restricted camera/microphone/geolocation headers. Do not add restrictive CSP, iframe, WebRTC or WASM policies without testing the official harness. Its hash-verified worker needs the original null-origin sandbox and WASM support. No broad new CSP policy has been claimed tested here.
6. On that actual origin, run a real anonymous diagnostic, an arbitrary-address read and a known positive allowance read. Verify worker hash/readiness separately from response proof, inspect the actual route and bootstrap exclusions, and exercise failure without conventional RPC fallback.
7. Rehearse owner signing only when the owner intentionally authorizes it, then verify canonical receipt and fresh zero state. Confirm wallet-provider traffic stays outside the anonymous-read denominator. Test the sanitized export and mobile layout on the deployed origin.
8. Publish the URL only after those checks. Preserve actual results and failures; do not rename a local preview or build success as a deployment.

Reference: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite). Static hosting observes page/asset requests. Browser security policies, mixnet reachability and RPC provider behavior can differ from loopback tests. The app remains buildable/rehostable but fails closed when its selected read route is unavailable.

## Deploy through the Vercel dashboard

Open [Vercel New Project](https://vercel.com/new), import `Joel-29/GrantScope`, and deploy branch `main` from the repository root. Use these settings:

| Setting                           | Value                     |
| --------------------------------- | ------------------------- |
| Framework                         | Vite                      |
| Install command                   | `npm ci`                  |
| Build command                     | `npm run build`           |
| Output directory                  | `dist`                    |
| Node version                      | 22.x                      |
| Optional public environment label | `VITE_APP_ENV=production` |

Leave all `VITE_DEMO_*` variables unset on Vercel. No private key, recovery phrase, RPC secret or database is needed. Keep Web Analytics and Speed Insights unconfigured: this app ships no tracking client. The account's own deployment/hosting logs remain a separate platform boundary.

## Verify the actual hosted origin

Replace the placeholder below with the real HTTPS origin printed by Vercel; it is not a published project URL:

```sh
npm run verify:deployment -- https://your-deployment.vercel.app
npm run test:hosted -- https://your-deployment.vercel.app
```

The HTTP verifier checks eight route entries, configured privacy/security headers, the application shell and its same-origin JavaScript entry. It rejects credential-bearing URLs, inaccessible deployments, redirects, unexpected assets and development-only entry markers. It performs no blockchain requests and does not establish worker anonymity.

The hosted browser runner uses the remote origin instead of starting a local server, checks production behavior, and disables both live networking and the private local-config test. Installed Chrome can be selected with `PLAYWRIGHT_CHANNEL=chrome`; otherwise install the Playwright browser as documented in README. A protected preview may require Vercel authentication; do not publish bypass tokens. Validate the public judging origin after making it accessible through the dashboard.

For a separate real diagnostic, explicitly set `PLAYWRIGHT_BASE_URL` to that HTTPS origin, `PLAYWRIGHT_PRODUCTION=1`, `LIVE_ANON_RPC=1`, and run only `e2e/anon-rpc.live.spec.ts` on desktop Chromium. Nym stays primary. If it fails, explicitly select `LIVE_TRANSPORT=nox` for the tested Sepolia alternative. Never use real local demo identities in hosted automated tests or public captures. A successful loopback test is not a hosted-origin result.

Vercel CLI/agent setup is independent of project deployment. The [official setup guide](https://vercel.com/get-started.md) covers CLI, plugin guidance and the shared OAuth MCP endpoint. Global agent configuration and local CLI authentication are not application files and must not be committed. No project linkage or deployment was created during the release handoff; the repository still requires an actual deployed-origin check.

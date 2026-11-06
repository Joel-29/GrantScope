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

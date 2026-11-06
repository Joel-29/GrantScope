# Limitations

## Current module

Module 2 completes interface components and isolated design previews. Preview records are fictional and development-only; they never represent scanned wallet state. Theme preferences reset on reload. Network selectors, real permission filters, and privacy export are unavailable until real integrations exist.

- The shell cannot inspect or connect wallets, read allowances, discover approvals, calculate exposure, or revoke permissions.
- Official Nym/Nox workers and bootstrap exception tracking are integrated. Nym has demonstrated transient request timeouts; Tor's demo gateway failed KPS dialing. No automatic fallback is provided. A detailed privacy export remains pending.
- Permit2 is explanatory content only, not an integration.
- No test token deployment, real test transactions, production deployment, or hackathon submission has been made.
- The security and privacy properties of later integrations are unverified. This project has not been audited.

## Constraints future modules must retain

- Bounded history and nonstandard tokens prevent universal approval discovery.
- Smart-account modules and delegation schemes are not universally discoverable; bytecode does not fully classify an account.
- Offchain SignatureTransfer signatures cannot be universally listed before use.
- Overlapping permissions are not independent sums of funds at risk.
- Unknown spenders and old approvals are not proof of malicious behavior.
- Endpoint restrictions and transport failures must be visible without automatic direct fallback.
- RPC query contents remain visible to the destination provider; transactions remain public onchain.

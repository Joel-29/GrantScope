# GrantScope working instructions

## Standing user preference

For every completed module, create **exactly four cohesive conventional commits** and push them to `origin` (`https://github.com/Joel-29/GrantScope`) after validation. The user explicitly authorized this recurring workflow. Do not squash a module into one commit. Suggested boundaries: design/core primitives, feature/page implementation, tests, and documentation.

## Module boundaries

Implement only explicitly requested modules. For a single-module request, summarize the delivered work, executed checks, remaining gaps, and four pushed commits, then stop. The user has explicitly requested Modules 3–12 consecutively: validate and push each module in four commits, report its evidence and gaps, then continue to the next requested module. Do not treat a mocked test as live integration evidence.

## Anonymous transport preference

The user superseded Tor-as-primary after the official demonstration gateway timed out: Nym is primary, using official specifier `0x3aCD9742C68F6d993066Ae25533e09b9e1f60eD0`. Tor remains optional and needs an operational authenticated KPS gateway; do not retry the failed demonstration gateway indefinitely or invent addresses. Only investigate official Nox for Sepolia if Nym fails. Never silently fall back to ordinary RPC or passthrough. Only successful real worker responses may be reported as anonymized.

## Verification and privacy

Run TypeScript checks, ESLint, relevant automated tests, and the production build before pushing. Never claim an unexecuted check passed. Keep secrets, local environment files, dependencies, caches, generated build output, and transient test artifacts out of Git.

The master specification requires real blockchain evidence for integrations. Until an integration module is requested, keep blockchain reads, wallet signing, scanner logic, Permit2 execution, and revocation unimplemented. UI fixtures belong only in the development-only design preview and must be labeled fictional. The production build must exclude those fixtures. No silent direct RPC fallback or invented anonymity claims.

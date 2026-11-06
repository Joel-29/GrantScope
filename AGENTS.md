# GrantScope working instructions

## Standing user preference

For every completed module, create **exactly four cohesive conventional commits** and push them to `origin` (`https://github.com/Joel-29/GrantScope`) after validation. The user explicitly authorized this recurring workflow. Do not squash a module into one commit. Suggested boundaries: design/core primitives, feature/page implementation, tests, and documentation.

## Module boundaries

Implement only the module explicitly requested. Summarize the delivered work, executed checks, remaining gaps, and the four pushed commits, then stop. Do not begin the next module automatically.

## Verification and privacy

Run TypeScript checks, ESLint, relevant automated tests, and the production build before pushing. Never claim an unexecuted check passed. Keep secrets, local environment files, dependencies, caches, generated build output, and transient test artifacts out of Git.

The master specification requires real blockchain evidence for integrations. Until an integration module is requested, keep blockchain reads, wallet signing, scanner logic, Permit2 execution, and revocation unimplemented. UI fixtures belong only in the development-only design preview and must be labeled fictional. The production build must exclude those fixtures. No silent direct RPC fallback or invented anonymity claims.

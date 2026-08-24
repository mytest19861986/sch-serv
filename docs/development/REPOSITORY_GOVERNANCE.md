# Repository Governance Baseline

Status: Phase 12 foundation proposal. This document does not change GitHub repository settings and does not authorize application implementation.

## Local conventions

- Branches SHOULD use `type/short-description`, such as `docs/prd-review` or `chore/ci-foundation`.
- Commits SHOULD use a concise conventional prefix such as `docs:`, `chore:`, `test:`, `fix:`, or `feat:`. `feat:` remains unavailable while implementation is locked.
- A pull request SHALL identify its phase, scope, validation performed, and whether it changes a protected or sensitive path.
- CODEOWNERS is a proposal for accountable ownership. It is not a substitute for an enabled GitHub review rule.

## Recommended GitHub governance decision

Before implementation begins, the Commander SHOULD decide whether to enable a `main` branch ruleset requiring pull requests, the Foundation Validation check, at least one approval where a second maintainer exists, no force push, no branch deletion, and restricted bypass authority. A single-maintainer exception, if needed, MUST be explicitly documented by the repository owner.

The Commander SHOULD also decide whether to restrict Actions to approved actions and require full-SHA pinning. The current workflow itself uses a pinned checkout action, but repository-wide GitHub Actions policy is an external setting and is not changed by this foundation artifact.

## Sensitive-path review proposal

Changes under `.github/`, `docs/security/`, `infrastructure/`, `.env.example`, or `SECURITY.md` SHOULD receive an explicit security/governance review before merge. No secret, credential, private key, state file, or production configuration may be committed.

## CI boundary

Foundation Validation verifies repository markers and rejects selected tracked secret-bearing filenames. It is intentionally not a dependency install, build, test suite, deployment workflow, or a substitute for a future secret scanner.

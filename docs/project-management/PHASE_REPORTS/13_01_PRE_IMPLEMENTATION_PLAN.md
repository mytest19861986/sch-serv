# Phase 13.01 Pre-Implementation Plan

## Authorization

Commander authorization: `PHASE_13_IMPLEMENTATION_VERTICAL_SLICE_01`.
Slice: `FOUNDATION_RUNTIME_AND_AUTHENTICATION_BASE`.
Phase 14+ and production deployment remain locked/forbidden.

## Repository inspection evidence

- Branch: `main`.
- Pre-inspection working tree: clean.
- Latest foundation closure: `62cd4be docs: close phase 12 foundation gate`.
- Existing CI is foundation-only validation with read-only permission and a pinned checkout action.
- Declared app/service boundaries contain only non-executable marker files; no runtime manifest or unexpected implementation was found.
- All approved source specifications named by the Commander are present.

## Implementation plan

1. Reconcile the full Commander task with approved Architecture, API, Security, Database, and Technical Specification constraints.
2. Establish only the backend runtime and authentication-base artifacts explicitly permitted by that task.
3. Add focused tests and CI coverage only for the created slice.
4. Run required validation and independent architecture, security, and QA reviews before requesting the Slice Gate.

## Files to create

TBD after receipt of the complete Commander task. No application/runtime file has been created during this pre-change step.

## Files to modify

- `docs/project-management/*` control records for Phase 13 status and this plan.
- Additional runtime, test, CI, and documentation files: TBD after task reconciliation.

## Dependency proposal

No dependency is approved or installed in this pre-change report. The approved direction identifies a NestJS/TypeScript backend and PostgreSQL, but exact package choices and versions require the complete Slice 13.01 task and dependency review.

## Test plan

- Validate any new runtime's startup and configuration failure behavior without real credentials.
- Add focused tests for the approved authentication, authorization, error-envelope, and correlation behavior only after the Commander supplies the exact permitted behavior.
- Run static/type/lint/test commands introduced by the selected approved toolchain, plus the existing Foundation Validation workflow equivalent.
- Do not claim PostgreSQL, migration, integration, or security-effectiveness coverage until those artifacts and test fixtures are explicitly authorized and executed.

## Security impact

The first protected boundary must fail closed, derive rather than trust tenant/resource scope, avoid credentials and session material in logs/source control, expose privacy-safe errors, and attach a safe correlation identity. The unselected credential/session mechanism is an explicit implementation risk; no token algorithm, secret, account data, or bypass is permitted by this plan.

## Rollback approach

All implementation commits will be isolated on `phase13/foundation-auth` and pushed without merging to `main`. Reverting a coherent implementation commit is the rollback mechanism. No migration, environment secret, production deployment, or irreversible external change is planned in this pre-change step.

## Risks

- The credential/session mechanism is explicitly unresolved in approved specifications; it must not be invented.
- Tenant, revocation, authorization, privacy-safe errors, and audit invariants apply from the first protected endpoint.
- PostgreSQL remains canonical; Redis/cache cannot become an authority source.
- The Commander response shown through the internal-thread tool was truncated after the pre-change report heading. Work remains limited to inspection/control records until remaining constraints are received.

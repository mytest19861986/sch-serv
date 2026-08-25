# Phase 13.06 — Drivers

Status: IN_PROGRESS  
Branch: `phase13/slice-13-06-drivers`  
Authorization: Commander-authorized by `TASK=START_PHASE_13_SLICE_13_06_DRIVERS`

## In scope

- Tenant-scoped `driver_profile` lifecycle (`active`/`archived`).
- Explicit linkage to an active tenant member whose active role is `driver`.
- School Admin/Super Admin management and School Operator tenant-scoped read access.
- Optimistic version updates, current database authority checks, tenant isolation and transactional audit records.
- Integration/security coverage for cross-tenant access, role boundaries, lifecycle visibility and stale writes.

## Out of scope

Vehicle, route, route-stop, transport service, service instance, driver assignment, pickup, drop-off, notifications, offline sync, dashboards, production authentication rollout, deployment, merge to `main`, and later transport-event state.

## Gate evidence required

Clean implementation commit, migration and full CI validation, exact-SHA Gemini/Qwen/Claude review, remediation of real Critical/High findings, and Commander Gate decision. `NO_RESPONSE != PASS`.

## Validation limitation

The current local shell has no `DATABASE_URL`; local migration and database-backed integration evidence remain pending. Static typecheck, lint, build and unit tests are required and recorded separately from database evidence.

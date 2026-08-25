# Phase 13 — Slice 13.08 Routes

Branch: `phase13/slice-13-08-routes`  
Authorization: Commander-authorized after Slice 13.07 Vehicles `CLOSED_ACCEPTED`

## In scope

- Tenant/school-scoped Route aggregate with a bounded human-readable route name.
- `active`/`archived` lifecycle and optimistic version updates.
- School Admin/Super Admin management and School Operator tenant-scoped read access.
- Server-derived school/tenant ownership, current DB-backed authority, lifecycle checks and transactional audit.
- Security-negative integration coverage for cross-tenant/foreign-school access, stale writes, client-owned fields and revoked actors.

## Out of scope

Route stops, ordered student/service associations, service instances, assignments, Driver execution, pickup/drop-off, notifications, offline sync, dashboards, production authentication rollout, deployment and merge to `main`.

The route name is the minimum identity required to represent a reusable planned route in this slice. Ordered stops and operational associations require their own authorized slices; no geospatial semantics are introduced here.

## Evidence rule

Gate requires migration and full CI validation, exact-SHA Gemini/Qwen/Claude review, remediation of real Critical/High findings, and Commander Gate decision. `NO_RESPONSE != PASS`.

# Phase 13.03 — Users Slice

## Document control

- Status: `IN_PROGRESS_AUTHORIZED`
- Baseline: `eb7483a` (`Slice 13.02 CLOSED_ACCEPTED`)
- Branch: `phase13/slice-13-03-users`
- Scope: Users, tenant memberships and role assignments only
- Merge to `main`: locked
- Production authentication/deployment: forbidden
- Slice 13.04+: locked until this Gate closes

## Authoritative sources

- Commander directive `PHASE_13_SLICE_13_03_USERS`.
- `docs/DATABASE.md` sections 9–10, 38, 44–52 and logical table catalog.
- `docs/API.md` sections 10–18 and 53.
- `docs/ARCHITECTURE.md` identity, tenant and authorization boundaries.
- `docs/SECURITY.md` deny-by-default, tenant isolation, safe errors and audit controls.

## Included

- Platform `user` identity record with active/disabled lifecycle.
- Tenant-scoped `tenant_membership` with active/revoked lifecycle.
- `role_assignment` with controlled role/status lifecycle.
- Server-side tenant and role authorization, safe reads, allowlisted DTOs and optimistic versions.
- Transactional accepted mutations with correlation-linked audit records.
- Ordered migration `003_users.sql` only; no future-domain tables.
- Integration/security-negative tests and CI evidence.

## Explicitly excluded

Students, guardians, drivers, vehicles, routes, services, assignments, transport events, offline sync, notifications, dashboards, production authentication lifecycle and deployment.

## Security invariants

- A user ID, tenant ID, role field or membership ID is never authorization proof.
- Actor authority is derived from the authenticated server context; request body privilege fields are rejected.
- School Admin operations are limited to the authenticated tenant and cannot create/assign `super-admin`.
- Super Admin operations remain platform-scoped and do not imply unrestricted child-data browsing.
- Cross-tenant reads/writes and foreign-ID substitutions return privacy-safe not-found outcomes.
- Disabled users are not exposed through scoped reads; membership creation requires an active user and active tenant.

## API surface implemented

`/users`, `/users/{id}`, `/tenant-memberships`, `/tenant-memberships/{id}`, `/role-assignments`, `/role-assignments/{id}` with create/list/read/update operations. Resource fields are allowlisted; server-owned IDs, tenant scope, role authority, lifecycle timestamps and versions cannot be overridden.

## Assumptions recorded

- `email` and `display_name` are the minimum identity fields because the approved database/API documents define lifecycle and identity boundaries but do not prescribe a credential field shape.
- Membership is the User↔Tenant association; no new User↔School table is introduced because the approved model specifies tenant membership and does not define a school-membership relation for Users.
- Controlled roles are `super-admin`, `school-admin`, `school-operator`, `driver`, and `parent`; Student is not an authenticated role.
- Authentication lifecycle remains provisional/test-only and is not claimed production-ready.

## Gate evidence target

`CRITICAL=0`, `OPEN_HIGH=0`, required validation pass, CI pass, specialist review packets complete, and quality score at least 85. Any cross-tenant user-access bypass or privilege escalation blocks the Gate.

# Slice 13.02 — Tenant / School

## Authorization and boundaries

- Status: AUTHORIZED by Commander after Slice 13.01 Gate closure.
- Branch: `phase13/foundation-auth` (implementation remains separate from `main`).
- Scope: Tenant and School administration foundations only.
- Required invariant: `TENANT_ID != AUTHORIZATION_PROOF`; the verified principal and server policy determine scope.
- Forbidden: students, parents/guardians, drivers, vehicles, routes, services, assignments, transport events, notifications, offline sync, dashboards, production authentication lifecycle, deployment infrastructure, and placeholder tables for later slices.

## Approved-source trace

| Concern | Source evidence |
|---|---|
| Tenant is top-level organization | `docs/DATABASE.md` §§7, 45, 102.4 |
| School belongs to exactly one tenant | `docs/DATABASE.md` §8 and identity/tenant ERD |
| Tenant/school lifecycle administration | `docs/API.md` §§13, 15, 16, 52 and §109.1 catalogue |
| Super Admin vs School Admin scope | `docs/USER_ROLES.md` §§5, 7.1, 7.2, 9 |
| Deny-by-default, server-derived scope, safe enumeration | `docs/SECURITY.md` §§22–35, 41 and `docs/API.md` §§14, 65, 82 |

## Minimal schema permitted by the approved design

Only `tenant` and `school` tables are introduced. Each has a UUID primary key, lifecycle state, trusted creation/update timestamps, and optimistic version. `school.tenant_id` is a required foreign key and the `(tenant_id, name)` key is tenant-scoped. No later-domain or speculative fields are added.

The approved documents identify UUID identifiers and lifecycle/version information but do not fix a UUID version, exact display-name constraints, or exact lifecycle URL verbs. These remain explicit implementation assumptions and are recorded in the Phase 13 report; no production policy is claimed.

## API slice

The logical contracts authorize `/tenants`, `/tenants/{tenant_id}`, `/schools`, and `/schools/{school_id}`. This slice implements only documented resource create/read/update operations using `POST`, `GET`, and `PATCH`; lifecycle is an allowlisted `status` field on `PATCH` until a separate endpoint verb is approved.

All protected operations authenticate, derive server scope, authorize action, validate an allowlisted body, execute a transaction, and return the safe API envelope. Client tenant identifiers never establish authority.

## Role mapping assumption

The product documents role names but not claim serialization. This slice maps `super-admin` to platform tenant lifecycle administration and `school-admin` to same-tenant school administration. The mapping is centralized and must be replaced by the approved identity/membership representation before production.

## Dependencies and execution

- PostgreSQL driver is added only because the authorized slice requires canonical persistence and migration execution.
- Migrations are plain SQL and run through a small migration runner; no ORM, Redis, or later-domain dependency is introduced.
- Migration verification must run against PostgreSQL in CI and in any available development environment. `NOT_EXECUTED` is not reported as PASS.

## Stop condition

Stop after implementation evidence, required reviews, synchronized reports, and Slice 13.02 Gate recommendation. Do not merge to `main`, start Slice 13.03, deploy, or promote provisional authentication.

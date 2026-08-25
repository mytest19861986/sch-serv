# Phase 13.07 — Vehicles

Status: IN_PROGRESS  
Branch: `phase13/slice-13-07-vehicles`  
Authorization: Commander-authorized after Slice 13.06 Drivers `CLOSED_ACCEPTED`

## In scope

- Tenant-scoped Vehicle identity (`identifier`) and `active`/`archived` lifecycle.
- School Admin/Super Admin management and School Operator tenant-scoped read access.
- Current DB-backed authority, tenant lifecycle checks, optimistic version updates and transactional audit.
- Security-negative integration coverage for cross-tenant access, role boundaries, stale writes, client-owned fields and revoked actors.

## Out of scope

Driver assignment, Vehicle↔Driver assignment, routes, route stops, services, service instances, notifications, offline sync, dashboards, pickup, drop-off, production authentication rollout, deployment and merge to `main`.

## Evidence rule

Gate requires migration and full CI validation, exact-SHA Gemini/Qwen/Claude review, remediation of real Critical/High findings, and Commander Gate decision. `NO_RESPONSE != PASS`.

The vehicle `identifier` is the minimal implementation of the approved stable vehicle identifier. No unverified make/model/capacity/plate fields are introduced.

# Phase 13.05 — Parents

Status: IN_PROGRESS  
Branch: `phase13/slice-13-05-parents`  
Authorization: Commander-authorized after Slice 13.04 Students Gate

## In scope

- Parent/guardian aggregate persistence and active/archived lifecycle.
- Explicit tenant-scoped guardian records tied to an active user with the parent role.
- Explicit student–guardian relationship creation.
- Relationship-bound Parent read surface: `/me/children`.
- Tenant/school/student/guardian lifecycle checks, current DB-backed authority, transactional audit, and security-negative validation.

## Out of scope

Driver, Vehicle, Route, Service, Assignment, Pickup, Drop-off, Notifications, Offline Sync, Dashboards, production authentication rollout, deployment, and merge to `main`.

## Gate evidence required

Clean implementation commit, frozen CI validation, exact-SHA Gemini/Qwen/Claude review, remediation of real Critical/High findings, and Commander Gate decision. `NO_RESPONSE != PASS`.

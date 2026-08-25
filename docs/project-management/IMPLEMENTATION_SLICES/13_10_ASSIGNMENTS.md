# Phase 13 Slice 13.10 — Assignments

Status: IN_PROGRESS on `phase13/slice-13-10-assignments`.

Scope is limited to tenant/school-scoped driver, vehicle and student service-instance assignments: lifecycle, current DB-backed authority, transactional audit, OCC and security-negative coverage. Pickup/drop-off, transport execution, offline sync, notifications, dashboards, production authentication rollout, deployment and merge-to-main are out of scope.

The migration includes a minimal `service_instance` reference context because the approved database/API contract scopes assignments to dated service executions. No service-instance execution API is introduced in this slice.

Controls: resource IDs, service IDs, student IDs, driver IDs, vehicle IDs, tenant IDs and JWT claims are not authorization proofs; current database authority is re-evaluated at mutation time; active assignment overlap is rejected by database uniqueness; non-UUID production principals are denied.

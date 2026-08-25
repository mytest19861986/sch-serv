# Phase 13 — Slice 13.11 Specification Packet

## Document Control

- **Slice:** 13.11
- **Title:** Driver Service Execution
- **Status:** `SPECIFICATION_APPROVED_WITH_COMMANDER_AMENDMENTS`
- **Primary source:** Epic 11 / `US-EXEC-001`
- **Baseline:** `bb20ba811bbd813834e4288ab159c9acc5e480bd`
- **Proposed branch:** `phase13/slice-13-11-driver-service-execution`
- **Implementation status:** Implementation is authorized after this documentation-only commit; merge, deployment and Production Authentication remain prohibited.
- **Scope authority:** The title and boundaries are a Commander decision made after the repository audit. They were not previously present as a Slice 13.11 entry in the roadmap.

## 1. Objective and Traceability

The slice specifies the Driver-facing behavior explicitly stated by `US-EXEC-001 — Start assigned service`: starting an active assigned service and showing its assigned student list and service state. No behavior is imported from the later Pickup, Drop-off, Offline or Degraded stories. The generic Driver execution flow is used only to corroborate the sign-in, assigned-service and revocation constraints that are also compatible with this story.

The source flow states: Driver signs in, opens an active assigned service, views the minimum-necessary student list, then proceeds to an operational action or exception path. It also requires that revocation during execution deny further protected actions while preserving auditability.

Related documents are used only for constraints and threat coverage: `USER_FLOWS.md` sections 18, 28–30 and 34; `API.md` sections 22, 29–32 and 109.2–109.6; `ARCHITECTURE.md`, `DATABASE.md` and `SECURITY.md`.

## 2. Scope Boundary

### In scope

- Driver access to an active service instance that is assigned to that Driver.
- Tenant and school authorization for the assigned service context.
- Current lifecycle validation for the Driver, assignment, service instance, tenant and school at protected-action time.
- Minimum-necessary assigned-student roster visibility, subject to the source privacy and assignment constraints.
- Denial of protected actions after revocation, expiry, inactivity or authority change.
- IDOR/BOLA-safe resource handling, including no cross-tenant or foreign-school existence disclosure.
- Mutation-time authority checks, OCC and atomic audit evidence are mandatory for Start Service.
- Explicit, user-visible denial/conflict/exception behavior.

### Out of scope

- Pickup, Drop-off and student transport events.
- Offline capture/sync and notification delivery.
- Creation or modification of Driver, vehicle, route, service or assignment records.
- Scheduler, dashboards, analytics and reporting.
- Parent, Student, Super Admin and support workflows.
- GPS/continuous tracking.
- Production Authentication, deployment and merge to `main`.

The out-of-scope list is an explicit Commander boundary even where the broader product documents describe those capabilities.

## 3. Actors and Permission Matrix

| Actor | Open assigned service | View assigned roster | Execute protected in-scope action | Cross-tenant/foreign-school resource |
|---|---:|---:|---:|---:|
| Assigned active Driver | SHALL, only for current assignment | SHALL, minimum necessary data | SHALL only after live authority checks | SHALL be denied without existence disclosure |
| Unassigned Driver | SHALL NOT | SHALL NOT | SHALL NOT | SHALL be denied safely |
| Revoked/disabled/expired Driver | SHALL NOT | SHALL NOT | SHALL NOT | SHALL be denied safely |
| Parent | SHALL NOT | SHALL NOT through Driver surface | SHALL NOT | SHALL be denied safely |
| School Operator/Admin | No Driver action by default; scoped read only if separately authorized | Scoped read only if separately authorized | SHALL NOT impersonate Driver by default | SHALL be denied outside scope |
| Super Admin | No implicit Driver action; bounded support scope only if separately approved | Minimum necessary, explicit scope | SHALL NOT by default | Explicit platform scope required |

`tenant_id`, `school_id`, `service_instance_id` and `student_id` are resource selectors, not authorization proofs. The server must derive and re-check authority from current database state.

## 4. State and Transition Specification

The existing service-instance lifecycle remains unchanged. Slice 13.11 adds the independent execution state `execution_status` with exactly `not_started` and `in_progress`.

Evidence-backed interaction sequence:

`authenticated Driver → active assigned service context → assigned student list and service state shown`

The following are required guards, not newly invented states:

- initial execution state is `not_started`;
- the only accepted transition is `not_started` to `in_progress`;
- active assignment, tenant, school, service instance and actor authority must all be live at mutation time;
- revocation, expiry, inactivity or scope mismatch produces a visible enumeration-safe denial;
- a repeated Start after successful transition is idempotent and creates no second audit record;
- `completed`, `archived` and any other execution status are not introduced by this slice.

**Resolved by Commander:** Start is a mutation; execution state is independent of lifecycle; transition is only `not_started` to `in_progress`. Pickup/Drop-off actions remain excluded.

## 5. Endpoint Contract References

`API.md` documents the Driver read conventions. The approved Slice 13.11 endpoint contract is:

- `POST /driver/services/{serviceInstanceId}/start` — body contains `expectedVersion` according to project convention; actor and authoritative time are server-owned.
- `GET /driver/active-services` — only active, assigned instances for the current Driver.
- `GET /driver/services/{serviceInstanceId}/transport-state` — lifecycle, execution state and version only.
- `GET /driver/services/{serviceInstanceId}/roster` — only after Start and only active student assignments/students in the same tenant and school.

The client cannot authoritatively set actor or start time. Invalid JWT returns `401`; revoked/inactive/cross-tenant/school/missing authority returns enumeration-safe `404`; valid OCC conflict returns `409`; conflicting active assignment returns a generic `409`.

## 6. Data Model and Schema Impact

Existing logical records relevant to the boundary are:

- tenant and school;
- user/membership/role and Driver profile;
- service instance;
- Driver-service assignment;
- student/service assignment;
- audit record.

The existing database principles require tenant-qualified references, lifecycle validation beyond foreign keys, current authority checks at the request boundary, and append-oriented audit evidence. The approved schema delta is one independent `execution_status` column on `service_instance`, defaulting to `not_started`, constrained to `not_started`/`in_progress`, with no reuse of the existing lifecycle `status` column. Existing `version` is used for OCC and is incremented on the accepted transition.

`SCHEMA_IMPACT: ADD execution_status TO service_instance`

## 7. Security and Integrity Invariants

- Current database authority is stronger than stale JWT or client claims.
- Actor, tenant, school, service instance and assignment must be checked in the same protected operation boundary.
- Foreign identifiers must not disclose resource existence or metadata.
- Assignment revocation or lifecycle change must linearize before protected mutation acceptance.
- OCC/version checks must reject stale writes without silently overwriting canonical state.
- Audit evidence must identify actor, tenant, school, target context, outcome, correlation and origin where required by the existing audit contract.
- Minimum necessary child data is exposed to the Driver surface.
- Any client-provided tenant, school, actor, assignment or privileged field is untrusted.

## 8. Acceptance Tests

The following are acceptance scenarios for implementation and security tests:

1. Active assigned Driver opens the permitted service context and sees only the minimum roster and the source-defined service state.
2. Unassigned, foreign-school and cross-tenant identifiers are denied without existence disclosure.
3. Disabled, revoked or expired actor/assignment/service/tenant/school produces a visible denial.
4. Client tenant/school/actor/assignment substitution cannot widen access.
5. Start rechecks authority at mutation time and denies a concurrent revocation.
6. Stale `expectedVersion` produces `409` and no silent overwrite.
7. Repeated Start after `in_progress` returns the current state without a second audit record.
8. Successful transition, actor, tenant, school, target and correlation are atomically auditable.
9. Roster is unavailable before Start and contains no inactive or foreign student assignment.

## 9. Security Review Checklist

- BOLA/IDOR negative tests for every resource identifier.
- Cross-tenant and foreign-school denial parity and enumeration resistance.
- Same-tenant privilege escalation and role downgrade race.
- Revoked actor and stale-session behavior.
- Assignment/service lifecycle race and TOCTOU checks.
- OCC and replay/idempotency tests.
- Audit completeness and tamper-resistance review for Start Service.
- Sensitive child-data minimization and log redaction review.

## 10. Open Decisions

- `OPEN_DECISION-001`: exact response representation/freshness fields not specified by the source documents.
- `OPEN_DECISION-002`: exact retry window and idempotency-key retention are not specified; repeated successful Start remains idempotent.
- `OPEN_DECISION-003`: exact Operator/Admin read permission remains bounded by existing scoped-read policy and is not implemented in this Driver surface.

## 11. Gate Recommendation

`IMPLEMENTATION_AUTHORIZED_AFTER_DOCUMENTATION_COMMIT`

The branch exists at the exact 13.10 baseline. This packet records the Commander-approved decisions. Implementation may begin after the documentation-only commit; unresolved non-blocking representation/retention details must not expand the slice.

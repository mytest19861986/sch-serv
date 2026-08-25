# Phase 13 — Slice 13.12 Specification Packet

## Document Control

- **Slice:** 13.12
- **Title:** Online Student Pickup
- **Status:** `SPECIFICATION_DRAFT_AUTHORIZED`
- **Scope authority:** Commander decision recorded after repository scope audit
- **Baseline SHA:** `669a417edbe62e941e6c12004a3a54fcd9881145`
- **Branch:** `phase13/slice-13-12-student-pickup`
- **Primary sources:** `US-PICKUP-001`, `US-PICKUP-002`, `FLOW-PICKUP-001`, `FLOW-PICKUP-002`, `docs/API.md` §§33–35 and 109
- **Implementation status:** No implementation or migration is authorized by this packet. Adjudication is required before coding.
- **Governance locks:** merge to `main`, deployment and Production Authentication remain locked.

## 1. Scope Authority and Traceability

The Commander-selected scope is **Online Student Pickup**. It is the next bounded capability after Slice 13.11 Driver Service Execution and is derived from the repository's Pickup stories and flows. The packet does not expand the scope to Drop-off, offline synchronization, notifications or dashboards.

Traceability:

| Requirement source | Evidence |
|---|---|
| Valid Pickup | `US-PICKUP-001`, `FLOW-PICKUP-001` |
| Failure/duplicate/unauthorized Pickup | `US-PICKUP-002`, `FLOW-PICKUP-002` |
| Critical write contract | `docs/API.md` §§33, 37, 109.2–109.3 |
| Existing execution boundary | Slice 13.11 specification and `docs/API.md` §30–31 |
| Data integrity principles | `docs/DATABASE.md` §§23–34 |
| Threat and authorization controls | `docs/SECURITY.md` §§26–31 |

## 2. Objective

Allow an authorized Driver to record an online `PICKED_UP` event for an actively assigned student in an actively executing service, with truthful synchronous disposition, current authorization, duplicate protection, audit evidence and a canonical state transition.

## 3. In Scope

- Online Pickup for an active `student_service_assignment`.
- Driver authorization bound to the same active `service_instance` and tenant/school.
- Requirement that service execution is `in_progress`.
- Current tenant, school, user, role, Driver profile and assignment checks at request and mutation time.
- Valid transition to `PICKED_UP` and corresponding current-state update.
- Duplicate/idempotent request handling and stable conflict handling for key/fingerprint mismatch.
- Server-authoritative receipt/commit time and immutable client-event provenance.
- Atomic canonical event, current-state, audit and approved outbox intent where applicable.
- Enumeration-safe denial and minimum child-data disclosure.
- Security-negative and concurrency acceptance evidence.

## 4. Out of Scope

- `FLOW-PICKUP-003` and all offline capture, retry and synchronization behavior.
- Drop-off and any `DROPPED_OFF` transition.
- Notification delivery or Parent messaging.
- GPS/location/telemetry tracking.
- Dashboards, analytics, trip completion and reporting.
- Scheduler, service, route, student or assignment administration changes.
- Production Authentication, deployment and merge to `main`.

## 5. Actors and Permission Boundary

| Actor | Online Pickup | Boundary |
|---|---:|---|
| Active assigned Driver | SHALL | Only assigned active student/service context; execution must be `in_progress` |
| Driver without active assignment | SHALL NOT | Safe denial; no resource or child-data disclosure |
| Parent | SHALL NOT | No Driver-surface mutation |
| School Operator/Admin | SHALL NOT by default | No impersonation of Driver action |
| Super Admin | SHALL NOT by default | Support scope requires a separate approved contract |

`tenant_id`, `school_id`, `service_instance_id`, `student_id`, `assignment_id` and `client_event_id` are selectors or evidence identifiers, never authorization proofs. The server derives actor, tenant, school, assignment and canonical event ownership.

## 6. State and Business Rules

1. The service instance SHALL be active and execution status SHALL be `in_progress`.
2. The Driver account, active membership, Driver role/profile, tenant and school SHALL be active at protected mutation time.
3. The student and student-service assignment SHALL be active and tenant/school consistent with the service instance.
4. Pickup SHALL be accepted only when the authoritative current student/service state permits `PICKED_UP`.
5. A valid first request produces one canonical `PICKED_UP` event and advances the current state once.
6. A replay with the same scoped immutable identity and fingerprint SHALL return a safe replay/accepted-equivalent disposition without a second business effect or duplicate audit record.
7. Reuse of an identity with a different tenant, actor/assignment, operation or fingerprint SHALL return a stable security/conflict outcome and SHALL NOT disclose the prior result.
8. Duplicate or invalid-order attempts SHALL not silently mutate state; the outcome SHALL be visible and audit-correlated where required.
9. Client `occurred_at` is provenance only. Server receipt/commit time is authoritative for canonical ordering and audit.
10. Pickup SHALL NOT create a Drop-off, notification delivery, offline acceptance or trip-completion state.

## 7. Endpoint and Payload Contract

The repository API catalogue defines the logical endpoint:

`POST /driver/services/{serviceInstanceId}/students/{studentId}/pickup`

Required request payload:

```text
client_event_id: required client-generated immutable identity
occurred_at: required client-observed event time/provenance
known_state_version: optional optimistic-concurrency hint
device_context: optional, only where policy permits and data is minimized
```

Required request context:

- `Authorization: Bearer …` under the existing authentication boundary.
- `Idempotency-Key` according to the critical-write contract.
- Correlation identity according to the common API contract.

The client SHALL NOT submit canonical actor, tenant, school, assignment, event type, server time or authoritative state fields.

Successful response semantics SHALL include a disposition (`COMMITTED` or `REPLAYED`), safe event/current-state identity where disclosure is authorized, authoritative version, server time and correlation ID. Exact JSON field casing and media details remain an open representation decision.

## 8. Duplicate and Idempotency Semantics

The authoritative API contract requires scoped identity and immutable fingerprint semantics. Scope SHALL include tenant, operation, authorized actor/assignment and device context where device context is part of the approved contract. The same identity and fingerprint may replay the prior safe result; a changed fingerprint or scope is a stable conflict/security outcome. Authorization SHALL be re-evaluated before replay disclosure, so revocation cannot be bypassed by an old key.

The exact key format, entropy, retention window, canonical fingerprint fields and whether `client_event_id` and `Idempotency-Key` are one identity or two coordinated identities are `OPEN_DECISION` items below.

## 9. Persistence and Migration Impact (Specification Only)

The existing baseline contains service instances, Driver assignments, student assignments, versions and audit foundations. `docs/DATABASE.md` specifies the following logical transport records, but the baseline migrations do not yet provide a Slice 13.12 implementation for them:

- append-oriented `transport_event` containing tenant/school/service/student/actor context, event type, provenance and trusted receipt/commit times;
- `student_transport_current_state` with the last accepted event and state version;
- scoped idempotency identity/record;
- atomic audit intent and, only if approved for this slice, outbox intent.

The product requirement is an atomic canonical transition: event history, current state, required audit evidence and approved outbox intent commit together. No SQL migration is created by this packet. Table names, exact columns, indexes, constraints, retention and whether an outbox row is included in this online-only slice require adjudication.

## 10. Transaction, Lock and OCC Requirements

- Authorization and resource scope SHALL be rechecked at the mutation boundary using current authoritative records.
- The mutation SHALL linearize against concurrent assignment, service, student-state and identity changes; row-lock targets and lock ordering require an implementation design review.
- A supplied known version SHALL be checked; stale state SHALL produce a conflict/reconciliation disposition without silent overwrite.
- Canonical event, current state, audit and approved outbox intent SHALL share one transaction boundary.
- No global lock or cache/read model may serve as authorization.

The exact lock set, isolation level, version source and retry behavior are `OPEN_DECISION` items; this packet does not select an implementation pattern.

## 11. Error and Enumeration Contract

Invalid or expired authentication remains `401`. A valid identity without current Pickup authority, a foreign tenant/school/student/service identifier, revoked/inactive assignment, inactive execution context or undisclosable target SHALL use the existing privacy-safe denial contract and SHALL not disclose child or resource existence.

Known valid business conflicts (for example duplicate identity with a changed fingerprint, invalid state transition or stale known version) map to the documented conflict/reconciliation family (`409` or the explicitly approved disposition). Validation errors remain limited to safe shape/format details. Error bodies SHALL omit tenant, school, assignment, child, lifecycle and internal transaction metadata.

Exact parity grouping between safe denial and known conflicts is an `OPEN_DECISION` requiring API/security adjudication and regression evidence.

## 12. Audit and Observability Requirements

- Accepted Pickup records actor, tenant, school, service instance, student, event identity, outcome, correlation and authoritative times according to the audit contract.
- Replay, rejection, conflict and authorization-denial categories are distinguishable to authorized operations without exposing sensitive data to the Driver.
- Operational logs are not canonical audit evidence and SHALL redact child data and credentials.
- Audit and state effects are atomic for accepted Pickup.

## 13. Acceptance and Security Test Matrix

1. Authorized Driver + active assignment + `in_progress` service records one Pickup and returns committed disposition.
2. Same request replay returns deterministic replay/accepted-equivalent disposition and no second business effect/audit.
3. Same identity with changed fingerprint returns stable conflict and does not disclose the prior result.
4. Invalid/expired JWT returns `401`.
5. Cross-tenant, foreign-school, foreign-student, unassigned, revoked/inactive Driver or assignment, inactive service and pre-`in_progress` service are denied without enumeration.
6. Client tenant/school/actor/assignment/event-type substitution cannot widen authority.
7. Duplicate, invalid-order and stale-known-version requests produce no silent mutation.
8. Concurrent Pickup attempts linearize to one accepted business effect.
9. Revocation or role downgrade at mutation time prevents acceptance/replay disclosure.
10. Accepted event, current state, audit and approved outbox intent are all-or-nothing.
11. Response omits unnecessary child data and internal metadata.
12. No Drop-off, offline, notification, GPS or scheduler behavior is introduced.

## 14. Open Decisions for Adjudication

- `OPEN_DECISION-001`: append-only event plus current-state mutation versus another approved canonical representation; the database document currently favors append-only history plus current state.
- `OPEN_DECISION-002`: exact `client_event_id`/`Idempotency-Key` relationship, fingerprint fields, retention and replay response body.
- `OPEN_DECISION-003`: exact endpoint payload/response casing and disposition vocabulary.
- `OPEN_DECISION-004`: exact row-lock targets, lock ordering, isolation and OCC/version source.
- `OPEN_DECISION-005`: whether online Pickup creates an outbox intent in this slice despite notifications being out of scope; no provider delivery is allowed.
- `OPEN_DECISION-006`: exact safe-denial parity groups and conflict/error mapping.
- `OPEN_DECISION-007`: event/current-state/audit retention and correction policy.
- `OPEN_DECISION-008`: rate, body-size, clock-skew and retry thresholds; no benchmarks are claimed.

## 15. Gate Recommendation

`SPECIFICATION_REQUIRES_ADJUDICATION`

The Commander has authorized specification work and selected the title/scope. Implementation and migration remain prohibited until the open decisions are adjudicated and this packet is accepted as the implementation gate.

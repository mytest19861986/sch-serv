# User Stories and Acceptance Criteria

## 1. Document Control

- Phase: 04 — User Stories
- Status: Draft / Commander Review
- Mode: Product specification only
- Implementation: Forbidden
- Source: approved Discovery, PRD, User Roles and Commander decisions.

## 2. Purpose

Convert approved product requirements and authorization boundaries into traceable, testable user stories. No schema, endpoint, DTO, JWT, UI pixel design, code, migration or dependency is defined.

## 3. Scope

Stories cover access, school operations, Driver App, Parent App, School Dashboard, Super Admin, system behavior, audit and degraded modes. Pilot/MVP/Future classifications prevent future capability leakage into the current scope.

## 4. Story Design Principles

- Every story names actor, surface, authorization, preconditions, acceptance criteria, edge cases, audit and traceability.
- SHALL criteria are mandatory; SHOULD criteria are desired; MAY criteria are optional.
- Negative authorization cases are explicit.
- Unresolved authorization intent defaults to denial and is marked as a policy dependency.

## 5. Traceability Model

Story IDs use `US-<EPIC>-###`. Each Pilot/MVP story references relevant `PRD-*` and, where access-controlled, `AUTHZ-*` or `ROLE-*` requirements.

## 6. Prioritization Model

- P0: safety, authorization, tenant isolation or core event integrity.
- P1: required Pilot/MVP user capability.
- P2: operational improvement that does not block core transport.
- P3: future capability.

## 7. Epic Overview

EPIC-01 Access; EPIC-02 Tenant/School; EPIC-03 Users/Roles; EPIC-04 Students; EPIC-05 Parents; EPIC-06 Drivers; EPIC-07 Vehicles; EPIC-08 Routes; EPIC-09 Services; EPIC-10 Assignments; EPIC-11 Driver Execution; EPIC-12 Pickup; EPIC-13 Drop-off; EPIC-14 Offline; EPIC-15 Notifications; EPIC-16 Parent Experience; EPIC-17 School Dashboard; EPIC-18 Super Admin; EPIC-19 Audit; EPIC-20 Degraded Modes.

## 8. Authentication Stories

### US-AUTH-001 — Sign in
ACTOR: User | SURFACE: Applicable authenticated surface | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

As a user, I want to sign in so that I can access only my authorized product surface.

Acceptance: **Given** valid credentials and an active account, **when** sign-in succeeds, **then** the user reaches the correct role context. Invalid, expired, disabled or unavailable states show truthful non-sensitive errors. AUTHORIZATION: role context is required; TRACEABILITY: PRD FR-AUTH-01, FR-AUTH-03; USER_ROLES AUTHZ-001/002.

### US-AUTH-002 — Deny unauthorized surface
ACTOR: Authenticated user | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given a user without surface authority, when the user attempts access, then access is denied without revealing protected object existence and the failure is auditable where applicable. TRACEABILITY: PRD FR-AUTH-02; AUTHZ-003/004.

## 9. Tenant & School Stories

### US-TENANT-001 — Establish tenant context
ACTOR: School Admin | SURFACE: School Dashboard | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given an authorized School Admin, when the school context is selected, then only that tenant's configuration and data are visible. Cross-tenant attempts are denied and do not enumerate records. TRACEABILITY: PRD FR-TEN-01/02; AUTHZ-003.

### US-TENANT-002 — Configure school operations
ACTOR: School Admin | PRIORITY: P1 | CLASSIFICATION: MVP | STATUS: DEFINED

Given tenant authority, when the admin changes an allowed school configuration, then the result is shown and the privileged change is auditable. School Operator and Driver cannot perform this administrative action. TRACEABILITY: PRD FR-TEN-03, FR-ADMIN-02; ROLE-SADMIN-001/002.

## 10. User & Role Stories

### US-ROLE-001 — Assign role within tenant
ACTOR: School Admin | PRIORITY: P0 | CLASSIFICATION: MVP | STATUS: OPEN_POLICY_DEPENDENCY

Given authorized administrative context, when a role is assigned, then the assignment is tenant-scoped, least-privilege and auditable. Unknown role intent is denied. TRACEABILITY: PRD FR-USER-01; AUTHZ-001/002; ROLE-SADMIN-003.

## 11. Student Stories

### US-STUDENT-001 — Manage student record
ACTOR: School Admin | PRIORITY: P1 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given school authority, when a student is created or updated, then only minimum necessary sensitive data is displayed, the school context is preserved and the change is auditable. TRACEABILITY: PRD FR-STU-01, SEC-02/05; ROLE-STUDENT-001/002.

## 12. Parent/Guardian Stories

### US-PARENT-001 — Link parent to children
ACTOR: School Admin | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: OPEN_POLICY_DEPENDENCY

Given an authorized school workflow, when a parent/guardian relationship is established, then it is explicit, tenant-scoped and auditable. Unverified relationships do not grant access. TRACEABILITY: PRD FR-PAR-01; ROLE-PARENT-001/004.

## 13. Driver Stories

### US-DRIVER-001 — View assigned work
ACTOR: Driver | SURFACE: Driver App | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given an active assignment, when the Driver opens the service, then only assigned route, service and minimum necessary student context is shown. Unassigned or historical unrelated data is denied. TRACEABILITY: PRD FR-DRV-01; ROLE-DRIVER-001/003.

## 14. Vehicle Stories

### US-VEHICLE-001 — Manage vehicle assignment
ACTOR: School Admin | SURFACE: School Dashboard | PRIORITY: P1 | CLASSIFICATION: MVP | STATUS: DEFINED

Given tenant administration authority, when a vehicle is assigned to an allowed service, then the assignment is visible to authorized operators and the change is audited. TRACEABILITY: PRD FR-VEH-01, FR-ASG-01; ROLE-SADMIN-001.

## 15. Route Stories

### US-ROUTE-001 — Define route context
ACTOR: School Admin | PRIORITY: P1 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given tenant authority, when a route is configured, then its ordered service/student context is available only to authorized tenant users and assigned Drivers. TRACEABILITY: PRD FR-ROU-01; AUTHZ-003.

## 16. Service Stories

### US-SERVICE-001 — Open daily service
ACTOR: School Operator | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given operational authority, when a daily service is opened, then its status and authorized assignments are visible and invalid/incomplete context is surfaced before execution. TRACEABILITY: PRD FR-SVC-01; ROLE-SOPS-001/002.

## 17. Assignment Stories

### US-ASSIGN-001 — Assign driver and vehicle
ACTOR: School Admin | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given administrative authority, when a driver/vehicle is assigned to a service, then ambiguity or unauthorized assignment is rejected, the result is auditable and the Driver sees only the active assignment. TRACEABILITY: PRD FR-ASG-01; ROLE-SADMIN-001; ROLE-DRIVER-001.

## 18. Driver Service Execution Stories

### US-EXEC-001 — Start assigned service
ACTOR: Driver | SURFACE: Driver App | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given an active assignment, when the Driver starts service execution, then the assigned student list and service state are shown. An expired, revoked or conflicting assignment produces a visible denial. TRACEABILITY: PRD FR-DRV-01, FR-SVC-01; ROLE-DRIVER-001.

## 19. Pickup Stories

### US-PICKUP-001 — Record valid Pickup
ACTOR: Driver | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given an active assigned service and student, when the Driver records Pickup, then the action is locally acknowledged, marked pending or accepted truthfully, attributed and auditable, and a linked parent notification is requested after acceptance. Duplicate Pickup is idempotent/explicitly reported; invalid transition and unauthorized actor are denied; offline capture preserves intent. TRACEABILITY: PRD FR-PICK-01, FR-EVT-01/02; ROLE-DRIVER-002; AUTHZ-004.

### US-PICKUP-002 — Handle Pickup failure
ACTOR: Driver | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given duplicate, invalid, unauthorized or unavailable conditions, when Pickup is attempted, then no silent state change occurs, the Driver sees a specific safe state, retry guidance is shown where appropriate and the failure is auditable. TRACEABILITY: PRD FR-EVT-01; AUTHZ-007.

## 20. Drop-off Stories

### US-DROPOFF-001 — Record valid Drop-off
ACTOR: Driver | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given a valid prior Pickup and active assignment, when Drop-off is recorded, then it is acknowledged/pending/accepted truthfully, attributed and audited, and a linked parent notification is requested after acceptance. Duplicate, invalid-order, unauthorized, offline and failed-sync cases follow explicit safe states. TRACEABILITY: PRD FR-DROP-01, FR-EVT-01/02; ROLE-DRIVER-002.

## 21. Offline Sync Stories

### US-OFFLINE-001 — Capture action offline
ACTOR: Driver | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given no connectivity and valid assignment context, when the Driver records an event, then the app locally acknowledges it and shows pending sync without claiming server acceptance. TRACEABILITY: PRD FR-OFF-01/02; ROLE-DRIVER-003.

### US-OFFLINE-002 — Retry and recover
ACTOR: Driver | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given pending offline actions, when connectivity returns, then the product retries safely, prevents duplicate business effects, shows success or permanent failure, and preserves event identity for reconciliation. Delayed or failed sync remains visible. TRACEABILITY: PRD FR-OFF-02/03/04; AUTHZ-004.

## 22. Notification Stories

### US-NOTIFY-001 — Notify linked parent
ACTOR: Notification Worker | SURFACE: Parent App | PRIORITY: P1 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given an accepted Pickup/Drop-off for a linked child, when notification processing occurs, then only the linked recipient receives minimum necessary content; unknown or failed delivery is not presented as delivered and retry state is auditable. TRACEABILITY: PRD FR-NOT-01/02/03.

## 23. Parent App Stories

### US-PARENTAPP-001 — View linked child status
ACTOR: Parent | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given an explicit valid relationship, when the Parent opens the app, then only linked children and authorized service status are shown. Unrelated identifiers, cross-family access and cross-tenant attempts are denied without enumeration. TRACEABILITY: PRD FR-PAR-01/02; ROLE-PARENT-001/004; AUTHZ-003/004.

### US-PARENTAPP-002 — View limited history
ACTOR: Parent | PRIORITY: P1 | CLASSIFICATION: MVP | STATUS: OPEN_POLICY_DEPENDENCY

Given linked-child authority, when history is requested, then only policy-permitted history is shown with sensitive data minimized. Retention or unavailable states are explicit. TRACEABILITY: PRD FR-PAR-02; ROLE-PARENT-001.

## 24. School Dashboard Stories

### US-DASH-001 — Monitor daily operations
ACTOR: School Operator | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given tenant operational authority, when the dashboard is opened, then current authorized service/event status and truthful loading, empty, forbidden and error states are shown. Unrelated tenant records are not visible. TRACEABILITY: PRD FR-DASH-01/02; ROLE-SOPS-001/002.

### US-DASH-002 — Review exception
ACTOR: School Operator | PRIORITY: P1 | CLASSIFICATION: MVP | STATUS: DEFINED

Given an offline failure, invalid transition or notification issue, when the operator reviews the exception, then the dashboard shows actionable status without granting unauthorized mutation or cross-family access. TRACEABILITY: PRD FR-DASH-01; AUTHZ-007.

## 25. Super Admin Stories

### US-SUPER-001 — Govern tenant lifecycle
ACTOR: Super Admin | PRIORITY: P1 | CLASSIFICATION: MVP | STATUS: DEFINED

Given explicit platform authority, when tenant/school administration is performed, then the action is bounded, auditable and does not grant implicit unrestricted child-data browsing. TRACEABILITY: PRD FR-ADMIN-01/02; ROLE-SUPER-001/002/003.

## 26. Audit & Oversight Stories

### US-AUDIT-001 — Review privileged activity
ACTOR: Super Admin or authorized School Admin | PRIORITY: P0 | CLASSIFICATION: MVP | STATUS: DEFINED

Given explicit audit authority, when sensitive access, authorization failure, event transition or administrative change is reviewed, then attributable audit information is shown at minimum necessary scope. TRACEABILITY: PRD SEC-05, FR-ADMIN-02; AUTHZ-006.

## 27. Error and Degraded Mode Stories

### US-DEGRADED-001 — Surface truthful degraded state
ACTOR: Any user | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given unavailable service, offline state, pending sync, failed sync, forbidden access or empty data, when the surface renders, then it distinguishes the state, preserves privacy and does not claim an unconfirmed result. TRACEABILITY: PRD FR-AUTH-03, FR-OFF-02/03, NFR-01.

## 28. Negative Authorization Stories

### US-AUTHZ-001 — Reject unrelated-family access
ACTOR: Parent or any user | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given no valid relationship or assignment, when protected student data is requested, then access is denied without enumeration and the attempt is auditable where applicable. TRACEABILITY: PRD SEC-01/03/06; AUTHZ-003/004; ROLE-PARENT-004.

## 29. Cross-Tenant Protection Stories

### US-TENANT-NEG-001 — Reject cross-tenant request
ACTOR: Any authenticated user | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given a resource in another tenant, when the user requests it, then normal product behavior denies access, does not disclose existence and records the failure where required. TRACEABILITY: PRD FR-TEN-02, SEC-01; AUTHZ-003.

## 30. Data Privacy Stories

### US-PRIVACY-001 — Minimize child data
ACTOR: Any surface | PRIORITY: P0 | CLASSIFICATION: PILOT | STATUS: DEFINED

Given a task requiring student context, when data is displayed or notified, then only minimum necessary sensitive information is exposed, relationship/tenant boundaries are enforced and privileged changes are auditable. TRACEABILITY: PRD SEC-02/05/06; ROLE-STUDENT-002.

## 31. Pilot Story Set

Pilot includes AUTH-001/002, TENANT-001, STUDENT-001, PARENT-001, DRIVER-001, ROUTE-001, SERVICE-001, ASSIGN-001, EXEC-001, PICKUP-001/002, DROPOFF-001, OFFLINE-001/002, NOTIFY-001, PARENTAPP-001, DASH-001, DEGRADED-001, AUTHZ-001, TENANT-NEG-001 and PRIVACY-001.

## 32. MVP Story Set

MVP adds TENANT-002, ROLE-001, VEHICLE-001, PARENTAPP-002, DASH-002, SUPER-001 and AUDIT-001 after their policy dependencies are resolved.

## 33. Future Story Set

Student authentication, continuous GPS, advanced analytics, additional notification channels, support impersonation, advanced exception flows and other capabilities remain Future Decision and are not silently promoted.

## 34. Open Policy Dependencies

- BLOCKING: None identified.
- NON_BLOCKING: School Admin/Operator matrix, guardian dispute policy, driver history visibility, retention and support escalation.
- FUTURE_DECISION: student login, cross-tenant support, extra roles, rich GPS and additional channels.

## 35. Assumptions

- Approved PRD and User Roles are the governing product sources.
- ZIP is unavailable and not verified.
- Restrictive behavior applies where authorization intent is unresolved.
- Exact policy thresholds are not invented.

## 36. Risks

Offline event ordering, duplicate effects, cross-family leakage, role ambiguity, notification uncertainty, retention ambiguity and exceptional transport states.

## 37. Acceptance Test Readiness

Every mandatory Pilot/MVP story has an actor, precondition, authorization boundary, Given/When/Then-style outcome, negative or degraded expectation where applicable and traceability reference. Stories avoid implementation assertions.

## 38. Story Coverage Matrix

| Capability | Story IDs |
|---|---|
| Authentication/access | US-AUTH-001, US-AUTH-002 |
| Tenant/school | US-TENANT-001, US-TENANT-002 |
| Users/roles | US-ROLE-001 |
| Students/parents | US-STUDENT-001, US-PARENT-001, US-PARENTAPP-001/002 |
| Driver/vehicle/route/service | US-DRIVER-001, US-VEHICLE-001, US-ROUTE-001, US-SERVICE-001, US-ASSIGN-001 |
| Pickup/Drop-off | US-PICKUP-001/002, US-DROPOFF-001 |
| Offline/recovery | US-OFFLINE-001/002 |
| Notifications | US-NOTIFY-001 |
| Dashboards/admin | US-DASH-001/002, US-SUPER-001 |
| Audit/degraded/privacy | US-AUDIT-001, US-DEGRADED-001, US-AUTHZ-001, US-TENANT-NEG-001, US-PRIVACY-001 |

## 39. Phase Gate Checklist

- [x] All 20 required epics represented.
- [x] Pickup and Drop-off valid, duplicate, invalid, unauthorized, offline and failure expectations represented.
- [x] Offline Driver capture, pending, retry, failure and recovery represented.
- [x] Negative authorization and cross-tenant stories represented.
- [x] Pilot/MVP/Future classification present.
- [x] Traceability and stable IDs present.
- [x] No implementation-level artifact introduced.
- [ ] Commander approval pending.

Recommendation: `PASS_WITH_NON_BLOCKING_OPEN_QUESTIONS`.

## 40. Audit Appendix

- Provenance: direct manager decisions, approved Discovery, PRD, User Roles, Project Control Center and Commander constraints.
- ZIP: `UNAVAILABLE_AND_NOT_VERIFIED`; no requirement is attributed to it.
- Validation target: all required sections, epics, coverage classes, negative cases and traceability checked before Gate report.


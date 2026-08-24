# User Flows and State Transitions

## 1. Document Control
- Phase: 05 — User Flows
- Status: Draft / Commander Review
- Mode: Product flow specification only
- Implementation: Forbidden

## 2. Purpose
Define reviewable product flows and state transitions derived from approved stories, with special attention to Pickup/Drop-off, Offline Sync, authorization and recovery.

## 3. Scope
Authentication, school operations, Driver execution, Parent, Dashboard, Super Admin, notifications, audit and degraded modes. No UI layout, API, schema or implementation is specified.

## 4. Flow Design Principles
Flows are product behavior, authorization is explicit, business state is distinct from sync and notification state, failure is truthful, and restrictive behavior applies when intent is unresolved.

## 5. Flow Notation
`FLOW-ID`, actor, surface, trigger, preconditions, authorization, main flow, alternate/error flows, offline path, state transitions, outcomes, traceability and classification are used consistently.

## 6. Traceability Model
Flow IDs use `FLOW-<DOMAIN>-###` and reference `US-*`, `PRD-*`, `AUTHZ-*` or `ROLE-*` requirements.

## 7. State Model Overview
Business event state, sync state and notification state are independent product concepts and must not be collapsed into one status.

## 8. Authentication Flows

### FLOW-AUTH-001 — Login and context
Driver/Parent/School/Admin user opens the appropriate surface → provides credentials → system validates account and role/tenant context → grants the permitted surface or shows truthful denial. Expired, disabled and unavailable states do not reveal protected data. Traceability: US-AUTH-001/002, PRD FR-AUTH-01/02/03.

### FLOW-AUTH-002 — Session expiry/logout
Active user session expires or user logs out → protected view is cleared → unauthenticated state is shown → re-authentication is required. A revoked role must not retain access through the old session.

## 9. Tenant/School Administration Flows

School Admin enters tenant context → views allowed school settings → changes an authorized setting → receives confirmation or explicit failure → privileged change is audited. Cross-tenant context is denied. Traceability: US-TENANT-001/002, PRD FR-TEN-01/02.

## 10. User and Role Administration Flows

School Admin selects an authorized user → proposes a role/status change → system checks tenant and least-privilege authority → accepts and audits, or denies without mutation. Unresolved role policy defaults to denial. Traceability: US-ROLE-001, AUTHZ-001/002.

## 11. Student Management Flows

School Admin creates/updates a student in the tenant → minimum necessary data is collected → parent/assignment relationships are reviewed → success is shown and audited. Invalid relationship or duplicate identity is surfaced without exposing unrelated data. Traceability: US-STUDENT-001.

## 12. Parent/Guardian Flows

Authorized school user establishes a parent-child relationship → relationship is confirmed/audited → Parent sees only linked children. Disputed/unverified relationships remain denied. Traceability: US-PARENT-001, US-PARENTAPP-001.

## 13. Driver Management Flows

School Admin registers or updates Driver → tenant role is confirmed → Driver becomes eligible for authorized assignment. Suspended/revoked Driver cannot open a service. Traceability: US-DRIVER-001, ROLE-DRIVER-001.

## 14. Vehicle Flows

School Admin records a vehicle → validates tenant and operational eligibility → assigns or rejects it for a service → audit result. Invalid or conflicting assignment is not silently accepted. Traceability: US-VEHICLE-001.

## 15. Route Flows

School Admin defines ordered route context → associates authorized students/services → publishes or rejects incomplete route → assigned Driver receives only current route context. Traceability: US-ROUTE-001.

## 16. Service Flows

School Operator opens a service/day context → confirms route and assignments → service becomes available to assigned Driver → invalid context remains an exception. Traceability: US-SERVICE-001.

## 17. Assignment Flows

School Admin assigns Driver/vehicle/service → system verifies tenant, availability and ambiguity → assignment becomes active or is rejected → Driver view changes only after authorized result. Traceability: US-ASSIGN-001.

## 18. Driver Service Execution Flows

Driver signs in → opens active assigned service → views minimum necessary student list → selects a student → performs Pickup/Drop-off → sees business and sync state separately → continues or resolves exception. Assignment revocation during execution denies further protected actions and preserves auditability. Traceability: US-EXEC-001, ROLE-DRIVER-001/002.

## 19. Pickup Flows

### FLOW-PICKUP-001 — Valid online Pickup
Driver with active assignment selects assigned student → confirms Pickup → product validates valid context and transition → business state becomes `PICKED_UP` → audit is recorded → notification is requested → dashboard may update eventually.

### FLOW-PICKUP-002 — Invalid/duplicate/unauthorized Pickup
Driver attempts duplicate, invalid-order, unassigned or unauthorized Pickup → product denies or reports idempotent duplicate outcome → no silent business mutation → Driver sees actionable state → audit records the attempt where required.

### FLOW-PICKUP-003 — Offline Pickup recovery
Connectivity absent → Driver records valid action locally → state is `LOCAL_PENDING` → connectivity returns → product retries safely → accepts once or reports permanent conflict → sync state becomes `SYNCED` or `FAILED_NEEDS_ATTENTION` → notification follows accepted business result, never speculative local capture.

## 20. Drop-off Flows

### FLOW-DROPOFF-001 — Valid online Drop-off
Driver with valid prior Pickup selects assigned student → confirms Drop-off → product validates context and order → business state becomes `DROPPED_OFF` → audit recorded → notification requested → dashboard update may be eventual.

### FLOW-DROPOFF-002 — Invalid/duplicate/unauthorized Drop-off
Duplicate, missing-Pickup, unassigned, revoked or unauthorized attempt → explicit denial/conflict → no silent mutation → Driver receives safe error → audit expectation preserved.

### FLOW-DROPOFF-003 — Offline Drop-off recovery
Offline valid Drop-off is locally acknowledged as pending → reconnect → retry and duplicate prevention occur → final business state is accepted or exception → notification never rolls back accepted event.

## 21. Offline Capture Flows

Driver performs a permitted action without network → app acknowledges local intent only → shows `LOCAL_PENDING` → permits continued safe work → does not claim server acceptance. Local failure is visible and actionable.

## 22. Sync and Retry Flows

Pending action becomes eligible for retry → product indicates `SYNCING` → accepted result becomes `SYNCED`; transient failure becomes `RETRY_PENDING`; permanent/uncertain failure becomes `FAILED_NEEDS_ATTENTION`. Repeated retries do not create duplicate business effects.

## 23. Conflict and Ordering Flows

Local state conflicts with server state or event order → product preserves the authoritative accepted outcome, marks conflict/exception, prevents unsafe automatic overwrite and gives Driver/operator a visible resolution path. Conflict algorithm remains a future technical decision.

## 24. Notification Flows

Accepted business event creates notification request → notification state is `REQUESTED`/`PENDING` → delivery accepted becomes `SENT/ACCEPTED`; provider delay/failure becomes `FAILED/DELAYED`. Notification failure never rolls back a committed transport event and does not prove parent read the message.

## 25. Parent App Flows

Parent signs in → relationship-bound children load → current status is displayed → accepted Pickup/Drop-off notifications arrive when available → limited history is shown only under policy. Unrelated child request is denied without enumeration.

## 26. School Dashboard Flows

School Operator opens daily view → authorized service/event state loads → filters within tenant → sees exception or stale-data indication where applicable → may inspect permitted audit context. No zero-latency guarantee is implied.

## 27. Super Admin Flows

Super Admin enters explicit platform context → performs bounded tenant/school or privileged oversight action → confirmation/failure is shown → action is audited. Child-data browsing remains minimum-necessary and is never implicit.

## 28. Authorization Failure Flows

Unauthorized actor, invalid role, revoked session or missing relationship → deny by default → avoid object enumeration → show generic but actionable state → audit security-relevant failure where applicable.

## 29. Cross-Tenant Denial Flows

User requests another tenant resource → product verifies tenant context → denies without revealing existence or metadata → records the event where required. Identifier possession is insufficient.

## 30. Error and Degraded Mode Flows

FCM unavailable → event remains committed/audited and notification is delayed/failed. Queue delayed → status remains pending. Backend unavailable → Driver remains local-pending and Parent/Dashboard show unavailable/stale state. Partial network → retry policy applies. Permission revoked → active protected action stops. Repeated client retry → duplicate prevention applies.

## 31. Student Transport State Machine

`NOT_STARTED → PENDING_PICKUP → PICKED_UP → DROPPED_OFF`.

Any invalid transition enters `EXCEPTION` and requires visible handling. A rejected or duplicate action must not silently advance the business state.

## 32. Sync State Machine

`LOCAL_PENDING → SYNCING → SYNCED`.

Transient failure: `SYNCING → RETRY_PENDING → SYNCING`. Permanent/conflicting failure: `SYNCING → FAILED_NEEDS_ATTENTION`. Sync state never substitutes for business event state.

## 33. Notification State Model

`REQUESTED → PENDING → SENT/ACCEPTED` or `FAILED/DELAYED`. Notification state does not prove the recipient read the message and does not change the business event state.

## 34. Exception Handling Model

Exceptions include invalid transition, duplicate event, revoked permission, missing assignment, stale state, sync conflict, notification failure and unavailable backend. Every exception has a user-visible state, audit expectation and bounded recovery or escalation path.

## 35. Pilot Flow Set

Authentication, tenant context, parent relationship, assigned service, valid Pickup/Drop-off, offline capture/recovery, parent notification, school daily view, authorization denial and degraded states.

## 36. MVP Flow Set

Adds vehicle/route/service administration, assignment changes, limited history, exception dashboard, privileged audit review and bounded Super Admin lifecycle.

## 37. Future Flow Set

Student login, continuous GPS, route optimization, advanced analytics, additional notification channels, support impersonation and expanded exceptional flows.

## 38. Open Policy Dependencies

- BLOCKING: none identified.
- NON_BLOCKING: Admin/Operator matrix, guardian policy, Driver history, retention, support escalation and exact exception policy.
- FUTURE_DECISION: student authentication, cross-tenant support, rich GPS and additional channels.

## 39. Assumptions

Approved PRD/User Stories/User Roles are authoritative product inputs; ZIP remains unavailable; dashboard propagation may be eventual; restrictive authorization applies when uncertain; no numeric SLA or retention is invented.

## 40. Risks

Offline conflicts, event ordering, stale dashboard state, notification delay, permission revocation during work, cross-tenant leakage and ambiguous exceptional flows.

## 41. Flow Coverage Matrix

| Capability | Flow IDs |
|---|---|
| Authentication | FLOW-AUTH-001/002 |
| School operations | Sections 9–17 |
| Pickup | FLOW-PICKUP-001/002/003 |
| Drop-off | FLOW-DROPOFF-001/002/003 |
| Offline/sync/conflict | Sections 21–23, 32 |
| Notifications | Section 24, FLOW-NOTIFY concept |
| Parent/Dashboard/Admin | Sections 25–27 |
| Authorization/tenant denial | Sections 28–29 |
| Degraded modes | Section 30 |

## 42. QA Scenario Mapping

QA SHALL cover each main flow, alternate/error flow, valid/duplicate/invalid/unauthorized event, offline pending/retry/failure/recovery, notification failure, cross-tenant denial and permission revocation. This is a product scenario map, not test code.

## 43. Security Review Mapping

Security review SHALL examine deny-by-default, least privilege, relationship-bound Parent, assignment-bound Driver, tenant isolation, identifier-only denial, minimum child-data exposure, privileged audit and fail-closed degraded behavior.

## 44. Phase Gate Checklist

- [x] 45 required sections represented.
- [x] Pickup and Drop-off full product paths represented.
- [x] Offline, retry, conflict and recovery represented.
- [x] Business, sync and notification states separated.
- [x] Parent, Dashboard, Super Admin and degraded flows represented.
- [x] Authorization and cross-tenant denial explicit.
- [x] Pilot/MVP/Future sets and traceability present.
- [ ] Commander approval pending.

Recommendation: `PASS_WITH_NON_BLOCKING_OPEN_QUESTIONS`.

## 45. Audit Appendix

Sources: approved Discovery, PRD, User Roles, User Stories, Project Control Center and Commander constraints. Master Pipeline ZIP is unavailable and not verified. No implementation, schema, API, dependency or UI design was created.


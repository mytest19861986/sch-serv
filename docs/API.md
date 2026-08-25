# API Contract Specification

## 1. Document Control

Phase 09 — API Specification. Status: Draft. REST-oriented JSON contracts; implementation forbidden.

## 2. Purpose

Define external product APIs and conceptual internal/background contracts without selecting framework code, routes implementation or transport alternatives.

## 3. Scope

This specification covers public mobile/dashboard product contracts and conceptual background boundaries; it excludes handlers, schemas, provider integrations, and implementation protocols.

Public contracts are versioned under a stable major API prefix (for example `/api/v1`) and use JSON. Breaking changes require a new major contract; additive fields remain backward compatible where possible.

## 4. API Principles

The API is REST-oriented, JSON-based, explicitly versioned, deny-by-default, tenant-aware, and server-authoritative for every protected request.

Every protected operation is deny-by-default and tenant-aware. Possessing an object ID never grants access; Parent relationship and Driver assignment are checked server-side.

## 5. API Consumers

Consumers are Driver Android, Parent Android, School Dashboard, Super Admin Dashboard, and approved internal operational workers; each has least-privilege contract visibility.

Clients send authenticated session context plus a request/correlation identity where supported. Tenant context is derived and validated server-side, never trusted solely from a client header or ID.

## 6. API Boundary

Public API contracts expose product operations only; database, cache, outbox worker, and notification-provider interfaces are not public resources.

Successful resources return JSON representation plus server-controlled identifiers/timestamps. Errors use `{ error: { code, message, correlation_id, details? } }`; `details` is limited to safe validation guidance.

## 7. Protocol and Format

Requests and responses use HTTPS-oriented REST/JSON conventions; media, envelope, correlation, and safe-error rules apply consistently.

Stable codes cover authentication required, authorization denied, tenant mismatch, relationship denied, assignment denied, validation, safe-not-found, invalid transition, idempotency conflict, concurrency conflict, rate limit, degraded/unavailable and internal failure.

## 8. Versioning Strategy

Public contracts use a stable explicit major API version; a breaking contract change requires a new major version.

`200` reads/accepted synchronous results; `201` created resource; `202` accepted asynchronous non-critical work; `204` successful no-content; `400` malformed; `401` absent/invalid authentication; `403` authorized identity lacks access; `404` safe resource absence; `409` state/idempotency conflict; `422` well-formed but invalid business input; `429` rate limit; `500` internal; `503` safe temporary degradation.

## 9. Compatibility Policy

Additive compatible change is preferred; removal, semantic change, and incompatible enum assumptions require documented version/deprecation treatment.

High-volume/changing collections use opaque cursor pagination (`limit`, `cursor`, `next_cursor`) with stable documented sort. Filters and sorts are allowlisted per resource; arbitrary field/query expressions are forbidden.

## 10. Authentication Contracts

Authentication establishes identity only; authorization and tenant/resource scope are independently evaluated on protected requests.

Critical transport writes require `Idempotency-Key` and `client_event_id` where distinct. Scope includes tenant, operation, actor/assignment/device context and immutable request fingerprint. Same key/context/fingerprint replays a safe prior outcome; different fingerprint/context returns conflict and security/audit signal.

## 11. Session Contracts

Login, refresh, logout, current-session inspection, and revocation have externally observable safe outcomes without selecting token or credential internals.

`POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /me`, `GET /me/sessions`, and `POST /me/sessions/{session_id}/revoke` define product contracts. No JWT claims or credential algorithms are specified.

## 12. Device Session Contracts

Device context may strengthen Driver retry/assignment scope; revocation is rechecked at the protected-request boundary.

`GET /me` returns user-safe identity, active memberships, roles and selected/current tenant context. It does not expose unrelated child or tenant data.

## 13. Current User Context

The current-user contract returns only safe identity, active memberships, roles, and selected tenant context.

Super Admin-controlled tenant/school administration supports scoped create/read/update/lifecycle actions: `/tenants`, `/tenants/{tenant_id}`, `/schools`, `/schools/{school_id}`. Privileged access is audited and privacy constrained.

## 14. Tenant Context

Tenant context is derived and validated server-side and cannot be established merely from a client header, URL ID, or request body.

`/users`, `/tenant-memberships`, `/role-assignments` provide lifecycle and scoped privileged administration. Enable/disable and role changes return audit/correlation outcome, not sensitive internals.

## 15. Tenant APIs

Tenant lifecycle operations are Super-Admin-controlled, purpose-bound, audited, and never confer unrestricted child-data browsing.

`/students`, `/guardians`, `/student-guardian-relationships` support authorized school operations. Parent users use `/me/children` and linked-child subresources only; unrelated-child identifiers return no existence clue.

## 16. School APIs

School APIs apply school scope inside the authoritative tenant context and expose only allowlisted administration/operations.

`/drivers`, `/vehicles`, `/routes`, `/route-stops`, `/transport-services`, `/service-instances` and assignment resources use tenant-consistent references and lifecycle-aware updates.

## 17. User APIs

User lifecycle APIs use minimum representations and forbid caller-controlled privilege, tenant, or membership ownership fields.

`/driver-service-assignments`, `/vehicle-service-assignments`, `/student-service-assignments` expose authorized operational administration. Time-sensitive validity is enforced server-side; clients cannot self-assign.

## 18. Role and Membership APIs

Role and membership changes require elevated scope, server-side validation, audit correlation, and no self-escalation.

Driver app reads assigned active service instances, minimum roster and current state through `/driver/active-services`, `/driver/services/{service_instance_id}/roster` and `/driver/services/{service_instance_id}/transport-state`. Responses carry freshness/version and minimum data.

## 19. Student APIs

Student APIs are school-scoped, minimize sensitive child data, and apply safe enumeration protection.

`POST /driver/services/{service_instance_id}/students/{student_id}/pickup` accepts event type, `client_event_id`, idempotency key, client occurred time, optional client-known state version and device/session context. Response distinguishes committed, replayed, rejected and conflict outcomes with canonical event/state/version/times.

## 20. Parent/Guardian APIs

Guardian records and Parent surfaces are distinct: Parent access is relationship-bound and recalculated for every read.

`POST /driver/services/{service_instance_id}/students/{student_id}/drop-off` has the same critical contract and validates the allowed transition against authoritative current state and assignment.

## 21. Relationship APIs

Relationship creation/change is scoped administration; relationship removal immediately restricts later Parent access.

First valid submission commits canonical event/current state/audit/outbox atomically. Exact retry returns original result. Semantic duplicate/collision returns conflict. Revoked/unauthorized/foreign-tenant requests are safely denied/audited. Invalid/stale state returns reconciliation information without falsely confirming success.

## 22. Driver APIs

Driver APIs distinguish operational identity from assignment authority; Driver cannot self-assign or set canonical operational ownership.

Both single-event critical writes and `POST /driver/sync/events` batch reconciliation are supported conceptually. Batch response is per-item, ordered by submitted sequence where relevant, allows partial success and supplies accepted/replayed/rejected/conflict outcomes; whole-batch atomicity is not assumed.

## 23. Vehicle APIs

Vehicle lifecycle and assignment references are tenant-consistent and controlled by scoped school administration. Slice 13.07 exposes only a tenant-scoped stable fleet `identifier` plus lifecycle/version fields; plate, VIN, capacity and assignment fields are outside this slice.

Local capture is provisional. Each sync item carries client event/idempotency identity, context, occurred time and known version. Server revalidates current or explicitly allowed historical authority; rejected evidence remains visible to Driver through a safe outcome category.

## 24. Route APIs

Route operations use scoped administration and do not permit cross-tenant or arbitrary assignment references.

`GET /me/children`, `/me/children/{student_id}/transport-status`, `/me/children/{student_id}/transport-history` and notification preference contracts are relationship-bound and minimize history/detail. Relationship removal immediately constrains subsequent reads.

## 25. Route Stop APIs

Route-stop changes are lifecycle-aware, allowlisted, and subject to the same tenant/school scope as the route.

`/dashboard/daily-operations`, `/dashboard/services/{service_instance_id}`, `/dashboard/exceptions` and scoped aggregates read current/read models and include `as_of`/freshness state where eventual consistency applies.

## 26. Service APIs

Transport-service changes are scoped and auditable; service state is not implicitly changed by arbitrary client fields.

Platform administration endpoints are explicitly privileged, purpose/audit constrained and avoid implicit unrestricted child browsing. They are distinct from school-scoped dashboard APIs.

## 27. Service Instance APIs

Service-instance reads/writes use authoritative lifecycle and temporal scope; Driver reads are additionally assignment-bound.

User-facing notification preference/status contracts distinguish generated, dispatch-eligible, suppressed, provider accepted/sent and optional product-supported read acknowledgement. Provider internals are not exposed as business success.

## 28. Assignment APIs

Driver, vehicle, and student assignment operations validate tenant consistency and server-side validity; self-assignment is forbidden.

Privileged audit search is controlled via `/audit-records` with allowlisted tenant/time/action/actor filters, safe pagination and export restrictions. Security operations return audited result status without exposing protected resource existence.

## 29. Driver Operational APIs

Operational APIs distinguish assignment-bound Driver reads and critical state-changing transport commands.

Outbox workers, projections and FCM processing use internal conceptual contracts only. They are not public HTTP API surfaces; durable outbox and dispatch revalidation rules remain authoritative.

## 30. Assigned Service API

The assigned-service contract returns only services currently authorized for the Driver, with freshness/version information.

Slice 13.11 adds `POST /driver/services/{serviceInstanceId}/start` with `expectedVersion`. The server owns actor and authoritative time, transitions only `not_started` to `in_progress`, increments the service-instance version and records the transition audit atomically. A repeated Start after `in_progress` is idempotent without a second audit record.

The Driver execution reads are `GET /driver/active-services`, `GET /driver/services/{serviceInstanceId}/transport-state` and `GET /driver/services/{serviceInstanceId}/roster`. Roster access requires an active started service and returns only active student assignments in the same tenant and school. Invalid or expired JWT is `401`, hidden authority/resource denial is enumeration-safe `404`, and valid OCC conflict is `409`.

For roster reads, pre-start service instances, unknown IDs, cross-tenant IDs, foreign-school IDs (including a same-tenant school outside the Driver's assigned scope), revoked assignments, and inactive service/actor authority intentionally share one indistinguishable denial contract: HTTP `404`, `error.code=SAFE_NOT_FOUND`, and one generic `error.message`. The current assignment status vocabulary is `active|revoked`; inactive authority is represented by the authoritative service or actor lifecycle. The response contains no tenant, school, assignment, service, lifecycle, timestamp or other state metadata; only `correlation_id` may differ and it is excluded from parity comparisons. Once the authorized assignment is `in_progress`, the Driver receives `200` with the minimum active roster. This parity is required to prevent resource-state and child-data enumeration.

Rate policy is operation/actor/tenant-risk aware. Limits do not fabricate outcomes; clients receive `429` or `503` with retry-safe guidance. Critical retries remain idempotent.

## 31. Driver Student Roster API

Roster access is minimum-data, active-assignment-bound, and safely denied when assignment is revoked or expired.

Contracts specify required, optional and mutually exclusive fields; type/format validation occurs before business validation. Validation errors identify safe fields, not authorization/resource internals.

## 32. Transport Status API

Transport status returns authoritative state/freshness without exposing internal driver, device, audit, or unrelated-child detail.

Identifiers are server-issued/global-safe. Sensitive fields are omitted unless caller scope requires them. API representations do not expose database table names or internal worker state.

## 33. Pickup API

Pickup accepts only the documented critical-write payload and commits only after server authorization, transition, idempotency, and concurrency checks.

Current-state mutations carry server version/state in response. Clients may send known version; a changed authoritative state returns conflict/reconciliation disposition rather than silent overwrite.

## 34. Drop-off API

Drop-off has the same critical-write safeguards and its state transition is evaluated against authoritative current state.

Each handler derives scope from authenticated membership and relationship/assignment context. `404` versus `403` behavior is chosen to avoid cross-tenant enumeration; error bodies remain non-sensitive.

## 35. Offline Sync API

Offline sync transports provisional client evidence for individual authoritative evaluation; local capture is never server authorization.

Every request supports correlation identity. Metrics/logs distinguish authorization denials, validation, idempotency replay/collision, state conflict, sync result, rate limit and unavailable outcomes while redacting sensitive fields.

## 36. Batch Sync Evaluation

Batch evaluation returns deterministic, ordered per-item outcomes and permits partial success; it does not claim global atomicity.

Example request shape: `{ client_event_id, occurred_at, known_state_version?, device_context? }`; headers include idempotency/correlation identity. Example response shape: `{ disposition: COMMITTED|REPLAYED|REJECTED|CONFLICT, event_id?, current_state?, version?, rejection_category?, server_time }`.

## 37. Idempotency Contract

Critical writes require scoped identity and immutable fingerprint semantics; current authorization is evaluated before protected replay disclosure.

Collection response shape: `{ items, next_cursor?, as_of? }`. The `as_of` value informs consumers when derived/read-model freshness matters.

## 38. Duplicate Request Behavior

An exact eligible retry is safely replayed; a collision, altered fingerprint, or different scope is a stable conflict/security outcome.

Tenant/membership checks map to tenant model; Parent reads map to guardian relationship; Driver execution maps to active assignment; critical commands map to event/current-state/idempotency/outbox/audit invariants.

## 39. Concurrency Contract

Known-version/state conflict is explicit and provides safe reconciliation rather than silent overwrite.

Retries test replay; concurrent commands test `409`; revoked assignment tests rejection/audit; worker/FCM outage tests committed event without delivery claim; projection lag tests freshness; cross-tenant IDs test no disclosure.

## 40. Invalid Transition Contract

An invalid transport transition is rejected with a stable safe category and never reported as committed.

Open: exact session/device and offline-staleness policy values, retention, export enablement and rate thresholds. Checklist: REST/JSON/versioning, authorization, critical idempotency, offline batch reconciliation, error/HTTP semantics, pagination, dashboard freshness and audit contracts are specified. Specialist review, quality score and Commander Gate remain pending; no backend code, endpoint implementation or schema migration is created.

## 41. Revocation During Offline Sync

The sync result distinguishes `REJECTED_AUTHORITY_REVOKED`, `REJECTED_ASSIGNMENT_REVOKED` and any explicitly allowed historical-authority review path. Local evidence is retained safely; server acceptance is never implied.

## 42. Parent Child API

Parent-facing child endpoints use relationship-bound `/me/children/{student_id}` resources and must re-evaluate relationship status on every request.

## 43. Parent Current Status API

Current child status returns minimum transport state, trusted/freshness time and safe absence/degraded state; it excludes Driver/device/internal audit detail.

## 44. Parent History API

History is limited by approved visibility window and relationship lifecycle. Revoked relationships receive no continued history access.

## 45. Notification User Contracts

Preference/status APIs expose user-controlled product settings only. Dispatch acceptance/read are separate concepts; sensitive eligibility is rechecked server-side.

## 46. School Dashboard APIs

School endpoints consume current/read models and return tenant/school scoped operational content with as-of/freshness metadata.

## 47. Daily Operations API

`GET /dashboard/daily-operations` returns authorized date/school overview, totals and safe exception summaries from a read model.

## 48. Service Monitoring API

`GET /dashboard/services/{service_instance_id}` returns service lifecycle, progress, exception and freshness information after school scope validation.

## 49. Student Operational Status API

Authorized operations views return current state and last accepted-event context, never raw event history by default.

## 50. Exception API

`GET /dashboard/exceptions` exposes allowlisted exception categories and pagination; it does not leak other tenant/student details.

## 51. Super Admin APIs

Super Admin routes are distinct, purpose/audit constrained and privacy-minimized. Platform authority does not grant unbounded child-data browsing.

## 52. Tenant Lifecycle API

Tenant create/activate/suspend/archive operations are privileged, idempotent where necessary and audit correlated.

## 53. Privileged User Administration

Enable/disable, membership and role mutations require explicit authorization, safe validation and audit outcome; bulk change requires separate approved contract.

## 54. Audit Query API

Audit search uses allowlisted tenant/time/action/actor filters, cursor pagination and export-disabled-by-default behavior.

## 55. Reporting API Principles

Reporting consumes authorized bounded views and respects tenant, relationship, retention and export controls; no raw-database query contract is exposed.

## 56. Read Model API Principles

Read-model APIs are non-authorizing and disclose `as_of`/freshness when their state may lag canonical commit.

## 57. Eventual Consistency/Freshness Contract

Responses identify canonical versus derived state and include safe freshness/as-of semantics. A stale read never authorizes a write.

## 58. Request Envelope Principles

Common request metadata may include correlation ID, idempotency identity and supported client context; unknown sensitive/privileged fields are rejected rather than over-posted.

## 59. Response Envelope Principles

Responses are stable JSON, minimize sensitive data and provide server-derived identifiers/times. Internal storage/queue/provider details remain hidden.

## 60. Error Model

Every error follows the stable error envelope in section 6 and maps one safe category to one deterministic client-handling expectation.

## 61. Error Codes

Codes are contract constants, not human text: `AUTH_REQUIRED`, `ACCESS_DENIED`, `TENANT_SCOPE_DENIED`, `RELATIONSHIP_DENIED`, `ASSIGNMENT_DENIED`, `INVALID_TRANSITION`, `IDEMPOTENCY_CONFLICT`, `STATE_CONFLICT`, `RATE_LIMITED`, `SERVICE_DEGRADED` and `INTERNAL_ERROR`.

## 62. Validation Error Model

Validation errors return `VALIDATION_ERROR` with allowlisted field messages; they do not echo secret or sensitive rejected values.

## 63. Authentication Errors

Authentication failures use `401` with safe reauthentication guidance and correlation identity; token/session specifics are not exposed.

## 64. Authorization Errors

Authorization failure is server-derived and audit-eligible for privileged/security cases. UI visibility never substitutes for this check.

## 65. Tenant Isolation Errors

Tenant context mismatch returns a safe denial/non-enumerating response and records a security signal where appropriate.

## 66. Not Found / Enumeration Safety

Protected resource absence and forbidden cross-scope access use contract-consistent non-disclosing behavior; details do not reveal existence.

## 67. Conflict Errors

Idempotency collision, duplicate semantic request and stale state use `409` with a machine category and only safe reconciliation data.

## 68. Rate Limit Errors

`429` identifies retry guidance where safely available but does not disclose risk thresholds or other tenant activity.

## 69. Degraded Service Errors

`503` means no confirmed result; clients preserve idempotency identity and retry safely. Background provider loss does not turn committed transport actions into `503`.

## 70. HTTP Status Semantics

Status rules in section 8 apply uniformly; endpoint documentation may narrow a code only when its contract semantics require it.

## 71. Pagination

Collections specify cursor/limit/next cursor, stable sort and maximum page-size concept. Clients must not infer total data visibility from page size.

## 72. Cursor Pagination

Cursors are opaque, tenant/scoped and tied to documented sort semantics. Invalid/expired cursors fail safely without revealing data.

## 73. Filtering

Each collection exposes only documented filters; all filters are tenant/role/relationship scoped before result evaluation.

## 74. Sorting

Sort keys/order are allowlisted and stable. Sensitive or operationally unsafe sort expressions are rejected.

## 75. Search

Search is scoped, allowlisted and privacy-aware. It cannot perform arbitrary query syntax or enumerate children/tenants.

## 76. Bulk Operations

Bulk mutation is not implicit in single-resource contracts. If later approved, it requires per-item outcomes, authorization and audit semantics.

## 77. Import/Export Principles

Imports/exports need separately approved lifecycle, validation, tenant/purpose scope, audit and sensitive-data controls. Sensitive exports remain disabled absent approval.

## 78. Sensitive Data Minimization

Response fields are actor/surface-specific and expose only the minimum child/guardian/route context required by the product flow.

## 79. Mass Assignment Protection

Request schemas are explicit allowlists. Server ignores neither unknown sensitive field nor client-controlled ownership/role/tenant context; it rejects them.

## 80. IDOR Protection

Every resource lookup additionally verifies tenant, relationship or assignment scope; object identifiers alone are never authority.

## 81. BOLA Protection

Every object-level command verifies actor-specific policy and current contextual eligibility, including Driver service and Parent-child boundaries.

## 82. Tenant Injection Protection

Tenant selection derives from server authorization/membership and validated privileged context. Client-supplied tenant identifiers are input, not authority.

## 83. Replay Protection

Critical commands bind idempotency to operation/context/fingerprint and recheck caller authorization before replaying a safe result.

## 84. Critical Write Security

Pickup/drop-off writes require authentication, assignment scope, student/service context, idempotency, state validation, audit and atomic canonical transaction behavior.

## 85. Rate Limiting

Rate-limit classes distinguish authentication, privileged admin, search/read and critical operational writes; policy values remain operational decisions.

## 86. Correlation IDs

Client-provided correlation identity is validated/safely propagated or server-generated. It links request, event, outbox, audit and sync outcome.

## 87. Audit Correlation

Privileged and critical API outcomes produce or reference auditable correlation context without leaking audit internals to ordinary callers.

## 88. Logging Safety

API logs redact credentials, tokens, child-sensitive fields, raw notification payloads and unsafe request bodies while retaining operational correlation.

## 89. API Observability

Observe success/error/latency, authorization denial, idempotency replay/collision, state conflict, sync partial rejection, rate limit and freshness indicators.

## 90. API Metrics

Metrics are privacy-safe aggregates by endpoint/family/outcome and alert on critical degradation without exposing child identifiers.

## 91. API Tracing

Tracing follows correlation identity across API, canonical transaction, outbox, worker and notification lifecycle with sensitive attribute controls.

## 92. Mobile Retry Semantics

Mobile retries preserve idempotency/client identity. Network uncertainty returns no fabricated success and supports per-item reconciliation after recovery.

## 93. Mobile Backward Compatibility

Additive evolution is preferred; mobile clients tolerate unknown additive response fields. Breaking changes use version/deprecation process, not silent behavior change.

## 94. Degraded/Offline Expectations

Driver offline capture is locally visible as provisional. Parent/dashboard reads state freshness/degradation clearly; server confirmation remains authoritative.

## 95. API Evolution Rules

Add fields/enums safely where clients can tolerate them; document behavioral change, preserve idempotency/error semantics and version breaking changes.

## 96. Deprecation Policy

Deprecation gives documented replacement and compatibility guidance; support timeline is not invented without approval.

## 97. OpenAPI Readiness

This human-readable specification is structured so a future OpenAPI artifact can be generated/reviewed, but no OpenAPI implementation file is created in this phase.

## 98. Security Mapping

API security maps authorization to approved roles/relationships/assignments, database tenant constraints/idempotency and architecture audit/outbox/notification rules.

## 99. Database Mapping

Critical commands map to canonical event/current state/idempotency/audit/outbox boundary; reads map to current/read models; no Redis state is canonical.

## 100. User Story Traceability

API families map to user stories: Parent linked status, Driver execution/offline sync, School operations and Super Admin controlled administration.

## 101. User Flow Traceability

Pickup/drop-off, offline reconciliation, revoke/denial, dashboard freshness and notification paths map to approved user-flow states.

## 102. UX Traceability

Machine outcomes support UX states for pending, committed, replayed, rejected, conflict, stale and degraded visibility.

## 103. QA Scenario Mapping

Test plans cover exact retry, duplicate semantic request, revoked assignment, cross-tenant ID, invalid transition, partial batch, error determinism and backward-compatible additive response.

## 104. API Risks

Risks include inconsistent authorization, error enumeration, replay leakage, stale mobile state, batch ambiguity, sensitive overexposure and unmeasured rate/degradation thresholds.

## 105. Assumptions

REST/JSON and versioned major path are approved direction; exact session algorithms, retention and rate thresholds are not assumed.

## 106. Open Questions

Session/device policy values, offline historical-authority allowance, export enablement, search scope, response support timeline and rate limits remain open.

## 107. Candidate API ADRs

API-ADR-001 REST/JSON; 002 versioning; 003 stable error envelope; 004 idempotent critical writes; 005 per-request resource authorization; 006 cursor pagination; 007 per-item batch outcomes; 008 freshness exposure; 009 provider-neutral notification semantics; 010 additive mobile compatibility.

## 108. Phase Gate Checklist

- [x] 109 literal sections present.
- [x] Required contract domains, critical write, idempotency, offline/batch, errors, HTTP, paging, security, compatibility and mappings documented.
- [ ] Specialist reviews, quality scoring and Commander approval pending.
- [x] No implementation code, endpoint handler, migration or schema file introduced.

## 109. Audit Appendix

Sources: approved Phases 01–08, Commander Phase 09 instruction and accepted invariants. This document specifies contracts only and makes no implementation or benchmark claim.

### 109.1 Endpoint Contract Catalogue

The following logical contract catalogue is normative for this phase; it does not create handlers. Each protected row requires authenticated identity, server-derived tenant scope, correlation ID, authorization at request time, privacy-safe errors, and audit correlation for privileged or critical writes.

| Contract family | Method and logical path | Authorized caller / precondition | Required request or response contract | Outcome rules |
|---|---|---|---|---|
| Session | `POST /auth/login`, `/auth/refresh`, `/auth/logout`; `GET /me` | identity/session lifecycle only | credentials or refresh context as applicable; `GET /me` returns safe identity and memberships | stable auth errors; logout/revoke is idempotent-safe |
| Tenant, school, users, roles | resource operations under `/tenants`, `/schools`, `/users`, memberships and roles | Super Admin for tenant lifecycle; scoped School Admin for its school | allowlisted writable fields; server ID/version/audit correlation | lifecycle/role changes audited; stale version conflicts |
| Student and guardians | resources under `/students`, `/guardians`, relationships | scoped school role; Parent only through `/me/children` | tenant-consistent references; sensitive fields minimized | foreign/unrelated targets follow safe enumeration rule |
| Fleet and planning | resources under drivers, vehicles, routes, stops, services, instances, assignments | scoped school operations role | lifecycle/version and tenant-consistent references | no self-assignment; lifecycle/state conflicts are explicit |
| Driver read | assigned services, roster, transport state | active Driver assignment | minimal roster, `as_of`, state version | revoked assignment safely denied |
| Pickup/drop-off | `POST /driver/services/{id}/students/{student_id}/pickup|drop-off` | active validated assignment and allowed transition | `client_event_id`, `occurred_at`, optional known version, Idempotency-Key | committed/replayed/rejected/conflict per below |
| Offline batch | `POST /driver/sync/events` | authenticated Driver; every item independently authorized | batch key and ordered items with `client_event_id` | per-item result; never implied all-or-nothing |
| Parent, dashboard, audit | linked child/status/history, dashboards, audit query | relationship or scoped privileged role | minimum data, allowlisted filters, freshness | audit and exports purpose-bound |

### 109.2 Critical Transport Write Contract

For pickup and drop-off, the server SHALL derive tenant, actor, assignment, canonical event type, target ownership, authoritative time, and authorization context. A client SHALL NOT select event ownership, tenant, or arbitrary event type. Required payload fields are `client_event_id` and `occurred_at`; `known_state_version` and device context are optional. A result SHALL include `disposition`, authorized safe state/event identity where applicable, authoritative version, server time, and correlation ID. The server validates current authority, assignment, transition, tenant scope, idempotency, and concurrency before confirmation; one canonical transaction yields current state, audit record, and outbox intent together.

### 109.3 Safe Idempotency and Revocation Order

The server SHALL authenticate and re-evaluate current authorization before returning a replayed result. Replay is eligible only for the same tenant, operation, actor/assignment/device scope, and immutable request fingerprint. If authority has been revoked, the request SHALL return a safe denial and SHALL NOT disclose the original protected response merely because its key exists; that decision is audit-correlated. A key reused with another scope or fingerprint returns a stable conflict/security outcome. Key entropy/format, retention duration, and exact historical-authority policy remain explicit open policy decisions.

### 109.4 Offline Batch Reconciliation

Each batch has an identity and bounded server-configured body/item limits. Every item SHALL contain `client_event_id`, submitted sequence, event intent, occurred time, and critical-write identity; every result SHALL echo `client_event_id`, sequence, disposition, correlation ID, and safe reconciliation state. Duplicate items in one batch are deterministic: one may commit/replay and later duplicates return a safe replay/duplicate result. Items are evaluated in submitted order for a dependent student/service stream; an invalid pickup prevents a dependent drop-off from success, while independent items may continue. Partial success is normal. A response-loss retry uses the same batch/item identities and gets deterministic reconciliation, never fabricated aggregate success.

### 109.5 Authorization and Writable-Field Matrix

| Operation | Driver | Parent | School Operator | School Admin | Super Admin | Constraint |
|---|---|---|---|---|---|---|
| Own assignment/roster | assigned only | no | scoped view | scoped view | support scope | server derives assignment/tenant |
| Pickup/drop-off/sync | assigned only | no | no | no direct driver action | no direct driver action | client cannot set actor, tenant, assignment, canonical event type |
| Linked child/status/history | no | current relationship only | scoped need | scoped | purpose-bound exception | minimum fields and relationship recheck |
| Students/fleet/routes/services | no | no | approved scoped operations | scoped administration | platform support scope | allowlisted fields; no role escalation |
| Memberships/roles/lifecycle | no | no | no unless delegated | scoped memberships only | tenant lifecycle | elevated permission and audit |
| Audit/export | no | no | no default | approved scoped query | approved platform query | purpose/filter/export safeguards |

### 109.6 Error, Enumeration, Cursor and HTTP Details

The authoritative envelope is `{ error: { code, message, correlation_id, details? } }`. `details` is only safe field validation, never authorization, tenant, relationship, assignment, or internal-state clues. `VALIDATION_ERROR` maps to 400/422 by malformed versus business-invalid input; `AUTHENTICATION_REQUIRED` to 401; `ACCESS_DENIED` to 403 only where existence is already safely known; cross-tenant, unrelated, or otherwise non-disclosable targets return `SAFE_NOT_FOUND` (404); `INVALID_TRANSITION`, `STATE_CONFLICT`, and `IDEMPOTENCY_CONFLICT` map to 409; `RATE_LIMITED` to 429; temporary safe degradation to 503. Cursors are opaque and bound to tenant, caller scope, filters, sort, and expiry. Collections use stable documented ordering and best-effort consistency under concurrent change; invalid, expired, or transplanted cursors return a stable safe validation outcome.

### 109.7 Session, Boundary, and Payload Rules

Session/device revocation is rechecked at protected request boundaries; refresh replay or revoked session/device yields safe authentication denial. If browser-cookie sessions are later selected, the contract SHALL include applicable CSRF protection; no credential mechanism is selected here. Requests use `application/json`; unsupported media and oversized bodies use stable 415/413 outcomes once approved limits are configured. `202` is only for explicitly documented deferred work with a follow-up status contract, never critical transport confirmation. `204` has no response body. Exact timeout and size values remain open policy decisions.

### 109.8 Mandatory Negative QA Scenarios

QA SHALL cover revoked actor retrying an old idempotency key; same key across tenant/device/assignment; duplicate item in one batch; reordered pickup/drop-off; batch replay after response loss; privileged-field escalation; foreign-ID 404/403 parity; cursor transplant; session replay/revocation; deterministic error envelope; unsupported content type/oversize batch; stale known state version; and additive unknown field/enum tolerance by mobile clients.

# System Architecture Specification

## 1. Document Control

- Phase: 07 — System Architecture
- Status: Draft for architecture gate
- Mode: Specification only; implementation forbidden
- Scope: School Transportation Management Platform
- Source baseline: approved Discovery, PRD, User Roles, User Stories, User Flows and UX

## 2. Architecture Objectives

The architecture SHALL support a simple pilot while preserving an evolutionary path from pilot to approximately 1M+ students and approximately 2M business events/day. It SHALL prioritize tenant isolation, child-data privacy, offline Driver operation, auditability, operational recovery and incremental scale-out.

## 3. Approved Technology Direction

| Area | Direction |
|---|---|
| Driver/Parent Android | Kotlin, Jetpack Compose, Room, WorkManager, Offline First |
| Web surfaces | Next.js, React, TypeScript |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL |
| Cache/queue | Redis |
| Push notifications | Firebase Cloud Messaging |
| Runtime/edge | Docker, Nginx/load balancer |

These are approved directions, not an implementation plan or dependency lockfile.

## 4. System Context

The platform consists of Driver Android, Parent Android, School Dashboard, Super Admin Dashboard, and a shared Backend Platform. External actors include FCM and the device operating systems. All business actions pass through the Backend Platform when connectivity is available; Driver operational continuity is maintained locally when it is not.

## 5. Logical Boundaries

### 5.1 Client surfaces

Clients own presentation, local session state, local offline data and user interaction. They SHALL NOT become authoritative for tenant policy, identity, assignments, child safety decisions or audit history.

### 5.2 Backend Platform

The backend owns authentication, authorization, tenant policy, canonical business state, conflict decisions, notification orchestration, audit records and synchronization contracts. It exposes product capabilities without prescribing endpoint shapes in this document.

### 5.3 Persistence and supporting services

PostgreSQL is the system of record. Redis may support ephemeral caching, rate limiting and asynchronous work; it SHALL NOT be the sole source for safety-critical business state. FCM is a delivery channel, not a source of truth.

## 6. Deployment Topology (Conceptual)

Clients → Nginx/load balancer → stateless NestJS application instances → PostgreSQL and Redis. Asynchronous workers consume queued work for notifications, exports and non-critical processing. Observability spans edge, application, worker, database and client sync outcomes. The pilot MAY run with fewer instances, but boundaries SHALL remain compatible with horizontal expansion.

## 7. Domain Ownership

The backend SHALL separate conceptual domains: identity/authentication; tenant/school; users and roles; students/parents; drivers/vehicles; routes/services/assignments; pickup/drop-off events; synchronization; notifications; audit/operations. Domain boundaries are logical ownership boundaries, not a mandate to deploy microservices.

## 8. Tenancy and Authorization

- Every tenant-scoped read/write SHALL carry an evaluated tenant context.
- Authorization SHALL be deny-by-default and least-privilege.
- School Admin and School Operator remain distinct roles.
- Parent access is relationship-bound to permitted children.
- Driver access is assignment-bound and limited to operational data.
- Super Admin has platform administration powers but no implicit unrestricted child browsing.
- Cross-tenant access attempts SHALL fail safely and produce an auditable security signal without revealing target existence.

## 9. Identity and Session Boundary

Authentication is centralized in the Backend Platform. Clients may retain a session according to approved security policy, but authorization is re-evaluated for protected operations. Logout, revocation, role change and tenant suspension SHALL invalidate or constrain subsequent access and be reflected in degraded/offline UX.

## 10. Offline-First Driver Architecture

Room stores the minimum encrypted/local-protected operational dataset required for an assigned service: route context, assignment, authorized student identifiers, pickup/drop-off state and pending events. WorkManager coordinates retryable synchronization. Each locally recorded event carries a client-generated idempotency identity and causal metadata; the server remains authoritative after reconciliation. The product SHALL clearly distinguish pending, accepted, rejected, stale and conflict states.

Offline mode SHALL not broaden authorization, expose unrelated students, or silently overwrite a newer server decision. Sensitive data retention on device SHALL be minimized and revocable where practical.

## 11. Synchronization Model

Synchronization is incremental and resumable. The client submits an ordered set of pending operations; the backend validates tenant, actor, assignment, freshness and idempotency, then returns per-operation outcomes and the current authoritative snapshot needed to recover. Retries SHALL be safe. Partial success SHALL be visible. Conflict policy is domain-specific: safety events are preserved and reconciled explicitly; non-critical presentation data may refresh from server state.

## 12. Event and Queue Semantics

Business events (pickup, drop-off, assignment and notification intents) SHALL be durable in the system of record before being treated as accepted. Redis-backed queues MAY decouple notification and non-critical processing. Consumers SHALL tolerate duplicate delivery, use idempotent handling, expose retry/dead-letter outcomes and avoid making delivery success equivalent to business success.

## 13. Notification Architecture

The backend creates policy-checked notification intents, records their audit status and sends through FCM where appropriate. Clients deep-link only after local authorization and current-state validation. Delivery, token invalidation, user preferences, retry and failure states SHALL be observable. No notification payload should disclose more child data than necessary.

## 14. Data Protection

Child identity, guardian relationship, route/location context and event history are sensitive. Data SHALL be encrypted in transit and protected at rest; logs and notifications SHALL use minimization and redaction. Access, export, retention and deletion behavior remain subject to jurisdictional decisions recorded as open questions.

## 15. Reliability and Availability

The service SHALL fail gracefully: read-only or stale views where safe, queued retry for transient work, explicit offline operation for Driver workflows, and no fabricated success. Health checks, backup/restore procedures, migration rollback strategy and incident runbooks are required before production. Exact SLO/SLA values remain undecided unless approved separately.

## 16. Scale Evolution

The architecture SHALL allow stateless application horizontal scaling, read optimization, queue worker scaling, database indexing/partitioning decisions and tenant-aware operational isolation. Initial deployment should avoid premature distributed complexity. Scale milestones are Pilot → 10K → 100K → 500K → ~1M+ students; peak design reference is 1,000–5,000 events/sec, not a benchmark claim.

## 17. Security and Audit

Security controls SHALL cover authentication, authorization, tenant isolation, rate limiting, secret management, abuse detection, audit immutability/protection, administrative actions and security incident signals. Audit records SHALL identify actor, tenant, action, target class, time, outcome and correlation context while minimizing child data.

## 18. Observability

Metrics SHALL include request outcomes, latency, queue depth/age, sync success and conflict rates, notification outcomes, database health, client crash/offline duration and authorization denials. Structured logs and traces SHALL use correlation identifiers and redact sensitive values. Alerts SHALL distinguish user-impacting safety failures from recoverable background failures.

## 19. Disaster Recovery and Continuity

Backups, restoration verification, regional/service outage behavior and operational ownership SHALL be defined before launch. Driver local continuity is a product recovery mechanism, not a replacement for backend recovery. Recovery objectives are open until business and compliance owners approve them.

## 20. Architecture Constraints

No schema, endpoint, DTO, migration, code structure, dependency version or cloud-provider commitment is finalized by this document. Any future design SHALL preserve the logical boundaries, product security rules, offline-first behavior and audit requirements above.

## 21. Candidate ADRs

1. ADR-07-01: Modular monolith first, with explicit domain boundaries.
2. ADR-07-02: PostgreSQL as canonical business source of truth.
3. ADR-07-03: Offline Driver writes use idempotent, per-operation reconciliation.
4. ADR-07-04: Redis is auxiliary cache/queue only.
5. ADR-07-05: Notification delivery is asynchronous and non-authoritative.
6. ADR-07-06: Tenant and relationship authorization is enforced centrally.
7. ADR-07-07: Scale by stateless application/worker expansion before service decomposition.

## 22. Open Architecture Questions

- Pilot jurisdiction and applicable child-data/privacy obligations.
- Exact retention/deletion and legal-hold rules.
- Availability, RPO and RTO targets.
- GPS precision, collection policy and offline conflict policy details.
- Pilot tenant/student volume and peak schedule shape.
- Required disaster-recovery topology and operational ownership.

## 23. Architecture Gate Checklist

- [x] Approved technology direction recorded.
- [x] Four product surfaces and backend boundary defined.
- [x] Tenant isolation and role boundaries explicit.
- [x] Driver offline and synchronization model defined.
- [x] Security, privacy, audit and observability requirements covered.
- [x] Pilot-to-scale evolution described without premature implementation.
- [x] No implementation artifacts created.
- [ ] Commander approval and ADR disposition pending.

## 24. Audit Appendix

This artifact is derived from the approved product artifacts listed in Document Control. Where exact operational targets were unavailable, they are marked open rather than invented. Validation scope: documentation-only review; implementation leakage not detected.

## 25. Reconciliation Scope

The Commander requires 82 explicit architecture topics. Sections 25–82 make the former consolidated coverage explicit; they remain specification, not implementation.

## 26. Modular Monolith

The initial backend SHALL be a modular monolith: one deployable application with enforceable logical domain boundaries and independently testable modules.

## 27. Module Boundaries

Modules own their domain rules and persistence access. Cross-domain access SHALL use defined module contracts, not direct internal table ownership assumptions.

## 28. Module Dependency Rules

Dependencies SHALL flow through stable application/domain contracts. Cyclic dependencies, shared mutable business state and cross-module writes outside the owning contract are prohibited.

## 29. Identity Module

Identity owns credential/session lifecycle and authorization context issuance; it does not own school operational decisions.

## 30. Tenant Module

Tenant/school lifecycle and scope policy are owned centrally and evaluated before any tenant-scoped business operation.

## 31. People and Relationship Module

Users, guardians, students and authorized relationships are owned as business relationships rather than client claims.

## 32. Operations Module

Drivers, vehicles, routes, services and assignments are owned by operational modules with clear scheduling boundaries.

## 33. Service Event Module

Pickup and drop-off events are owned by an operational event module that applies authorization and state transition rules.

## 34. Notification Module

Notification intent, policy evaluation and delivery tracking are separated from the originating business transition.

## 35. Audit Module

Audit capture is cross-cutting but protected from arbitrary client control; it records outcomes independently of notification delivery.

## 36. Authorization Boundary

Authorization is evaluated server-side at every protected command and sensitive read; user-interface visibility is not authorization evidence.

## 37. Parent Relationship Scope

Parent queries and actions SHALL be restricted to currently authorized student relationships and approved visibility policy.

## 38. Driver Assignment Scope

Driver operational data and event submission SHALL be restricted to the current, authorized assignment/service context.

## 39. School Role Scope

School Admin and Operator permissions remain distinguishable and tenant-bound; role names alone do not grant data access.

## 40. Super Admin Scope

Super Admin actions require explicit purpose, auditability and no implicit unrestricted child-record browsing.

## 41. Pickup Transaction Boundary

Pickup acceptance is one authoritative state transition, including business validation and durable audit intent; downstream notifications are asynchronous.

## 42. Drop-off Transaction Boundary

Drop-off acceptance follows the same boundary and SHALL not be reported as successful merely because a client or notification channel responded.

## 43. Event State Machine

Event transitions SHALL be explicit, validated against prior authoritative state and reject impossible or unauthorized state changes.

## 44. Idempotency

All retryable client commands and asynchronous consumers SHALL use idempotency identities and preserve a repeatable result where safe.

## 45. Ordering and Conflict Handling

Commands include causal/order metadata. The server detects stale or competing operations, preserves safety evidence and returns a recoverable outcome rather than silently last-writing.

## 46. Forged Event Resistance

Client-provided event data is untrusted; actor, tenant, assignment, relationship, temporal validity and allowed transition are verified server-side.

## 47. Offline Dataset Minimization

The offline dataset SHALL contain only information needed for assigned operations, be refreshed/revoked as policy changes and avoid unrelated child data.

## 48. Offline Replay Handling

Replay submissions are bounded by idempotency, authorization freshness and event validation; revoked or expired scope yields an explicit resolution state.

## 49. PostgreSQL Authority

PostgreSQL is authoritative for durable business state, authorization-relevant relationships, accepted events and audit commitments.

## 50. Transactional Outbox Candidate

Business acceptance and publication intent SHOULD be committed atomically through a transactional outbox pattern; exact implementation remains an ADR decision.

## 51. Outbox Delivery Semantics

Outbox processing is at-least-once and idempotent. Publication failure delays side effects but does not erase accepted business evidence.

## 52. Asynchronous Side-Effect Separation

FCM, exports, analytics and non-critical updates run outside the synchronous command path and cannot roll back an accepted safety event.

## 53. Redis Boundary

Redis is limited to transient cache, coordination/rate-limit support and queueing. It SHALL not be the only durable record of a business transition.

## 54. Cache Correctness

Cached data is invalidatable and time-bounded; protected commands and authorization decisions SHALL not trust stale client/cache state alone.

## 55. Current-State Read Model

Current operational state MAY be represented through query-optimized read models derived from authoritative transitions; it does not replace canonical event/business state.

## 56. Dashboard Eventual Consistency

Dashboards SHALL show refresh/status cues when derived views lag. Safety-sensitive commands rely on authoritative validation, not dashboard projection freshness.

## 57. Read-Model Recovery

Derived state must be rebuildable from authoritative records and have detectable lag/failure indicators.

## 58. Worker Architecture

Workers process outbox, notifications, projections and recovery jobs independently from request-serving application instances.

## 59. Queue Backpressure

Queue age, depth and failure rate SHALL be observed. Workers apply bounded retries and backpressure to prevent retry storms.

## 60. Dead-Letter and Recovery

Poisoned or repeatedly failing work is isolated for controlled investigation/replay with audit context; automatic replay is not unlimited.

## 61. Notification Failure Isolation

FCM failure, invalid tokens or provider delay SHALL not block event acceptance or compromise audit history.

## 62. Notification Privacy

Push payloads use minimum necessary information; an opened notification always revalidates current authorization before displaying data.

## 63. Stateless Backend

Application instances SHALL not rely on instance-local durable session or workflow state and can be replaced without business-data loss.

## 64. Horizontal Scaling

Load-balanced application and worker instances scale independently according to measured saturation, latency, queue age and database limits.

## 65. Database Scaling Path

Scaling starts with evidence-driven query/index/capacity work, connection control, read optimization and partitioning assessment before distributed persistence changes.

## 66. Burst Handling

Peak event bursts are absorbed by bounded command capacity and queued side effects; performance claims require benchmark evidence.

## 67. Rate Limiting

Rate limits are policy-driven by actor, tenant and operation risk, protect authentication and event ingestion, and log safe denial signals.

## 68. Availability Degradation

The platform communicates degraded/read-only/pending states clearly and preserves offline Driver continuity where product rules allow.

## 69. PostgreSQL Degradation

Database health loss stops unsafe writes, exposes operational alerts and avoids fabricated confirmation; recovery requires integrity checks.

## 70. Redis Outage Behavior

Redis loss degrades cache/queue-dependent features safely while PostgreSQL-backed authoritative operations follow explicitly defined resilience policy.

## 71. Worker Outage Behavior

Worker outage accumulates durable pending work with alerts; accepted transactions remain auditable and recoverable.

## 72. FCM Outage Behavior

Push delivery delay/failure is recorded and retried according to policy, without becoming a false business outcome.

## 73. Replica and Edge Failure

Load-balancer or application-instance failure routes only to healthy stateless instances; client retry remains idempotent.

## 74. Observability Signals

Required signals include command outcomes, authorization denials, idempotency collisions, transition conflicts, sync lag, queue age, projection lag, notification outcomes and database saturation.

## 75. Correlation and Audit Integrity

Correlation identifiers connect client sync, command, outbox, worker and notification outcomes. Audit integrity includes restricted write paths and tamper-evident operational controls.

## 76. Secret Management

Secrets are managed outside source code, rotated under controlled access and excluded from logs, notifications and diagnostic exports.

## 77. Threat and Abuse Controls

Architecture SHALL address BOLA/IDOR, tenant injection, privilege escalation, compromised devices, replay, queue abuse and sensitive-data leakage through layered controls.

## 78. Failure Injection and Testability

Architecture supports tests for duplicates, ordering, retries, authorization revocation during sync, provider failure, lag and partial infrastructure loss without needing production disruption.

## 79. Performance Validation

Scale targets are design references only. Load, soak, recovery and failure-mode benchmarks SHALL be planned and recorded before production claims.

## 80. Microservice Extraction Criteria

Extraction is evidence-based: sustained independently measurable scaling/ownership/deployment needs, demonstrated module boundary health and a cost/operability case. It is not triggered by projected scale alone.

## 81. Architecture Review Dispositions

Candidate ADR dispositions, specialist findings and rationale are maintained in the Phase 07 quality report and control-center logs.

## 82. Gate Evidence

Gate evidence consists of section reconciliation, independent architecture/security/QA review, quality scoring, documented dispositions and Commander approval. No claim of production benchmark validation is made before tests exist.

### Review-driven amendments

The architecture challenger found that the following are gate-required constraints: atomic business-state/audit/outbox intent; protected capacity for critical acceptance; bounded/deferred non-critical work; derived/rebuildable tenant-scoped read models; and explicit Redis-unavailable behavior. These are captured in sections 50–61.

Security review found no critical issue but recorded three High follow-ups: bounded offline authorization after revocation, protected audit integrity and session/device lifecycle policy. They SHALL be decided before implementation/security sign-off; they are not silently treated as completed by this architecture draft.

Offline authorization is policy-bounded: confirmed assignment, role or tenant revocation locks/purges relevant local scope when possible, while the server rejects and audits post-revocation submissions. Audit needs append-oriented integrity controls, restricted administration, accountable access/export, redaction and health/loss alerts. Session/device inventory, expiry/rotation, revocation propagation, suspicious-use signals and privileged re-authentication are mandatory security policy decisions. Critical acceptance is protected from non-critical workload; read models remain tenant-scoped, derived, rebuildable and non-authorizing; Redis loss cannot lose accepted business/audit state or alter authorization. Exact operational thresholds remain open.

### 82.1 Offline authority and revocation policy

Local capture is an evidence-preserving, provisional act; it is not server authorization. Server commit requires current authorization or an explicitly allowed historical authorization context validated from authoritative records. Account disablement, session/device revocation, Driver removal, tenant removal, service reassignment and student removal each remove future local authority as soon as the client learns the change and always remove server commit authority unless an explicit historical safety exception applies.

At sync, the backend SHALL revalidate tenant membership, actor status, device/session status where available, assignment, permitted student scope, transition and event context. A locally captured action that has become unauthorized is never silently discarded: it is retained as rejected evidence with reason category, correlation context and review pathway. The Driver sees a privacy-safe `NOT_ACCEPTED_REQUIRES_REVIEW` outcome, with no misleading confirmation. Maximum acceptable authorization staleness is a policy parameter to be approved before Driver production release, not invented here. The safety principle is to preserve evidence and escalate conflicts rather than fabricate acceptance or erase an event.

### 82.2 Audit-first integrity policy

Operational logs are not security/business audit records. Audit evidence SHALL be append-oriented, attributed to actor/system identity and tenant context, correlated to action/request/background work, and record trusted timestamp provenance. It includes privileged actions, authorization denials, security events, accepted/rejected offline events and audit-access/export events. Audit mutation is restricted to controlled integrity-preserving processes; privileged audit administration is segregated and observable. Tamper detection, audit-health/loss alerting and an explicit failure policy ensure downstream logging, queue or notification failure does not erase required audit intent. Retention, legal hold and exact verification duration remain compliance decisions. Audit exports/support access are permissioned, tenant-scoped, minimized and themselves audited.

### 82.3 Session and device lifecycle policy

The platform maintains a policy-level device/session lifecycle: registration, active state, logout, revocation, expiry/refresh invalidation, credential-compromise response, role/tenant change, replacement and lost/stolen-device response. Authorization uses the current authoritative status; a client cannot extend privilege through a cached session. A confirmed revocation triggers local scope restriction/purge when the client reconnects and server rejection/audit at any later sync. Privileged/risky actions require policy-defined reauthentication. These rules apply to Driver offline data, centralized authorization and audit evidence; token format and implementation mechanics are intentionally out of scope.

### 82.4 Notification dispatch revalidation

For sensitive notifications, the worker SHALL revalidate recipient eligibility, tenant/user status, relationship scope and privacy policy immediately before dispatch when asynchronous delay could outlive the original authorization context. If eligibility has changed, delivery is suppressed and the decision is auditable. Notification delivery remains non-authoritative: a committed transport event is not reversed by suppression, provider failure or invalid device token. Payload minimization applies at creation and dispatch.

### 82.5 Durable outbox and burst isolation policy

An accepted critical transaction durably commits business state, immutable/event evidence, audit intent/evidence and async publication intent as one authoritative commitment boundary. It does not depend on FCM, worker or Redis availability. If Redis is unavailable after commitment, durable pending work is recovered by workers once supporting infrastructure returns; no accepted transaction is lost or falsely retried as a new business action. Worker retry is bounded and idempotent; non-critical notification/export/projection work is backpressured, deferred or shed before it harms critical acceptance. Queue age, backlog, retry amplification, projection lag and notification-storm signals are monitored and escalated.

### 82.6 Restore and disaster-recovery responsibilities

Production operations SHALL own backup, protected backup access and tested restoration for authoritative PostgreSQL business/audit data, relevant object storage and configuration/secrets recovery boundaries. Redis is auxiliary/reconstructable and never sole recovery evidence. Read models are rebuildable from authoritative records; audit evidence is included in restoration verification. Recovery exercises verify integrity, authorization boundaries, audit availability and absence of duplicate asynchronous effects. Exact RPO/RTO, storage retention and regional topology remain business/compliance decisions and are not assigned numeric values here.

### 82.7 Audit integrity verification and escalation boundary

Audit integrity is a separate architecture responsibility, not an operational-log feature. Required audit records form ordered, tamper-evident evidence with independently controlled integrity-verification checkpoints. Business, School and Super Admin roles cannot alter or delete audit evidence through normal administration; exceptional governed retention activity is a restricted break-glass process and produces its own audit evidence. Audit investigation/read access is separately authorized, tenant-scoped where applicable and export-accountable.

The authoritative business transition commits required audit intent independently of downstream verifier, worker, Redis or notification availability. Integrity-verifier delay/failure creates durable pending verification work, health telemetry and security escalation; it must never silently erase, overwrite or reclassify audit evidence. The security/operations owner investigates verification mismatches and recovery preserves original evidence plus recovery actions. The exact storage layout, cryptographic algorithm and retention duration are deferred to later approved design/compliance decisions; this architecture policy is the invariant that those designs must preserve.

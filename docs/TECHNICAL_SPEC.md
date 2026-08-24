# Technical Specification

## 1. Document Control
Phase 11 technical specification; implementation forbidden.
## 2. Purpose
Defines implementation-ready boundaries from approved specifications.
## 3. Scope
No source, migrations, dependencies, infrastructure, or deployment artifacts.
## 4. Technical Principles
Backend authority; clients/cache/read models are not authority.
## 5. System Overview
Android, web dashboards, backend, workers, PostgreSQL, Redis and FCM boundaries.
## 6. Architecture Summary
Stateless modular monolith with canonical PostgreSQL and asynchronous outbox.
## 7. Component Boundaries
Each component owns only its approved responsibility and data exposure.
## 8. Backend Architecture
NestJS TypeScript modular monolith.
## 9. Backend Module Structure
Modules align to approved product domains.
## 10. Module Dependency Rules
Dependencies are explicit, acyclic, and respect ownership.
## 11. Domain Ownership
Each domain owns its rules; no duplicated client business authority.
## 12. Android Architecture
Kotlin, Compose, Room, WorkManager and offline-first direction.
## 13. Driver Application Architecture
Assignment-bound, minimal-data, provisional offline capture.
## 14. Parent Application Architecture
Relationship-bound, privacy-minimized status and notification handling.
## 15. Offline Architecture
Local evidence is provisional; server commit is authoritative.
## 16. Local Storage Responsibilities
Store minimum queue/state needed for approved offline workflow.
## 17. Sync Engine Design
Ordered per-item reconciliation, retry, idempotency and safe outcomes.
## 18. Conflict Resolution Strategy
Server authoritative state/version yields explicit reconciliation outcomes.
## 19. Web Architecture
Next.js, React, TypeScript dashboard direction.
## 20. Dashboard Architecture
Scoped read models with visible freshness/degradation.
## 21. Frontend State Responsibilities
UI state is not business authority.
## 22. API Consumption Rules
Consume versioned REST/JSON contracts and stable errors.
## 23. Backend Runtime Model
Stateless request services; durable state in canonical stores.
## 24. Worker Architecture
Least-privilege workers process durable outbox intent only.
## 25. Queue Processing Model
Idempotent, leased, auditable, tenant-context-recomputed work.
## 26. Notification Processing Model
Dispatch is non-authoritative and revalidates recipient eligibility.
## 27. Event Architecture
Domain event, audit and outbox responsibilities are distinct.
## 28. Domain Event Rules
Critical event transitions are canonical, ordered, and auditable.
## 29. Transaction Boundary Rules
Critical state, audit and outbox intent commit atomically.
## 30. Database Access Principles
Least privilege and tenant integrity support application authorization.
## 31. PostgreSQL Usage Rules
PostgreSQL is canonical source of truth.
## 32. Read Model Rules
Read models are rebuildable and never authorize.
## 33. Cache Rules
Cache is non-canonical, scoped and revocation-aware.
## 34. Redis Boundary
Redis is auxiliary, restricted, and never authorization source.
## 35. Storage Rules
Sensitive artifacts remain private and disabled absent approved contract.
## 36. Security Implementation Mapping
Phase 10 controls are mandatory implementation gates.
## 37. Authentication Implementation Requirements
Implement approved lifecycle behavior without selecting unapproved mechanisms.
## 38. Authorization Implementation Requirements
Enforce role, tenant, resource, relationship and assignment scope.
## 39. Tenant Isolation Implementation Requirements
Derive tenant scope and use defense in depth.
## 40. Audit Implementation Requirements
Preserve append-oriented evidence and verifier separation.
## 41. Logging Requirements
Privacy-safe operational logs are not audit records.
## 42. Observability Requirements
Correlation, metrics, tracing and safe security signals are required.
## 43. Metrics Requirements
Metrics are privacy-safe aggregates.
## 44. Tracing Requirements
Trace critical requests through transaction and worker lifecycle.
## 45. Failure Handling
Never fabricate success during degradation.
## 46. Retry Rules
Retries preserve idempotency and bounded behavior.
## 47. Idempotency Implementation Rules
Current authorization precedes protected replay.
## 48. Offline Sync Technical Rules
Per-item ordered reconciliation and no silent discard.
## 49. Mobile Reliability Rules
Show pending, committed, rejected and conflict states safely.
## 50. Dashboard Consistency Rules
Expose as-of/freshness for derived reads.
## 51. Notification Reliability Rules
Failure does not undo committed business state.
## 52. Data Migration Principles
Future migrations preserve tenant, audit, idempotency and recovery invariants.
## 53. Configuration Management
Configuration is environment-scoped and secret-safe.
## 54. Environment Separation
Development, testing and production are isolated.
## 55. Development Environment
No production credentials or data in ordinary workflows.
## 56. Testing Environment
Use controlled/synthetic sensitive data.
## 57. Production Environment
Requires approved operational and security gates.
## 58. CI/CD Technical Expectations
Protected, auditable releases and artifact integrity.
## 59. Repository Structure Principles
Structure follows surfaces/modules without premature microservices.
## 60. Branching Strategy
Controlled reviewable changes; exact workflow remains approved policy.
## 61. Code Ownership Principles
Ownership aligns to domain and privileged boundaries.
## 62. Documentation Requirements
Contract and decision changes update linked documentation.
## 63. Feature Development Rules
Features preserve approved invariants.
## 64. Vertical Slice Implementation Rules
Deliver thin end-to-end slices with contract/security/test evidence.
## 65. Testing Requirements
Unit, integration, contract and regression tests are required future evidence.
## 66. Security Testing Requirements
Execute Phase 10 acceptance matrix before affected capability release.
## 67. Performance Testing Requirements
Test scale/failure assumptions before production claims.
## 68. Failure Testing Requirements
Test outage, retry, revocation and recovery paths.
## 69. Backup and Recovery Technical Expectations
Protected backups and verified restores preserve integrity.
## 70. Disaster Recovery Expectations
Recovery validates canonical data, audit and rebuildable reads.
## 71. Scaling Strategy
Scale stateless services, workers and derived reads from evidence.
## 72. Horizontal Scaling
Requests remain stateless; coordination uses canonical contracts.
## 73. Database Scaling Considerations
Preserve tenant and uniqueness invariants.
## 74. Worker Scaling
Protect critical work from burst/retry overload.
## 75. Queue Scaling
Use idempotent consumers and lease/recovery rules.
## 76. Read Model Scaling
Rebuildable projections expose freshness.
## 77. Multi-Tenant Scaling
Isolation correctness precedes aggregation efficiency.
## 78. Cost Awareness
Measure before optimization; no unsupported targets.
## 79. Technical Risks
Deferred security, policy and scale decisions remain visible.
## 80. Technical Assumptions
Approved stack directions are constraints, not implementations.
## 81. Open Technical Questions
Track deferred session, storage, retention and enforcement decisions.
## 82. Technical ADR Review
TECH-ADR-001 through 010 are candidate decisions tied to approved ADRs.
## 83. Implementation Gates
No implementation before explicit Phase authorization and security gates.
## 84. Engineering Standards
Type-safe, reviewable, observable, privacy-safe engineering is required.
## 85. Quality Standards
Evidence, tests and traceability govern readiness.
## 86. Release Readiness
Release requires approved functional, security and operational evidence.
## 87. Operational Readiness
Ownership, monitoring, recovery and support boundaries are required.
## 88. Support Readiness
Least-privilege, auditable, purpose-bound support only.
## 89. Security Gate Mapping
Map implementation to SECURITY.md acceptance and deferred-policy gates.
## 90. API Gate Mapping
Map contracts to API version/error/idempotency/authorization rules.
## 91. Database Gate Mapping
Map persistence to canonical, integrity, outbox and audit rules.
## 92. UX Gate Mapping
Map technical outcomes to pending, freshness and degraded UX states.
## 93. QA Gate Mapping
Map future tests to negative, sync, failure and regression scenarios.
## 94. Traceability Matrix
Trace requirement to architecture, database, API, security, UX and test.
## 95. Known Limitations
No runtime effectiveness or compliance evidence exists in this phase.
## 96. Future Evolution Path
Extract services only on measured domain/operational evidence.
## 97. Microservice Extraction Criteria
Use evidence-based boundaries; avoid premature extraction.
## 98. Technical Audit Appendix
Sources are approved documents and Commander decisions.
## 99. Phase Gate Checklist
Validate 100 sections, reviews, traceability and no implementation artifacts.
## 100. Final Technical Specification Summary
The approved technical direction is modular, authoritative-server, offline-aware, auditable, and implementation-gated.

### 100.1 Module Ownership and Dependency Contract

| Module | Owns | Commands/transactions | Reads/events | Allowed dependencies | Forbidden |
|---|---|---|---|---|---|
| Identity & Access | identities, memberships, sessions | auth, revoke, membership changes | safe user context/security events | audit, tenant policy | operational state ownership |
| Tenant & School | tenant/school lifecycle | scoped administration | tenant context events | identity, audit | client tenant authority |
| Student & Relationship | students, guardians, links | relationship lifecycle | parent-safe reads | tenant, audit | Parent authorization bypass |
| Fleet & Planning | drivers, vehicles, routes, services, assignments | lifecycle/assignment changes | assignment events | tenant, audit | transport transition ownership |
| Transport Operations | canonical event/current state | pickup/drop-off atomic transaction | operational read/event/outbox | assignment policy, audit | direct notification delivery |
| Notification | dispatch eligibility/preferences | dispatch work only | outbox intents | identity/relationship revalidation | business state mutation |
| Audit | evidence/checkpoints | append evidence | privileged queries | none for authorization | business decision ownership |

Commands are handled by their owner; reads use owner-approved current/read models; internal events communicate committed facts only. Modules may not reach into another module's storage or recreate its authorization, transaction, audit, or outbox rules.

### 100.2 Critical Offline Operation Allocation

Driver capture creates a minimized local queue item `{client_event_id, service_instance, student, intent, occurred_at, known_version}` and an idempotency identity; it is provisional. The sync engine partitions ordered dependent work by student/service, sends bounded batches, preserves each item identity and original sequence, and retains response-loss retry identity. Backend first authenticates/rechecks tenant, account, session, assignment, transition and current authorization; then validates fingerprint/idempotency and known version; then commits canonical event/current state/audit/outbox intent atomically. Batch replies echo per-item identity and committed/replayed/rejected/conflict result. A rejected item has no durable effect and is not silently discarded; a dependent drop-off cannot succeed after invalid pickup. Historical-authority exception is disabled until an approved policy.

### 100.3 Security Enforcement Topology

API boundary validates media/shape/correlation and authenticates. Authorization policy boundary derives tenant, role, relationship/assignment and resource/action/field scope before domain command/read. Domain owner revalidates transition and authority-relevant invariants; data access enforces same-tenant references where expressible. Audit boundary records critical/privileged outcome in the canonical transaction; outbox/worker boundaries recompute canonical tenant/target context and cannot create authority. Cache/read model lookup follows authorization-shaped query and never authorizes. Safe-not-found selection occurs at the protected resource boundary; writable DTOs are allowlisted and reject ownership/tenant/role fields.

### 100.4 API Implementation Contract Matrix

| Family | Client responsibility | Backend responsibility | Test evidence |
|---|---|---|---|
| Auth/session | preserve session/device context; react safely to revoke | stable 401/deny lifecycle and current authorization | lifecycle/revocation contract tests |
| Critical transport | bind idempotency key/client event/known version; reconcile per item | §100.2 canonical sequence and stable errors | retry/replay/transition tests |
| Parent/dashboard | use linked/scoped resource, surface freshness | relationship authorization, minimization, safe errors | foreign-ID/freshness tests |
| Collections | opaque cursor/filter/sort only | scope-bound cursor/allowlists/expiry | cursor transplant/filter tests |

JSON version compatibility is additive where approved; clients tolerate unknown additive fields/enums. DTO/schema validation owns request shape; domain owns business validity. `202` is only explicitly deferred work; `204` has no body; media/size/error behavior follows API.md.

### 100.5 Test, Release, and Operations Allocation

| Layer | Required scenarios | Evidence / release gate |
|---|---|---|
| Unit/domain | transitions, idempotency fingerprint, authorization inputs | owner tests |
| Integration/database | tenant references, atomic state/audit/outbox, leases/reaper | integration evidence |
| Contract/API | version/errors/media/cursors/DTO allowlists | consumer/provider contract evidence |
| Mobile sync | queue order, duplicate, response loss, revoke/conflict | device/sync evidence |
| Security | SEC-TEST-AUTHZ/TENANT/REVOKE/REPLAY/AUDIT/DATA | Phase 10 acceptance execution |
| Operations | correlation propagation, worker dead-letter/reaper, backup/restore, alert escalation | runbook/recovery evidence |

Critical alerts have named operational ownership and escalation policy before production; exact thresholds are deferred policy. Release/migration follows expand, backfill, verify, contract/cleanup sequencing where data change is authorized; rollback/feature exposure cannot violate audit, tenant, idempotency or offline invariants. Deferred-policy register: session lifecycle, offline exception, tenant DB enforcement option, retention/jurisdiction, key management, break-glass, exports and operational thresholds block the affected capability, not documentation.

### 100.6 Technical Decision Register

TECH-ADR-001 Modular monolith boundaries; 002 domain module ownership; 003 backend transaction ownership; 004 event/outbox boundary; 005 worker responsibility; 006 offline sync principles; 007 read-model ownership; 008 cache boundary; 009 authorization placement; 010 audit boundary are ACCEPT_CANDIDATE because they implement already approved Architecture/API/Database/Security constraints. They introduce no new infrastructure or code selection; deferred policies in §100.5 remain DEFER.

### 100.7 Android and Web Surface Contracts

Driver local records are minimized to assigned-service/roster snapshot, queue item identity, provisional state and safe diagnostics; logout, device/session revoke, assignment removal and approved expiry trigger purge/lock according to Phase 10 policy. Room owns local queue durability; WorkManager schedules bounded background sync only when platform constraints permit; connectivity never confirms business state. Local state transitions are `PENDING → COMMITTED|REPLAYED|REJECTED|CONFLICT`; each maps directly to API item disposition, UX pending/recovery state, safe telemetry and retry rule. Synthetic child data is required for test fixtures.

Web server-side data access derives session/tenant/role before query shaping; browser state cannot widen scope. Cache keys include authorized scope and filters; broad responses cannot serve narrower actors. Deep links, routes, filters, cursor/search and export/audit views reauthorize; unknown/forbidden states preserve API safe-deny behavior. Dashboard renderers expose freshness/stale/degraded state, never use read-model/cache as authority, and do not enable routine child browsing or object upload/download without approved contract. Client logs, analytics, crash reporting, screenshots/shared-screen guidance, notification deep links and support views exclude/minimize child, token and session data.

### 100.8 Worker, Cache, Scale, and Recovery Contract

Worker types are notification dispatcher, projection builder, outbox recovery/reaper, and audit verifier. Each has distinct identity/ACL, durable-outbox-only input, schema/version validation, canonical tenant/target recomputation, bounded payload, idempotent consumer identity, lease/reaper/dead-letter ownership and audited manual replay. Notification worker revalidates recipient at dispatch. Cache/read-model requires authorized query shaping before lookup, tenant keying, minimized fields, revocation invalidation/revalidation, explicit freshness, and canonical fallback for critical authorization/transport state; Redis failure never changes authorization or canonical outcome.

Operationally, critical write capacity is protected while reports/notifications/projections may be deferred or shed without fabricating outcome. Correlation fields flow API→domain→transaction→audit→outbox→worker. Restore quarantines notification side effects until canonical/audit/checkpoint verification and rebuildable projections complete; no duplicate side effect is permitted. Database hot-path/index and partition decisions require evidence review before activation; numeric thresholds remain deferred.

### 100.9 Technical Traceability and Release Matrix

| Source requirement | Technical mechanism | Verification / owner | Release gate |
|---|---|---|---|
| API critical write/idempotency | §100.2 canonical sequence | integration/contract owner | transport capability |
| DB tenant/state/outbox/audit | §§100.1–100.3,100.8 | database/integration owner | backend capability |
| Security acceptance matrix | §100.5 security layer | security/QA owner | affected sensitive surface |
| UX offline/freshness | §§100.2,100.7 | Android/Web QA owner | client surface |
| Worker/cache/recovery | §100.8 | operations/integration owner | async/read capability |

No release may rely on this design-only matrix as executed evidence. Deferred decisions record owner and must-resolve-before gate: session/device policy (security/identity), historical offline exception (Commander/security), tenant DB enforcement/RLS choice (architecture/database), audit verifier and key management (security/operations), retention/jurisdiction/exports/break-glass (Manager/legal/security). 

# Discovery Document

## 1. Document Control

- Phase: 01 — Discovery
- Status: Commander Review
- Gate recommendation: `PASS_WITH_NON_BLOCKING_OPEN_QUESTIONS`
- ZIP status: not independently verified; no claim below is attributed to the ZIP.
- Repository status: workspace is not an initialized Git repository.

## 2. Executive Summary

The project is a multi-tenant school transportation platform beginning with a bounded pilot and designed to grow toward approximately 1M+ students. It coordinates drivers, parents, schools and platform administrators around reliable Pickup/Drop-off events, auditability, secure access, offline operation and asynchronous notifications.

## 3. Vision

Provide a secure, reliable and scalable platform connecting drivers, parents, schools and platform administrators with trustworthy transportation status and operational visibility.

## 4. Problem Statement

Discovery sources identify unreliable parent visibility, manual communication, weak Pickup/Drop-off records, missing audit trails, difficult fleet/route operations, poor school visibility, unstable connectivity and inadequate scale readiness as core problems.

## 5. Product Goals

- Manage schools, students, parents, drivers, vehicles, routes and services.
- Record Pickup and Drop-off events reliably.
- Notify parents and update school operational views.
- Protect sensitive child and transportation data.
- Start with a pilot without requiring fundamental redesign for growth.

## 6. Pilot Scope

- Driver app: authentication, assigned services, route students, Pickup/Drop-off, offline operation and synchronization.
- Parent app: authentication, linked students, service status, notifications and limited event history.
- School dashboard: students, parents, drivers, vehicles, routes, daily events and reports.
- Super-admin dashboard: tenant, school, privileged-user and audit oversight.
- Exact pilot size, geography and rollout policy remain open.

## 7. Actors

- Student: transportation subject and sensitive-data entity.
- Parent: receives updates and accesses linked students only.
- Driver: performs operational route actions, including offline actions.
- School Admin: administrative/configuration responsibility.
- School Operator: day-to-day transportation operations.
- Super Admin: platform-level tenant, security and oversight responsibility.

The precise permission matrix is deferred to Phase 03.

## 8. Core Business Flows

Driver opens route → selects student → records `PICKED_UP` or `DROPPED_OFF` locally → pending sync queue → server validation → database transaction → event creation → audit record → notification queue → parent notification → dashboard update.

Domain validation must prevent invalid event ordering.

## 9. Confirmed Architecture Principles

- Modular Monolith first.
- Stateless backend and horizontal-scaling readiness.
- Multi-tenant isolation.
- Event-driven critical operations.
- Async notification processing.
- Idempotent critical writes.
- Audit-first design.
- No unnecessary microservices in MVP.
- No performance claim without benchmark/load-test evidence.

## 10. Offline Requirements

- Driver operation is Offline First.
- Durable local storage and pending queue are required.
- Retry occurs when connectivity returns.
- Important operations carry `client_event_id` or an equivalent idempotency key.
- Server validation and idempotent commit are required.
- Conflict algorithm, ordering policy and stale-state handling are deferred to later phases.

## 11. Security Discovery

Required directions: RBAC, tenant isolation, deny-by-default, least privilege, JWT and refresh-token controls, device-session management, rate limiting, input validation, IDOR/BOLA protection, secret management, audit logging and sensitive child-data protection.

## 12. Data & Audit Requirements

Student identity, relationships, transportation history and any location data are sensitive. Transport events should be audit-friendly, append-oriented and partition-ready. Dashboards should use current state/read models/aggregation instead of scanning all historical events. Retention duration is TBD.

## 13. Scale Targets

- Architectural growth: Pilot → 10K → 100K → 500K → approximately 1M+ students.
- Future workload: approximately 2M business events/day.
- Peak design envelope: 1000–5000 events/sec.

These are capacity targets, not performance proof.

## 14. Non-Functional Requirements

- Reliability: idempotent writes, retry and transaction safety.
- Availability: stateless and horizontally scalable direction; numerical SLA is TBD.
- Security: controls in Section 11.
- Performance: validate only through benchmark/load testing.
- Offline resilience: durable local operation and eventual synchronization.
- Observability: audit and operational visibility.

## 15. Risks

- Offline synchronization conflicts and ordering — High.
- Sensitive child-data exposure — Critical.
- Pilot-to-scale transition — High.
- Undefined jurisdiction and retention — High.
- Exceptional transportation flows — Medium/High until specified.

## 16. Known Constraints

- No backend, Android, web, database or infrastructure implementation is authorized.
- No schema, API contract or dependency is finalized here.
- Master Pipeline ZIP is an environment gap and was not read.
- Continuous GPS, route telemetry and permanent location history must not be assumed.
- Current workspace is not an initialized Git repository.

## 17. Assumptions

- Conversation Master Context and Discovery Draft are the available temporary sources.
- School Admin and School Operator are distinct at Discovery level.
- Push is an identified notification direction; other channels are not assumed.
- Approximately 2M events/day is canonical by Commander decision.

## 18. Open Questions

1. Target jurisdiction and compliance regime?
2. Exact pilot sizing, geography and rollout policy?
3. Final School Admin/Operator permission matrix?
4. Continuous GPS versus event-location-only?
5. Data retention and deletion policy?
6. Offline conflict, ordering and stale-state policy?
7. SLA/SLO/RTO/RPO targets?
8. Notification channels beyond Push?
9. Driver shift/session requirements?
10. Exceptional transportation flows and state transitions?

Commander classifies these as non-blocking for PRD entry.

## 19. Candidate ADRs

- ADR-001 Modular Monolith first.
- ADR-002 Multi-tenant isolation and deny-by-default.
- ADR-003 Event/Audit-first transportation operations.
- ADR-004 Offline-first synchronization with idempotency.
- ADR-005 Asynchronous notification processing.
- ADR-006 Stateless horizontal-scaling direction.
- ADR-007 Current-state/read-model dashboard strategy.
- ADR-008 Benchmark-only performance claims.
- ADR-009 Sensitive child-data protection.

## 20. Evidence Provenance

- `DIRECT_MANAGER_DECISION`: project roles and governance expectations.
- `COMMANDER_DECISION`: canonical scale, role distinction, Gate recommendation and deferred questions.
- `CONVERSATION_SOURCE`: Master Context, architecture principles, security direction, product scope and Discovery Draft.
- `MASTER_PIPELINE_SOURCE`: UNKNOWN; ZIP was not accessible and is not cited as verified.
- `ASSUMPTION`: only items explicitly identified in Section 17.

## 21. Discovery Exit Criteria

Vision, problem, actors, pilot scope, core flow, architecture/security/scale directions, risks, open questions and provenance are recorded. No unverified ZIP claim or implementation is included.

## 22. Gate Decision

Recommendation: `PASS_WITH_NON_BLOCKING_OPEN_QUESTIONS`.

Formal Commander approval remains pending. Phase 02 PRD remains locked.

## Audit Appendix

- Sources used: conversation Master Context, conversation Discovery Draft, Commander decisions and direct manager instructions.
- Conflicts normalized: scale variants, School Admin/Operator naming and superseded `READY_FOR_PRD` draft status.
- Gaps: unreadable ZIP, absent initialized Git repository, jurisdiction, pilot detail, retention, GPS scope, permissions, offline conflict policy and SLA targets.
- No `VERIFIED_FROM_ZIP` claim is made.


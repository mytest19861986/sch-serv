# Product Requirements Document — School Transportation Management Platform

## 1. Document Control

- Phase: 02 — PRD
- Status: Draft / Commander Review
- Mode: Product specification only
- Implementation: Forbidden in this phase
- Source priority: direct manager decisions, approved Discovery, Project Control Center, approved architecture principles, verified Master Pipeline content only.

## 2. Product Summary

A multi-tenant platform for schools to coordinate student transportation, route operations, Pickup/Drop-off events, parent notifications and operational oversight.

## 3. Product Vision

Make school transportation status trustworthy, auditable and accessible to the right parent, driver, school and platform operator even when connectivity is unreliable.

## 4. Problem Statement

Parents lack reliable status visibility; schools rely on manual coordination; Pickup/Drop-off records and audit trails are inconsistent; drivers operate under poor connectivity; and existing processes are difficult to scale safely.

## 5. Business Objectives

- Reduce uncertainty around student transportation events.
- Give schools operational visibility without exposing unrelated tenant data.
- Reduce manual coordination and notification delays.
- Establish a pilot foundation that can grow without fundamental redesign.

## 6. Product Goals

- G-01: Enable authorized drivers to record valid Pickup/Drop-off events.
- G-02: Enable linked parents to see truthful service status and receive notifications.
- G-03: Enable school operators to manage daily transport operations.
- G-04: Preserve auditability and tenant isolation for sensitive child data.
- G-05: Support durable offline driver work and later synchronization.

## 7. Success Metrics

- M-01: Percentage of valid pilot events accepted without duplicate business effects.
- M-02: Percentage of linked parents receiving a truthful event notification.
- M-03: Percentage of daily operational events visible to authorized school staff.
- M-04: Offline events eventually synchronized without duplicate effects.
- M-05: Unauthorized cross-tenant access attempts are denied and audited.
- M-06: Pilot task completion and parent/driver support feedback meet manager-approved thresholds (thresholds TBD; no invented numbers).

## 8. Actors

Student, Parent, Driver, School Admin, School Operator and Super Admin. School Admin owns administrative/configuration work; School Operator owns daily transportation operations. Detailed permissions are deferred to Phase 03.

## 9. Product Surfaces

- Driver Android App: route execution, student list, event capture, offline queue and sync status.
- Parent Android App: linked students, service status, event history and notifications.
- School Dashboard: daily operations, management views, event status and reports.
- Super Admin Dashboard: tenant/school administration, privileged users, audit and platform oversight.
- Backend Platform: authentication, authorization, validation, event processing, synchronization, notifications and audit services. This is a product boundary, not an API or schema design.

## 10. Pilot Scope

Authentication; tenant/school setup; core users; student-parent relationships; driver assignments; vehicles/routes/services; Driver Pickup/Drop-off; offline capture and sync; parent notifications; school daily dashboard; basic super-admin oversight. Exact pilot sizing and rollout remain open.

## 11. MVP Scope

The Pilot capabilities above, with truthful loading, empty, unauthorized, failure and degraded states. MVP excludes unapproved advanced analytics, continuous GPS and marketplace behavior.

## 12. Out of Scope

Continuous live GPS tracking, permanent route telemetry, predictive analytics, automated routing optimization, payments, marketplace functions, SMS/WhatsApp commitments, biometric attendance, schema/API design, implementation dependencies and production deployment.

## 13. Functional Requirements

### Authentication

- FR-AUTH-01 SHALL authenticate users through an approved identity flow.
- FR-AUTH-02 SHALL enforce session/device controls and deny unauthorized access.
- FR-AUTH-03 SHALL provide truthful authentication, expiry and recovery states.

### Tenant / School

- FR-TEN-01 SHALL associate each school operation with exactly one authorized tenant context.
- FR-TEN-02 SHALL prevent users from viewing or changing unrelated tenant data.
- FR-TEN-03 SHOULD support school configuration without exposing platform-wide controls.

### Users, Students and Parents

- FR-USER-01 SHALL represent authorized user roles and status.
- FR-STU-01 SHALL associate a student with an authorized school context.
- FR-PAR-01 SHALL expose a student to a parent only through an authorized relationship.
- FR-PAR-02 SHALL support a parent viewing all and only their linked students.

### Drivers, Vehicles, Routes, Services and Assignments

- FR-DRV-01 SHALL show a driver only their authorized assignments.
- FR-VEH-01 SHALL support vehicle identity and operational assignment information.
- FR-ROU-01 SHALL support an ordered service route and its students.
- FR-SVC-01 SHALL represent a transport service/day context.
- FR-ASG-01 SHALL prevent ambiguous or unauthorized driver/vehicle/route assignments.

### Pickup and Drop-off

- FR-PICK-01 SHALL allow an authorized driver to record a Pickup for an assigned student.
- FR-DROP-01 SHALL allow an authorized driver to record a Drop-off for an assigned student.
- FR-EVT-01 SHALL reject impossible or duplicate business transitions and show a truthful result.
- FR-EVT-02 SHALL make event status visible to authorized parent and school surfaces.

### Offline Sync

- FR-OFF-01 SHALL allow durable local capture when connectivity is unavailable.
- FR-OFF-02 SHALL show pending, synchronized, failed and retry states.
- FR-OFF-03 SHALL retry safely and avoid duplicate business effects.
- FR-OFF-04 SHALL preserve the original event identity for reconciliation.

### Notifications

- FR-NOT-01 SHOULD notify linked parents after accepted Pickup/Drop-off events.
- FR-NOT-02 SHALL not claim delivery when delivery is unknown or failed.
- FR-NOT-03 SHALL avoid revealing unrelated student or tenant information.

### Dashboards and Administration

- FR-DASH-01 SHALL show authorized daily service status and truthful empty/error states.
- FR-DASH-02 SHOULD support operational filtering without cross-tenant leakage.
- FR-ADMIN-01 SHALL restrict platform administration to Super Admin authority.
- FR-ADMIN-02 SHALL expose audit and configuration actions according to role.

## 14. Core Business Rules

- BR-01: A user may act only within an authorized tenant and role context.
- BR-02: A driver may act only on an active authorized assignment.
- BR-03: Pickup must precede Drop-off for the same service/student unless an explicitly approved exception exists.
- BR-04: A business event has one client identity and must be idempotent.
- BR-05: Parent visibility is limited to linked students.
- BR-06: Invalid, duplicate, unauthorized and uncertain states must fail closed and be auditable.

## 15. Pickup Requirements

Pickup SHALL be explicit, attributable to the driver/service/student, resilient to temporary connectivity loss, visibly pending until accepted, and followed by a truthful parent/school status update.

## 16. Drop-off Requirements

Drop-off SHALL follow the same attribution, offline, validation, idempotency, audit and notification rules as Pickup and SHALL not silently bypass ordering rules.

## 17. Offline Requirements

Offline is a first-class Driver workflow. The app SHALL preserve user intent locally, show synchronization state, retry within bounded behavior, avoid duplicate effects, and surface conflicts or permanent failure for operational follow-up. It SHALL not fabricate server acceptance while offline.

## 18. Notification Requirements

Notifications SHALL be event-specific, tenant-safe, linked-recipient-only, truthful about acceptance/delivery state and resilient to retry. Push is the identified initial direction; other channels are a future decision.

## 19. Dashboard Requirements

Dashboards SHALL show current operational state, authorized daily events, loading/empty/forbidden/error states and auditable timestamps or status context where available. They SHALL not present fixture or inferred academic data as real transport data.

## 20. Administration Requirements

Super Admin SHALL manage platform-level tenants/schools and privileged access. School Admin and School Operator capabilities SHALL remain separated conceptually until the Phase 03 permission matrix is approved.

## 21. Security and Privacy Requirements

- SEC-01 SHALL enforce deny-by-default, least privilege, RBAC and tenant isolation.
- SEC-02 SHALL protect child identity, relationships, transportation history and location data as sensitive.
- SEC-03 SHALL validate input and protect against IDOR/BOLA and equivalent authorization failures.
- SEC-04 SHALL manage sessions, refresh behavior, rate limits and secrets through approved controls.
- SEC-05 SHALL audit sensitive reads, writes, authorization failures and administrative actions.
- SEC-06 SHALL minimize notification and UI data exposure.

## 22. Non-Functional Requirements

- NFR-01 Reliability: critical writes SHALL be idempotent and retry-safe.
- NFR-02 Availability: product direction SHALL support stateless horizontal growth; numeric SLA is TBD.
- NFR-03 Scalability: product boundaries SHALL support the approved scale targets without a fundamental redesign assumption.
- NFR-04 Observability: operational failures, sync state and security events SHOULD be diagnosable.
- NFR-05 Auditability: sensitive business and administrative actions SHALL be attributable.
- NFR-06 Maintainability: domains and responsibilities SHOULD remain independently understandable.
- NFR-07 Accessibility: user-facing surfaces SHOULD provide readable states, clear errors, keyboard/screen-reader support where applicable and sufficient contrast.
- NFR-08 Performance: no target is considered proven without benchmark/load-test evidence.

## 23. Availability and Reliability Expectations

The product SHALL fail closed for uncertain authorization, tenant context or event acceptance; preserve local intent during temporary outage; expose degraded state; and avoid claiming notification or server acceptance that was not confirmed. SLA/SLO/RTO/RPO values are future decisions.

## 24. Scale Targets

Pilot → 10K → 100K → 500K → approximately 1M+ students; approximately 2M business events/day; design envelope 1000–5000 events/sec. These are architecture targets only.

## 25. Audit Requirements

The product SHALL retain an attributable audit trail for critical event transitions, authorization failures, sensitive access, administrative changes and synchronization outcomes. Retention duration is TBD by jurisdiction and approved policy.

## 26. Error and Degraded Modes

Required truthful states include unauthenticated, forbidden, invalid assignment, unavailable service, offline pending, sync retrying, sync failed, duplicate/invalid transition, notification unknown/failed and empty operational data. The product SHALL preserve safety and privacy while degraded.

## 27. Data Retention Questions

Jurisdiction, child-data retention, event/audit retention, deletion/legal-hold rules and parent access history remain undecided. No numerical retention period is introduced here.

## 28. Dependencies

Product dependencies include identity/session capability, tenant and school authority, mobile connectivity recovery, notification delivery capability, operational staffing and approved compliance decisions. Implementation libraries and infrastructure choices are intentionally not selected here.

## 29. Risks

Offline ordering/conflict, sensitive child-data exposure, scale transition, undefined jurisdiction/retention, notification uncertainty, unclear role boundaries and exceptional transportation flows.

## 30. Assumptions

- Discovery conversation is the available authoritative product context.
- ZIP content is not independently verified.
- School Admin and School Operator are distinct concepts pending Phase 03 permissions.
- Push is initial notification direction, not an exclusive final commitment.
- Scale values are Commander-approved architecture targets.

## 31. Open Questions

OQ-01 jurisdiction/compliance; OQ-02 pilot size/geography/rollout; OQ-03 role permission matrix; OQ-04 GPS scope; OQ-05 retention; OQ-06 offline conflict/order; OQ-07 SLA/SLO/RTO/RPO; OQ-08 non-Push channels; OQ-09 driver shift/session; OQ-10 exceptional flows. Jurisdiction, retention and SLA/SLO/RTO/RPO are high-priority future decisions but non-blocking for this PRD draft; all others are non-blocking unless manager reclassifies them.

## 32. Acceptance Criteria

- AC-01: Pilot actors and surfaces are explicit.
- AC-02: Functional requirements cover all requested domains.
- AC-03: Tenant isolation and child-data privacy are explicit.
- AC-04: Offline Driver behavior is first-class.
- AC-05: Pickup/Drop-off rules and degraded states are explicit.
- AC-06: Scale targets are stated without benchmark claims.
- AC-07: Open questions, assumptions, risks and provenance are separated.
- AC-08: No schema, endpoint, code, migration or dependency is specified.

## 33. Future Capabilities

Continuous GPS, advanced analytics, route optimization, additional notification channels, richer exceptional flows, payments and marketplace capabilities require separate approval.

## 34. PRD Gate Checklist

- [x] Product vision and goals.
- [x] Pilot, MVP and out-of-scope boundaries.
- [x] Product surfaces and functional domains.
- [x] Security, privacy, tenant isolation and auditability.
- [x] Offline-first product behavior.
- [x] Success metrics and acceptance criteria.
- [x] Risks, assumptions and classified questions.
- [x] No implementation-level artifacts.
- [ ] Manager/Commander approval of unresolved business questions.

Recommendation: `PASS_WITH_NON_BLOCKING_OPEN_QUESTIONS`, pending Commander review.

## 35. Audit Appendix

### Sources Used

Direct manager decisions, approved Discovery artifact, Project Control Center, approved architecture principles and Commander decisions. Master Pipeline ZIP is unavailable and not cited as verified.

### Provenance Labels

- `DIRECT_MANAGER_DECISION`: product authority and governance rules.
- `COMMANDER_DECISION`: Discovery normalization, scale targets and non-blocking classifications.
- `CONVERSATION_SOURCE`: product context and Discovery requirements.
- `MASTER_PIPELINE_SOURCE`: unknown/unverified.
- `ASSUMPTION`: Section 30 only.

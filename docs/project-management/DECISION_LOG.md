# Decision Log

## Phase 13.01 implementation decisions

- IMP-ADR-13-01 Provisional HMAC JWT is test/foundation-only and production configuration fails closed until final session, expiry, audience, rotation, revocation, and device policy is approved.
- IMP-ADR-13-02 Authentication and authorization derive tenant context from the verified server token; client-supplied tenant headers are non-authoritative.
- IMP-ADR-13-03 No identity/business persistence schema or migration is introduced in Slice 13.01; persistence-backed identity status is an explicit provider boundary.
- IMP-ADR-13-04 CI validation is read-only and deployment-free; workflow actions are pinned and permissions are limited to repository contents read.

## Candidate ADRs from Discovery

- Modular Monolith first.
- Multi-tenant isolation and deny-by-default access.
- Event/Audit-first transport operations.
- Offline-first Driver App with idempotent synchronization.
- Async notification processing.
- Stateless and horizontally scalable backend direction.
- Read models/current state for dashboard workloads.
- No performance claim without benchmark or load-test evidence.
- Child data treated as sensitive.

These are discovery-level decisions or candidates; implementation is not authorized by this log.
# Decision Log

## 2026-08-25 — Phase 07 candidate decisions

- ADR-07-01 Modular Monolith First — ACCEPT_CANDIDATE.
- ADR-07-02 PostgreSQL Canonical Source of Truth — ACCEPT_CANDIDATE.
- ADR-07-03 Idempotent Per-Operation Offline Reconciliation — NEEDS_REVISION: bounded authorization/revocation policy required.
- ADR-07-04 Redis Auxiliary Cache/Queue — ACCEPT_CANDIDATE with explicit non-source-of-truth and degradation rules.
- ADR-07-05 Async Non-Authoritative Notifications — ACCEPT_CANDIDATE with dispatch revalidation and privacy constraints pending.
- ADR-07-06 Centralized Tenant/Relationship Authorization — ACCEPT_CANDIDATE.
- ADR-07-07 Stateless Scaling Before Service Decomposition — ACCEPT_CANDIDATE with evidence-based extraction criteria.
- ADR-07-08 Transactional Outbox — ACCEPT_CANDIDATE; exact mechanics deferred to later technical design.
- ADR-07-09 Current-State Read Model — ACCEPT_CANDIDATE; derived, rebuildable and non-authorizing.
- ADR-07-10 Audit-First Design — NEEDS_REVISION pending integrity, retention and compliance rules.
- ADR-07-11 Microservice Extraction Criteria — ACCEPT_CANDIDATE.
- ADR-07-12 Offline Authority and Revocation Policy — ACCEPT_CANDIDATE: local capture is provisional; authoritative sync revalidation, rejection evidence and non-silent Driver outcome are mandatory. Staleness bound awaits pre-production policy approval.
- ADR-07-10 Audit-First Design — ACCEPT_CANDIDATE: ordered tamper-evident evidence, independently controlled verification checkpoints, administration separation, export accountability, durable audit intent, failure escalation and break-glass governance are explicit. Exact storage/algorithm/retention is deferred.
- ADR-07-13 Session and Device Lifecycle — ACCEPT_CANDIDATE: current authority, revocation, compromise and offline consequences are architecture responsibilities; token mechanics deferred.
- ADR-07-14 Sensitive Notification Dispatch Revalidation — ACCEPT_CANDIDATE: revalidate eligibility/privacy at dispatch; suppression is auditable and does not reverse the business event.
- ADR-07-15 Durable Critical Commitment and Outbox Isolation — ACCEPT_CANDIDATE: critical state/evidence/audit/publication intent is durable independently of Redis/worker/FCM.
- ADR-07-16 Restore and DR Responsibilities — ACCEPT_CANDIDATE: restoration verification covers PostgreSQL, audit, rebuildable read models and protected configuration; RPO/RTO remain open.

## 2026-08-25 — Phase 08 candidate decisions

- DB-ADR-001 PostgreSQL Canonical Data Store — ACCEPT_CANDIDATE.
- DB-ADR-002 Tenant-ID on Tenant-Scoped Records — ACCEPT_CANDIDATE with DB-ADR-013 composite ownership enforcement posture.
- DB-ADR-003 UUIDv7 Identifier Strategy — NEEDS_REVISION: candidate pending operational compatibility decision.
- DB-ADR-004 Append-Oriented Transport Events — ACCEPT_CANDIDATE.
- DB-ADR-005 Current-State Projection — ACCEPT_CANDIDATE with DB-ADR-014 identity/serialization invariant.
- DB-ADR-006 Database-Enforced Idempotency — ACCEPT_CANDIDATE with replay/fingerprint contract.
- DB-ADR-007 Transactional Outbox — ACCEPT_CANDIDATE with DB-ADR-016 claim/lease/dedup policy.
- DB-ADR-008 Audit Data Isolation — ACCEPT_CANDIDATE with DB-ADR-017 atomicity/verification ownership.
- DB-ADR-009 Partition-Ready Event Storage — NEEDS_REVISION pending DB-ADR-018 uniqueness compatibility.
- DB-ADR-010 Soft Delete Is Not Universal — ACCEPT_CANDIDATE.
- DB-ADR-011 Read Models Are Rebuildable — ACCEPT_CANDIDATE.
- DB-ADR-012 Cache Is Never Canonical — ACCEPT_CANDIDATE.
- DB-ADR-013 Tenant Enforcement Posture — ACCEPT_CANDIDATE: composite ownership constraints wherever expressible; dynamic validity remains transactional.
- DB-ADR-014 Current-State Identity and Serialization — ACCEPT_CANDIDATE.
- DB-ADR-015 Assignment Overlap Policy — DEFER: explicit business precedence not approved.
- DB-ADR-016 Outbox Claim/Lease/Dedup — ACCEPT_CANDIDATE.
- DB-ADR-017 Audit Evidence Atomicity — ACCEPT_CANDIDATE.
- DB-ADR-018 Partition Identity Compatibility — DEFER until partition activation is evidenced.
- DB-ADR-019 Index/Access Matrix — ACCEPT_CANDIDATE.
- DB-ADR-020 Sensitive Export Lifecycle — DEFER; sensitive exports stay disabled absent policy.

## 2026-08-25 — Phase 09 candidate decisions

- API-ADR-001 REST/JSON Contract Direction — ACCEPT_CANDIDATE.
- API-ADR-002 Explicit Versioning — ACCEPT_CANDIDATE.
- API-ADR-003 Stable Machine-Readable Error Envelope — ACCEPT_CANDIDATE.
- API-ADR-004 Idempotent Critical Writes — ACCEPT_CANDIDATE with current-authorization-before-replay invariant.
- API-ADR-005 Per-Request Authorization — ACCEPT_CANDIDATE.
- API-ADR-006 Cursor Pagination for High-Churn Collections — ACCEPT_CANDIDATE.
- API-ADR-007 Per-Item Batch Outcomes — ACCEPT_CANDIDATE.
- API-ADR-008 Read-Model Freshness Exposure — ACCEPT_CANDIDATE.
- API-ADR-009 Provider-Neutral Notification Semantics — ACCEPT_CANDIDATE.
- API-ADR-010 Additive Mobile Compatibility — ACCEPT_CANDIDATE.

## 2026-08-25 — Phase 10 candidate decisions

- SEC-ADR-001 Deny by Default through SEC-ADR-004 Relationship/Assignment Authorization — ACCEPT_CANDIDATE.
- SEC-ADR-005 Session and Device Revocation Model — NEEDS_REVISION: behavioral requirements accepted; exact mechanism/lifecycle values deferred.
- SEC-ADR-006 Offline Authorization Revalidation through SEC-ADR-010 Sensitive Data Minimization — ACCEPT_CANDIDATE.
- SEC-ADR-011 Secrets Management Boundary — ACCEPT_CANDIDATE; provider/key selection deferred.
- SEC-ADR-012 Break-Glass Governance — NEEDS_REVISION pending approved requester/approver/expiry policy.
- SEC-ADR-013 Defense-in-Depth Tenant/Worker/Audit/Cache Boundary — ACCEPT_CANDIDATE; RLS versus application-scoped DB enforcement deferred.

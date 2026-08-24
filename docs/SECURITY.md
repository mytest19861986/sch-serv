# Security Architecture and Control Specification

## 1. Document Control

Phase 10 Security Design. Status: Draft. This is a production-oriented security specification only; it creates no code, configuration, credentials, cryptographic selection, schema, endpoint handler, migration, or deployment.

## 2. Purpose

The platform SHALL protect child and guardian data, transport operations, tenant boundaries, account/session material, audit evidence, and administrative capability. Security objectives are confidentiality, integrity, availability appropriate to product commitments, privacy minimization, accountable privileged access, and safe degradation. Server authorization is authoritative; local capture is not authorization.

## 3. Scope

The platform SHALL deny by default, apply least privilege, derive rather than trust tenant/resource scope, re-evaluate relationship and assignment authorization, minimize sensitive data, preserve audit evidence, isolate asynchronous notification failure from business commitment, and treat cache/read models as non-canonical and non-authoritative.

## 4. Security Principles

Trust boundaries exist between Driver device, Parent device, browser clients, Internet, reverse proxy/load balancer, backend, worker processes, PostgreSQL, Redis, object storage, FCM, and admin/support surfaces. Every crossing SHALL authenticate or be explicitly service-authorized, authorize the requested scope, validate untrusted inputs, correlate the operation, and minimize disclosed data.

## 5. Security Objectives

Child identity data, guardian relationships, transport status/history, and location data if enabled are highly sensitive. Credentials/session material, notification tokens, device identifiers, audit records, exports/backups, and operational metadata have sensitivity proportional to their ability to reveal identity, access, or operations. Classification drives minimization, access control, audit, retention, and export restrictions; jurisdiction-specific retention remains open.

## 6. Security Assumptions

Threat analysis uses STRIDE-style structured scenarios. Severity and likelihood use qualitative classifications only; no unsupported numerical precision is asserted. Each material threat records asset, actor, entry point, trust boundary, scenario, impact, likelihood, controls, residual risk, and verification expectation.

## 7. Security Assets

**THREAT-ID:** SEC-T-001. **ASSET:** account/session material. **ACTOR:** credential thief, brute-force actor, or compromised device. **ENTRY_POINT:** login, refresh, session lifecycle. **TRUST BOUNDARY:** client/Internet/backend. **SCENARIO:** attacker acquires or repeatedly guesses access material. **IMPACT:** unauthorized access. **LIKELIHOOD/SEVERITY:** context-dependent / high. **CONTROLS:** safe credential handling, brute-force/abuse controls, active-session visibility, revocation, recovery, audit, and no concrete token algorithm assumed. **RESIDUAL RISK:** endpoint/device compromise remains possible. **VERIFICATION:** negative session/revocation/recovery tests and security review.

## 8. Asset Classification

**THREAT-ID:** SEC-T-002. **ASSET:** tenant-scoped children, relationships, operations, and audit. **ACTOR:** authenticated malicious user. **ENTRY_POINT:** resource IDs, filters, URLs, payload tenant fields. **TRUST BOUNDARY:** client/backend/data boundary. **SCENARIO:** BOLA/IDOR or tenant injection accesses another tenant. **IMPACT:** severe privacy and integrity breach. **LIKELIHOOD/SEVERITY:** material / high. **CONTROLS:** server-derived tenant scope, per-resource authorization, relationship/assignment checks, data-layer integrity support, safe enumeration behavior, and negative invariants. **RESIDUAL RISK:** implementation defect. **VERIFICATION:** cross-tenant and foreign-ID negative tests.

## 9. Child Data Classification

**THREAT-ID:** SEC-T-003. **ASSET:** transport event/current state and safety-relevant status. **ACTOR:** stale, compromised, or malicious Driver client. **ENTRY_POINT:** pickup, drop-off, sync. **TRUST BOUNDARY:** offline device/backend. **SCENARIO:** delayed, duplicated, altered, or revoked-authority event is submitted. **IMPACT:** false transport confirmation or disclosure. **LIKELIHOOD/SEVERITY:** material / high. **CONTROLS:** provisional local capture, current authorization before protected replay, scoped idempotency/fingerprint, assignment/transition checks, per-item reconciliation, audit, and no silent discard. **RESIDUAL RISK:** policy on historical authority is open. **VERIFICATION:** replay/revocation/order/response-loss tests.

## 10. Trust Boundaries

**THREAT-ID:** SEC-T-004. **ASSET:** notification tokens, recipient relationship, status data, and outbox work. **ACTOR:** stale recipient, queue abuser, or worker compromise. **ENTRY_POINT:** outbox/worker/FCM boundary. **TRUST BOUNDARY:** backend/worker/provider. **SCENARIO:** a notification reaches a revoked recipient or retries create harmful effects. **IMPACT:** privacy breach or misleading delivery. **LIKELIHOOD/SEVERITY:** material / high. **CONTROLS:** minimal payloads, dispatch-time recipient revalidation, least-privilege workers, retry/poison handling, idempotent effects, and notification failure isolation. **RESIDUAL RISK:** provider/device behavior. **VERIFICATION:** revocation and outage tests.

## 11. Threat Modeling Method

**THREAT-ID:** SEC-T-005. **ASSET:** administrative power, audit evidence, exports, backups. **ACTOR:** privileged insider or compromised support account. **ENTRY_POINT:** dashboard, audit/export, production/support tools. **TRUST BOUNDARY:** admin/support/backend/data. **SCENARIO:** excessive access, unaccounted export, or altered evidence. **IMPACT:** severe confidentiality/integrity breach. **LIKELIHOOD/SEVERITY:** material / high. **CONTROLS:** least privilege, purpose-bound access, audit correlation, append-oriented evidence, restricted mutation/export, verifier checkpoints, break-glass accountability, and Super Admin not equal to database browsing. **RESIDUAL RISK:** authorized misuse. **VERIFICATION:** access-review and audit-integrity exercises.

## 12. Threat Model

Login, renewal, logout, compromise response, recovery, and brute-force resistance SHALL be security requirements. Credential/session material SHALL not appear in logs, analytics, source control, or ordinary support tooling. Authentication does not itself grant tenant or resource access; exact credential and JWT/cryptographic mechanisms remain a later approved decision.

## 13. External Threat Actors

Device registration, active sessions, renewal, logout, revocation, role change, tenant removal, account disablement, lost/stolen/compromised/replacement device, and stale offline client SHALL have explicit safe behavior. Protected requests SHALL re-evaluate revocation-relevant context. A device may retain provisional evidence locally only under approved offline policy and SHALL not extend revoked authority.

## 14. Internal Threat Actors

Authorization SHALL combine role, tenant, action, resource ownership, Parent-to-Student relationship, and Driver-to-Service assignment where applicable. Field-level authorization applies to privileged, tenant, role, lifecycle, ownership, and sensitive fields. Privileged administration is explicit, auditable, purpose-bound, and does not bypass data minimization.

## 15. Authentication Security

Application logic SHALL derive tenant scope from authenticated membership and validate every resource reference. Data-layer controls SHALL support tenant integrity where expressible. Client-supplied tenant identifiers are never authority. Cross-tenant/unrelated target responses SHALL resist enumeration. Super Admin exceptions are narrow, explicit, logged, and do not create unrestricted data browsing. Negative invariant: no operation may read, mutate, replay, export, or infer another tenant's protected data without explicitly authorized support scope.

## 16. Credential Security

Local capture is provisional and server commit is authoritative. Current authorization SHALL precede protected replay disclosure. Assignment, relationship, session, role, tenant, and account changes during an offline period constrain later submission. Rejected evidence is auditable and visible to the Driver through privacy-safe outcome categories; it is never silently discarded. Idempotency scope includes tenant, operation, authorized actor/assignment/device context, and immutable fingerprint; mismatch/abuse is a stable security conflict. Retention/window values remain policy dependencies.

## 17. Session Management

API contracts SHALL mitigate BOLA, IDOR, tenant injection, mass assignment, over-posting, injection, unsafe filters/search, enumeration, brute force, rate abuse, excessive exposure, and unsafe errors. Inputs use allowlists plus type/format/range/business validation. Server-derived protected fields are not client-settable; unknown privileged fields are rejected. If uploads are enabled later, their validation, access, scanning, content handling, and lifecycle require an explicit approved contract.

## 18. Device Session Management

Rate/abuse policy SHALL distinguish authentication, critical transport writes, sync, search, admin mutation, and exports without inventing numeric limits. Notification tokens are protected; push payloads are minimal and avoid unnecessary child-sensitive content. Recipient eligibility is revalidated at dispatch, delivery is suppressed after relationship/user change, loss of a device is addressed through session/device control, and notification failure never reverses a committed business event.

## 19. Session Revocation

Authoritative audit evidence is append-oriented and records actor, tenant, target/resource context, action, outcome, correlation, and privileged/security events. Audit mutation is restricted; tamper-evidence, verifier/checkpoint, access control, export accountability, and failure escalation are required. Operational logs are not authoritative audit evidence and are privacy-minimized.

## 20. Lost/Stolen Device

Secrets SHALL not enter source control; environments are isolated; service credentials are scoped, rotated under approved policy, production access restricted, and sensitive/break-glass access audited. TLS in transit, encryption at rest for database/storage/backups, key-management dependency, justified application-level protection, masking/minimization, and log exclusion are required expectations. Provider and algorithm choices remain unselected.

## 21. Credential Compromise

Database identities use least privilege; tenant integrity, audit/outbox sensitivity, privileged query controls, export restrictions, and migration privileges are controlled. Redis remains network-restricted, credential-protected, non-canonical, non-authoritative, and safely rebuildable where applicable. Object storage is private by default with scoped temporary access if later required; no sensitive child artifact is public. Workers/queues use least privilege, minimized payloads, retry abuse and poisoned-message controls, queue-injection resistance, and recipient revalidation.

## 22. Authorization Architecture

Dependencies require review, lockfiles, provenance expectations, vulnerability scanning, update policy, CI verification, and malicious-package risk handling. CI/CD protects secrets, separates environments, uses least privilege and protected releases, preserves artifact integrity, applies approval gates, and never uses production credentials in developer workflows.

## 23. Deny by Default

Production/support access uses least privilege, time-bounded access where appropriate, auditability, controlled break-glass, and support data restrictions; Super Admin is not unrestricted database access. Incident response SHALL cover detection, triage, containment, evidence preservation, notification/escalation decision ownership, recovery, post-incident learning, and interaction with tenant, session, device, audit, and privacy obligations. Exact response times and regulatory notification rules are open jurisdiction/policy dependencies.

## 24. Least Privilege

Open security decisions include credential/session mechanism, idempotency retention/format, numeric rate/payload/time limits, historical offline-authority policy, export enablement/retention, jurisdiction, data retention, key-management provider, and incident notification rules. This draft is not ready for Gate closure until the remaining Commander template, focused security review, quality evidence, and validation criteria are reconciled. Phase 11+ and implementation remain locked.

## 25. Tenant Isolation

The platform SHALL minimize data collection and exposure, use data only for approved product purpose, restrict visibility to authorized need, use least-data notification content, provide privacy-safe errors, restrict exports, and apply special handling to child data. Retention/deletion rules depend on approved jurisdiction and policy and are not invented here.

## 26. Parent-Student Authorization

The threat model SHALL account for malicious Parent and Driver behavior; compromised Driver and Parent devices; malicious School Operator or School Admin; compromised Super Admin; cross-tenant, replay, credential-stuffing, and enumeration attackers; and insider/support misuse. Each applicable control maps to authorization, tenant isolation, session/device, offline/replay, audit, data minimization, or operations requirements.

## 27. Driver Assignment Authorization

- Identifier substitution SHALL NOT create cross-tenant access.
- Parent access SHALL require an active authorized relationship.
- Driver transport commitment SHALL require valid server-side authority.
- Offline local state SHALL NOT create server authority.
- Revoked sessions SHALL NOT create new durable authority.
- Idempotency replay SHALL NOT bypass current authorization.
- Client-supplied tenant/resource ownership SHALL NOT prove authorization.
- Notification failure SHALL NOT invalidate committed business state, and dispatch SHALL NOT trust stale recipient eligibility.
- Redis/cache and read models SHALL NOT authorize.
- Operational logs SHALL NOT be authoritative audit evidence; audit evidence SHALL NOT be casually mutable.
- Child data SHALL be minimized in errors, logs, and notifications.
- Super Admin SHALL NOT receive implicit unrestricted child-data browsing.
- Object identifier possession SHALL NOT grant access.

## 28. Super Admin Security Boundary

| Control ID | Threat / requirement | Asset | Control | Enforcement layer | Verification | Traceability | Status |
|---|---|---|---|---|---|---|---|
| SEC-AUTH-001 | identity/session abuse | account/session | deny-by-default authentication lifecycle and revocation | client/API/backend | future lifecycle negatives | API §§10–12; Architecture | candidate |
| SEC-AUTHZ-001 | BOLA/IDOR | protected resources | per-action/resource/field authorization | API/backend | future foreign-resource tests | Roles; API §§79–84 | candidate |
| SEC-TENANT-001 | tenant substitution | tenant-scoped data | derived scope and supporting integrity | API/backend/database | future cross-tenant tests | Database tenant principles | candidate |
| SEC-OFFLINE-001 | stale/forged offline event | transport state | provisional capture and server revalidation | Driver/API/backend | future sync/revocation tests | API §§35–41 | candidate |
| SEC-REPLAY-001 | replay disclosure/effect | event/state | authorization-before-replay and scoped fingerprint | API/backend/database | future replay tests | API §109.3 | candidate |
| SEC-AUDIT-001 | evidence tampering | audit record | append-oriented accountable evidence | backend/database | future integrity exercises | Architecture/Database audit rules | candidate |
| SEC-DATA-001 | child-data exposure | sensitive data | minimization, safe errors/logs/exports | all surfaces | future exposure tests | PRD privacy | candidate |
| SEC-NOTIFY-001 | stale delivery | notification data | recipient revalidation/minimal payload | worker/provider boundary | future revoke/outage tests | Architecture notification rules | candidate |
| SEC-OPS-001 | privileged/supply-chain abuse | production assets | least privilege, secrets, CI/CD controls | operations | future access/release reviews | Architecture operational boundaries | candidate |

## 29. Resource-Level Authorization

Future validation SHALL include invalid credentials, brute-force resistance, session lifecycle/logout/revocation; Parent unrelated-student denial, Driver unassigned-service denial, school cross-tenant denial, Super Admin boundaries, BOLA/IDOR; revoked assignment/session during sync, forged client events, replay, duplicates; sensitive-error leakage, export authorization, audit access, notification privacy; and secret leakage, dependency vulnerability, backup/restore security. These tests are required future evidence and have not been executed in this documentation phase.

## 30. Action-Level Authorization

Each security requirement SHALL trace to an approved architecture decision, database principle, API contract, user story, user flow, and future verification. The requirements matrix in §28 provides initial identifiers; implementation may not claim the control until the mapped verification exists.

## 31. Field-Level Authorization

SEC-ADR-001 Deny by Default; 002 Tenant Isolation Enforcement; 003 Resource-Level Authorization; 004 Relationship/Assignment Authorization; 005 Session and Device Revocation Model; 006 Offline Authorization Revalidation; 007 Replay-Safe Idempotency; 008 Audit Integrity Boundary; 009 Notification Recipient Revalidation; 010 Sensitive Data Minimization; 011 Secrets Management Boundary; and 012 Break-Glass Governance are ACCEPT_CANDIDATE unless a later explicitly stated policy decision requires revision. Exact session mechanism, key management, retention, and jurisdictional obligations remain undecided rather than silently accepted.

## 32. BOLA Protection

Material risks are: unresolved session/credential and retention/legal-hold policy; implementation failure to enforce tenant/resource/field boundaries; operational secret or privileged-access misuse; third-party/provider failure; and scale/retry pressure weakening critical-write or audit controls. Each is recorded in the Project Control Center as a security gate or implementation-time verification dependency; none is represented as solved by this document alone.

## 33. IDOR Protection

Open decisions: exact session mechanism and credential lifecycle values; retention/legal-hold and jurisdiction; historical offline authority; export enablement; incident ownership and communication obligations; key-management selection; and numeric rate/payload/time thresholds. These are explicitly deferred, not accepted ADRs.

## 34. Tenant Injection Protection

- [x] Security specification and traceability/control matrices are present.
- [x] Threats, trust boundaries, tenant/authorization/offline/replay, audit, privacy, operations, risks, assumptions, open questions, and ADR candidates are documented.
- [ ] Focused security architecture, security QA, and product/privacy review; quality score; and Commander decision remain required.
- [x] No implementation, deployment configuration, credential, migration, or dependency was created.

## 35. Mass Assignment Protection

Provenance: approved Discovery through API Phase 09 artifacts, Project Control Center, accepted architecture/database/API decisions, and Commander Phase 10 directive. Assumptions and unresolved policy dependencies are listed in §§24, 32, and 33. Review history and evidence will be added only after focused review; no test execution or compliance certification is claimed.

## 36. Over-Posting Protection

Only allowlisted writable fields are accepted; protected ownership, tenant, role, lifecycle, and canonical-event fields are server-derived.

## 37. Input Validation

Inputs require type, format, range, and business validation before use; unknown privileged fields are rejected.

## 38. Injection Prevention

Inputs, filters, sort fields, and search expressions are allowlisted and never treated as trusted executable or query structure.

## 39. Enumeration Resistance

Cross-tenant or unrelated targets use privacy-safe outcomes that do not disclose protected existence.

## 40. Error Information Leakage

Errors expose stable safe codes and correlation identity, not credentials, authorization state, internal topology, or child-sensitive details.

## 41. API Security

Protected APIs enforce authentication, current authorization, tenant/resource/relationship/assignment scope, safe errors, and abuse controls.

## 42. Critical Write Security

Transport critical writes require current authority, valid transition, scoped idempotency, concurrency control, audit, and durable publication intent.

## 43. Offline Security

Local capture is provisional; server confirmation is authoritative and rejected items are never silently discarded.

## 44. Offline Authorization Revalidation

Server evaluation rechecks session, account, tenant, role, relationship, and assignment authority at sync time.

## 45. Replay Protection

Exact replay is limited to eligible scoped identity and immutable fingerprint after current authorization is evaluated.

## 46. Idempotency Abuse Protection

Key reuse across context or fingerprint is a safe conflict/security outcome; retention values remain policy decisions.

## 47. Revocation During Offline Sync

Revoked authority safely denies commitment and preserves privacy-safe rejected-event audit evidence.

## 48. Notification Security

Notification processing is non-authoritative, least-privilege, durable-intent-aware, and failure-isolated from committed business state.

## 49. Notification Privacy

Payloads are minimized and avoid unnecessary child-sensitive content.

## 50. Push Token Protection

Tokens are sensitive access material, restricted by user/device scope, excluded from logs, and invalidated through lifecycle controls.

## 51. Notification Recipient Revalidation

Eligibility is rechecked at dispatch so relationship/user changes suppress stale delivery.

## 52. Audit Security

Security-relevant actions and privileged operations are auditable with actor, tenant, target, outcome, and correlation context.

## 53. Audit Integrity

Authoritative audit evidence is append-oriented, mutation-restricted, tamper-evidence-aware, and subject to verification/checkpoint expectations.

## 54. Audit Access Control

Audit queries/exports are purpose-bound, least-privilege, filtered, and themselves accountable.

## 55. Security Event Logging

Security events include denial, revocation, replay collision, privileged action, anomalous access, and audit-control failure signals.

## 56. Operational Logging Safety

Operational logs are minimized, redact sensitive values, and never replace authoritative audit evidence.

## 57. Secrets Management

Secrets stay out of source control, use environment separation and scoped credentials, and have approved rotation and audited access expectations.

## 58. Encryption in Transit

Sensitive system communications require transport encryption; exact protocol and provider choices remain unselected.

## 59. Encryption at Rest

Database, storage, and backup protection require encryption-at-rest expectations and key-management dependency.

## 60. Sensitive Data Protection

Child, guardian, location-if-enabled, session, device, audit, and token data are minimized, masked as appropriate, and excluded from unsafe sinks.

## 61. Database Security

Database access is least-privilege and preserves tenant integrity, audit/outbox sensitivity, query restraint, export restrictions, and controlled migrations.

## 62. PostgreSQL Privilege Boundary

Application, migration, reporting, and support identities have separate least-privilege responsibilities; no broad direct browsing is implied.

## 63. Redis Security Boundary

Redis is network-restricted and credential-protected, non-canonical, non-authorization, and rebuildable where applicable.

## 64. Object Storage Security

Object storage is private by default; sensitive artifacts use scoped temporary access if approved and no public child artifacts.

## 65. Queue and Worker Security

Workers use minimized payloads, least privilege, retry/poison-message controls, queue-injection resistance, and recipient revalidation.

## 66. Backup Security

Backups are sensitive, encrypted, access-restricted, audited, and subject to approved retention/legal-hold policy.

## 67. Restore Security

Restore procedures require integrity verification, protected access, audit awareness, and no weakened tenant/security boundary.

## 68. Export Controls

Sensitive export stays restricted or disabled absent approved lifecycle, authorization, accountability, and retention controls.

## 69. Environment Separation

Development, test, staging, and production are isolated; production secrets/data are not normal developer workflow material.

## 70. Production Access

Production access is least-privilege, time-bounded where appropriate, auditable, and governed through approved operational controls.

## 71. Admin and Support Access

Admin/support capability is scoped to purpose and role; Super Admin is not implicit unrestricted database or child-data access.

## 72. Break-Glass Access

Break-glass is exceptional, restricted, accountable, reviewed, and cannot become routine privileged access.

## 73. Supply Chain Security

Supply-chain expectations cover trusted provenance, review, update policy, CI verification, and malicious-package risk.

## 74. Dependency Security

Dependencies require lockfiles, review, vulnerability assessment, and controlled remediation; no dependency is added in this phase.

## 75. CI/CD Security Expectations

CI/CD uses protected releases, least privilege, environment separation, secret protection, integrity, and approvals.

## 76. Secret Scanning

Future delivery controls SHALL detect accidental secret exposure before release; no scan result is claimed here.

## 77. Dependency Scanning

Future delivery controls SHALL assess dependency vulnerabilities and provenance; no scan result is claimed here.

## 78. SAST Expectations

Future static analysis SHALL target authorization, injection, sensitive-data, and unsafe-error regressions; no execution is claimed.

## 79. DAST Expectations

Future dynamic testing SHALL target session, authorization, replay, enumeration, and API-abuse scenarios; no execution is claimed.

## 80. Security Monitoring

Monitoring SHALL observe security-relevant outcomes without collecting unnecessary sensitive content.

## 81. Security Metrics

Metrics SHALL be privacy-safe aggregates for denials, replay, revocation, privileged actions, abuse, and control failures; thresholds remain open.

## 82. Alerting

Alerting SHALL route material security/audit-control failure signals to approved ownership without claiming response-time commitments.

## 83. Incident Response

Incident lifecycle covers detection, triage, containment, investigation, evidence preservation, recovery, and post-incident review.

## 84. Security Incident Evidence

Incident handling preserves relevant audit evidence, scope, correlation, and access records under restricted control.

## 85. Data Breach Considerations

Child-data exposure requires controlled containment, evidence preservation, affected-scope assessment, and legal/communication dependency review without inventing obligations.

## 86. Privacy by Design

Privacy controls use purpose limitation, restricted visibility, minimal collection/disclosure, safe errors, and child-data special handling.

## 87. Data Minimization

Each surface, API, notification, log, audit query, export, and support function receives only data necessary for authorized purpose.

## 88. Retention Dependencies

Retention values, legal hold, and secure disposal depend on approved jurisdiction and policy.

## 89. Deletion Dependencies

Deletion and redaction behavior must preserve approved audit/operational obligations and awaits policy decisions.

## 90. Legal and Compliance Dependencies

Compliance obligations, residency, breach notification, and child-data rules require jurisdictional approval; none are assumed.

## 91. Abuse Cases

Malicious/compromised Parents, Drivers, operators, admins, Super Admins, cross-tenant actors, replayers, enumerators, and insiders are addressed by the threat model and controls.

## 92. Insider Threats

Insider and support misuse are reduced through least privilege, purpose scope, audit, export restrictions, review, and break-glass governance.

## 93. Compromised Client Scenarios

Compromised devices may submit only provisional evidence; session/device revocation, reauthorization, and minimized local data constrain impact.

## 94. Cross-Tenant Attack Scenarios

Identifier substitution, filters, payload fields, cursor transplant, and replay cannot create authorized cross-tenant access.

## 95. Privilege Escalation Scenarios

Role, tenant, ownership, lifecycle, and privileged fields are server-controlled and field/action authorization prevents self-escalation.

## 96. Replay Attack Scenarios

Replay of protected results is gated by current authorization, scoped key/fingerprint, and duplicate-effect prevention.

## 97. Offline Forgery Scenarios

Forged/stale offline events fail server authority, assignment, transition, tenant, idempotency, and concurrency evaluation.

## 98. Notification Abuse Scenarios

Stale-recipient delivery, provider failure, token abuse, and retry storms are constrained by revalidation, minimization, isolation, and worker controls.

## 99. Rate-Limit Abuse Scenarios

Authentication, critical writes, sync, search, administration, and export receive differentiated abuse-control policy without unsupported numeric values.

## 100. Security Invariants

The invariants in §§25–56 and §27 are mandatory: no client ownership proof, no cache/read-model authorization, no identifier-based access, and no notification failure rollback.

## 101. Security Requirements Matrix

The matrix is defined in §28 and supplies control ID, asset, control, layer, verification, traceability, and status for future evidence.

## 102. Security Testing Strategy

The future-required negative and infrastructure testing strategy is defined in §29; this phase claims no executed test.

## 103. Security Traceability Matrix

Traceability links security requirements to architecture, database, API, user story, flow, and future test in §30.

## 104. Candidate Security ADRs

ADRs are classified individually: core invariants are ACCEPT_CANDIDATE; exact session/key/retention/jurisdiction policy is DEFER, not accepted for completeness.

## 105. Security Risks

Unresolved policy, implementation, operational, compliance, and scale/security interaction risks are tracked in the Project Control Center.

## 106. Open Questions

Open decisions are enumerated in §33 and remain gate-visible.

## 107. Phase Gate Checklist

Gate requires 108/108 sections, review, score at least 85, no Critical finding, documented evidence, and Commander approval.

## 108. Audit Appendix

This artifact derives from approved Phases 01–09 and Commander Phase 10 direction; it is documentation evidence only and records no implementation, test execution, or compliance certification.

### 108.1 Security Verification Acceptance Matrix

| Test ID | Setup / adversarial action | Expected safe outcome | Evidence required | Gate impact |
|---|---|---|---|---|
| SEC-TEST-AUTHZ-001 | Parent requests unrelated child through direct ID, cursor, filter, sort, bulk and export paths | privacy-safe deny with no child existence/body/count leakage; audit where policy requires | response parity assertion and audit correlation | blocks Parent surface implementation |
| SEC-TEST-AUTHZ-002 | Driver requests unassigned/expired/replaced service or roster | no roster/status/command authority; privacy-safe denial | response and assignment-audit evidence | blocks Driver operation implementation |
| SEC-TEST-TENANT-001 | Actor substitutes other-tenant ID, body reference, cursor, filter, replay key, or report/export target | no read, write, inference, or reused result across tenant | deny-parity plus tenant-context evidence | blocks tenant-scoped implementation |
| SEC-TEST-REVOKE-001 | revoke session, disable account, remove membership/role, remove guardian link, end/replace assignment, or suspend tenant before sync/during batch/after commit-before-response | each item re-evaluates current authority; denied item has no durable effect and safe local outcome | item outcome, state/audit, and retry evidence | blocks offline implementation |
| SEC-TEST-REPLAY-001 | same key/payload; changed payload; changed actor/device/assignment/tenant; concurrent duplicate; response-loss retry; replay after revocation | eligible safe replay only after authorization; mismatch conflict; revoked result not disclosed; no duplicate effect | idempotency/audit/security-event evidence | blocks critical-write implementation |
| SEC-TEST-AUDIT-001 | attempt append mutation, direct privileged access, checkpoint mismatch, verifier outage, audit export/read | mutation denied; mismatch/outage escalates; access/export accountable; recovery preserves continuity | verifier, escalation, correlation evidence | blocks audit-integrity claim |
| SEC-TEST-DATA-001 | inspect error/log/trace/metric/search/push/support/audit/export/cache after denial or relationship revocation | prohibited child/session/token data absent; allowed fields explicit; stale views cannot bypass authorization | sensitive-sink/redaction evidence | blocks sensitive surface enablement |

### 108.2 Session, Device, and Authority Lifecycle Contract

Authentication and session behavior SHALL be testable without selecting an implementation algorithm. Login abuse and recovery responses are privacy-safe and rate/abuse controlled. Renewal/replay behavior, concurrent-session/device policy, and credential lifecycle values are deferred to an approved policy owner; until then, no behavior may assume unlimited or durable access. Logout, explicit revoke, account disablement, tenant removal, role/membership change, relationship removal, assignment end/replacement, lost/stolen or compromised-device handling SHALL take effect at the next protected server evaluation. A device may retain only provisional offline evidence subject to approved minimization and local-protection rules; a replacement device never inherits authority merely through identifier possession.

### 108.3 Defense-in-Depth Tenant, Worker, Audit, and Cache Contract

Tenant isolation is defense in depth: the API derives tenant/purpose scope; database design SHALL enforce same-tenant references where technically expressible; application, migration, worker, reporting, and support identities are separate least-privilege roles; reporting/support queries require server-derived, purpose-bound tenant context. Selection of RLS versus application-scoped database enforcement is DEFERRED and must be an approved ADR before implementation.

The durable outbox is the only approved source of accepted asynchronous effects. Producers/consumers have distinct identities and queue ACLs; message schema/version is validated; durable message identity, at-least-once consumer idempotency, lease/reaper recovery, minimized payload/reference fields, canonical-state tenant/context recomputation, and audited manual replay are required. No worker may trust arbitrary message tenant fields or create cross-tenant effect.

Normal application, school/super-admin, and routine-support identities SHALL NOT mutate audit or independent verification evidence. The verifier/checkpoint boundary uses separately restricted authority; mismatch/loss produces durable escalation, and restore/repartition preserves evidence continuity. Cache/read-model use requires tenant-keying, server-authorized query shaping before lookup, no broad-response reuse for narrower callers, minimized child data, and revocation-aware eviction/revalidation; neither freshness nor cache state authorizes access.

Object artifacts/uploads remain disabled unless an approved object-storage contract supplies server-mediated create/read authorization, immutable tenant/purpose/classification metadata, non-guessable keys, bounded revocable access, content validation/quarantine, audit, and restore separation. Historical offline authority is also DEFERRED: default behavior is current-authority denial; no exception/UI/API behavior may be enabled until Commander approves maximum staleness, evidence, reviewer, and state/notification effects.

### 108.4 Threat Boundary Coverage and Control Traceability

Threat-model coverage SHALL explicitly include browser CSRF if cookie sessions are selected, mobile local-storage compromise, proxy/header and API-gateway abuse, object access leakage if enabled, backup/restore exfiltration, queue producer spoofing, CI/CD artifact tampering, admin/support impersonation, break-glass misuse, and FCM recipient/retry compromise. Each scenario records asset, actor, entry point, trust boundary, controls, residual risk, a SEC control ID, and a test ID from §108.1. Control maturity is `DESIGN_ONLY` until its stated evidence exists; this document does not claim implementation or compliance evidence.

### 108.5 Canonical Section-Content Reconciliation

The literal numbered titles are the canonical control index. Earlier draft prose in §§1–35 is supplemented and, where its broad placement differs from its title, governed by the following title-specific requirements and cross-references: §§1–6 govern document purpose, scope, principles, objectives and assumptions; §§7–14 govern assets, classification, trust boundaries, methodology, threat model and actors through §§8–12 and §108.4; §§15–21 govern authentication, credential, session, device, revocation, lost/stolen and compromise behavior through §108.2; §§22–35 govern authorization, deny-by-default, least privilege, tenant, Parent, Driver, Super Admin, resource/action/field authorization and BOLA/IDOR/tenant-injection/mass-assignment protections through §§22–35, 41, and §108.1. If prose conflicts, the title-specific clauses in §§36–108 and §108.1–§108.4 take precedence. This removes reliance on broad introductory prose as evidence of a distinct control.

### 108.6 Boundary Threat-to-Control-to-Test Matrix

| Threat ID | Asset / actor / entry point | Trust boundary and scenario | Controls | Residual risk | SEC control / verification |
|---|---|---|---|---|---|
| SEC-T-006 | browser session / external attacker / cookie request | Browser→Internet→API: CSRF if cookie session is selected | CSRF contract, origin/session checks, safe errors, deny by default | exact session mechanism deferred | SEC-AUTH-001; SEC-TEST-AUTHZ-001 |
| SEC-T-007 | mobile local data / compromised device / local store | Driver/Parent device→API: stolen local evidence or token | provisional-only local state, revocation, minimization, reauthorization | device compromise before revoke | SEC-OFFLINE-001; SEC-TEST-REVOKE-001 |
| SEC-T-008 | API request scope / Internet attacker / headers | Internet/proxy→backend: forwarded-header or gateway abuse | trusted edge boundary, server-derived identity/tenant, validation/rate policy | edge placement implementation decision | SEC-TENANT-001; SEC-TEST-TENANT-001 |
| SEC-T-009 | sensitive object / unauthorized caller / artifact URL | backend→object storage: guessed/leaked temporary access | uploads disabled until authorized metadata, bounded access, audit/quarantine | object feature not enabled | SEC-DATA-001; object-access test required before enablement |
| SEC-T-010 | backups / insider or restore operator / restore workflow | backup/restore boundary: exfiltration or unsafe restored side effects | encryption, role separation, containment, audit, restore verification | key/recovery policy deferred | SEC-OPS-001; backup/restore security test |
| SEC-T-011 | outbox message / malicious producer / queue payload | backend/worker→queue: producer spoofing or replay | outbox-only source, ACLs, schema validation, lease/idempotency, canonical context recompute | worker identity implementation evidence pending | SEC-REPLAY-001; queue injection/replay test |
| SEC-T-012 | release artifact / supply-chain attacker / CI/CD input | CI/CD→production: altered dependency or artifact | provenance, protected release, approvals, scanning expectations | tooling evidence pending | SEC-OPS-001; release-integrity review |
| SEC-T-013 | child data/audit / support or admin / privileged session | admin/support→production: impersonation or break-glass misuse | purpose scope, expiry, audit, no direct browse/mutation | approval workflow policy deferred | SEC-AUDIT-001; break-glass expiry/audit test |
| SEC-T-014 | recipient/status / provider/retry path / FCM | worker→FCM: stale eligibility or retry compromise | minimal payload, dispatch revalidation, idempotent worker, token lifecycle | provider behavior outside platform control | SEC-NOTIFY-001; revoke/race/retry test |

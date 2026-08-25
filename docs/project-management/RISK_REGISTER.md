# Risk Register

## Phase 13.01

| ID | Risk | Severity | Mitigation/Disposition | Gate relevance |
|---|---|---|---|---|
| R-13-01 | Provisional token issuer lacks final expiry, audience, rotation, revocation and device policy | High | Production configuration fails closed; final policy remains required before production auth | Blocks production auth; does not block accepted foundation or authorized Tenant/School slice |
| R-13-02 | Identity status is an enforced but non-persistent provider hook | High | Guard invokes status verifier on every protected request; persistence is deferred outside slice scope | Blocks production identity lifecycle claim |
| R-13-03 | Runtime logger/readiness semantics are foundation-level and not operationally complete | Medium | Findings are recorded for Backend/Security re-review; no production observability/SLO claim | Non-blocking for foundation Gate, blocking for production readiness |
| R-13-04 | Live branch protection and repository Actions policy remain external governance decisions | Medium | No live policy mutation performed; Phase 12 decision preserved | Must resolve before implementation governance sign-off |

## Phase 13.02

| ID | Risk | Severity | Mitigation/Disposition | Gate relevance |
|---|---|---|---|---|
| R-13-02-01 | Final role-claim/membership serialization is not yet approved | High | Centralized provisional mapping; deny-by-default and no production claim | Blocks production identity/membership release |
| R-13-02-02 | Tenant/School lifecycle URL/method and exact field policy are underspecified in API source | Medium | Minimal documented resource methods implemented; assumptions explicitly recorded; no extra endpoints | Requires product/API decision before expansion |
| R-13-02-03 | Local environment lacks PostgreSQL | Medium | CI provisions immutable PostgreSQL image and executes migration/integration evidence; local NOT_EXECUTED remains explicit | Non-blocking for CI Gate, limits local reproduction |
| R-13-02-04 | Rejected authorization attempts are not durably audited | Medium | Accepted mutations are transactionally audited; add privacy-safe denial telemetry before sensitive domains/production | Non-blocking open question for Slice 13.02 |

## Phase 13.03 Users

| ID | Risk | Severity | Mitigation/Disposition | Gate relevance |
|---|---|---|---|---|
| R-13-03-01 | Non-UUID provisional/bootstrap identities could bypass DB-backed authority if enabled in production | Medium | Restrict to test/bootstrap flows and fail closed for production authentication | Non-blocking for accepted slice; blocks production auth |
| R-13-03-02 | Denied or foreign authorization attempts lack durable security audit signals | Medium | Preserve privacy-safe denial telemetry/audit as a follow-up before sensitive-domain or production release | Non-blocking follow-up |
| R-13-03-03 | Users and Tenant/School use separate PostgreSQL pools | Medium | Track shared-boundary/configuration convergence as operational debt | Non-blocking follow-up |
| R-13-03-04 | API pagination, multi-membership representation, 409 contract, and race-test evidence need hardening | Medium | Carry into the appropriate API/QA backlog before expansion | Non-blocking follow-up |
| R-13-03-05 | Super Admin cross-tenant and delegation semantics need explicit documentation | Medium | Record ADR/backlog clarification; preserve current platform-wide policy | Non-blocking follow-up |

## Phase 12

| ID | Risk | Severity | Mitigation/Disposition | Gate relevance |
|---|---|---|---|---|
| R-12-01 | Direct commits or mutable CI policy bypass intended review controls | High | Governance proposal and pinned workflow are present; branch ruleset/Actions policy requires Commander authorization | Must resolve before implementation governance sign-off |
| R-12-02 | Future feature work enters reserved boundaries without approved architecture | Medium | Non-executable marker files and CI validation establish boundaries; implementation remains locked | Does not block foundation artifact completion |

| ID | Risk | Impact | Status / Mitigation |
|---|---|---|---|
| R-001 | Offline synchronization conflicts and ordering | High | Define policy in PRD/Data/API phases; require idempotency and server validation |
| R-002 | Exposure of sensitive child data | Critical | Tenant isolation, least privilege, audit and security design |
| R-003 | Scale transition from pilot to 1M+ students | High | Modular boundaries, stateless services, async processing and benchmarks |
| R-004 | Ambiguous jurisdiction and retention rules | High | Open question before final security/privacy specification |
# Risk Register

## Phase 07

| ID | Risk | Severity | Mitigation/Disposition | Gate relevance |
|---|---|---|---|---|
| R-07-01 | Offline access survives revocation | High | Bounded authority, local lock/purge, server rejection/audit; duration policy pending | Must resolve before Driver production/security sign-off |
| R-07-02 | Audit evidence manipulation/loss | Medium | Audit integrity policy explicitly requires ordered tamper-evident evidence, independent verification checkpoints, restricted administration, durable intent and escalation; retention/compliance remain pending | Verify design preserves invariants before implementation |
| R-07-03 | Session/device compromise | High | Session/device lifecycle policy and privileged re-authentication pending | Must resolve before implementation security sign-off |
| R-07-04 | Async notification loss/phantom delivery | High | Transactional outbox candidate and idempotent workers documented | Architecture constraint captured; test evidence pending |
| R-07-05 | Event-burst/retry overload | High | Protected critical capacity and bounded non-critical work documented | Load/failure evidence pending |
| R-07-06 | Stale dashboard/read state | Medium | Derived read model, freshness and rebuildability constraints documented | Test evidence pending |

## Phase 08

| ID | Risk | Severity | Mitigation/Disposition | Gate relevance |
|---|---|---|---|---|
| R-08-01 | Cross-tenant reference leakage | High | Composite ownership enforcement and tenant-integrity matrix documented | Blocks schema/implementation if violated |
| R-08-02 | Duplicate/conflicting offline transport effect | High | Scoped fingerprint idempotency and transition serialization documented | Blocks transport implementation until preserved |
| R-08-03 | Outbox duplicate/lost sensitive side effect | High | Durable lease/dedup/payload policy documented | Blocks worker/notification implementation until preserved |
| R-08-04 | Audit evidence ambiguity or tampering | High | Atomic audit evidence and verification trust boundary documented | Blocks audit security claims until preserved |
| R-08-05 | Partitioning weakens global uniqueness | Medium | Deferred DB-ADR-018 before partition activation | Does not block pilot documentation |
| R-08-06 | Sensitive export leak | Medium | Export disabled pending lifecycle approval | Does not block baseline transport MVP |

## Phase 09

| ID | Risk | Severity | Mitigation/Disposition | Gate relevance |
|---|---|---|---|---|
| R-09-01 | Replayed critical result leaks after revoked authority | High | Authenticate and reauthorize before safe replay; deny without original protected body | Must be preserved in implementation |
| R-09-02 | Offline batch ambiguity causes false transport confirmation | High | Per-item identity/outcome, dependency ordering, response-loss retry and no aggregate fabricated success | Must be testable before Driver release |
| R-09-03 | Privileged or cross-tenant field escalation | High | Endpoint/action/field matrix, server-derived scope, allowlists and audit | Must be enforced by security review |

## Phase 10

| ID | Risk | Severity | Mitigation/Disposition | Gate relevance |
|---|---|---|---|---|
| R-10-01 | Security design controls are not yet implemented or tested | High | §108.1 acceptance matrix; execution evidence required before implementation/production claim | Does not block documentation Gate; blocks security-effectiveness claim |
| R-10-02 | Historical offline authority is ambiguous | High | Default current-authority denial; exception disabled until Commander-approved policy | Blocks Driver offline production release |
| R-10-03 | Tenant/worker/audit/cache boundary bypass | High | §108.3 defense-in-depth contract and later enforcement evidence | Blocks implementation security sign-off |
| R-10-04 | Child-data retention/jurisdiction obligations unknown | High | Explicit legal/policy dependency; no compliance claim | Blocks production privacy/compliance release |

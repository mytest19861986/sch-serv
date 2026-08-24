# UX Information Architecture and Interaction Specification

## 1. Document Control
- Phase: 06 — UX
- Status: Draft / Commander Review
- Mode: UX specification only
- Implementation and pixel design: Forbidden

## 2. Purpose
Define product-level information architecture, interaction behavior, states, accessibility and localization expectations for the four product surfaces.

## 3. Scope
Driver Android App, Parent Android App, School Dashboard and Super Admin Dashboard. This document does not define CSS, component code, API or database behavior.

## 4. UX Principles
Safety-first; minimum cognitive load; truthful state; least privilege; sensitive-data minimization; clear recovery; no unsupported real-time promises; consistent terminology.

## 5. Product Surface Overview
Driver executes assigned transport; Parent monitors linked children; School operates daily services; Super Admin governs platform context with explicit privileged access.

## 6. Information Architecture
Driver: Home → Assigned Service → Student Roster → Event Action → Sync/Exception. Parent: Home → Children → Current Status → History/Notifications. School: Overview → Services → Students → Assignments → Exceptions → Audit. Super Admin: Tenants → Schools → Privileged Users → Oversight/Audit.

## 7. Navigation Model
Navigation SHALL preserve role/tenant context, expose only legitimate destinations, maintain a clear back path and avoid deep links that bypass authorization.

## 8. Shared UX Patterns
Every surface uses consistent loading, empty, forbidden, unavailable, pending, retry and success/failure patterns. Business, sync and notification statuses are visually and linguistically distinct.

## 9. Status and Terminology Model
Transport: Not started, Pending Pickup, Picked up, Dropped off, Exception. Sync: Local pending, Syncing, Synced, Retry pending, Needs attention. Notification: Requested, Pending, Sent/Accepted, Delayed/Failed. “Sent” never means “read”.

## 10. Driver App IA
Primary path is assigned service → roster → clearly separated Pickup/Drop-off action → feedback → next student. Sync status remains visible without distracting from safe operation.

## 11. Driver Screen Inventory
Login; assigned services; service detail; student roster; student action; pending sync; failed sync/attention; connectivity/recovery; account/session state.

## 12. Driver Service List UX
Show only active authorized assignments, service date/context and actionable state. No assignment shows a truthful empty state; revoked/expired assignment shows a safe denial.

## 13. Driver Service Detail UX
Show route/service context, assignment status, progress and next action. Do not expose unrelated students, family data or administration controls.

## 14. Driver Student Roster UX
Use clear identity minimums, ordered operational list and distinct completed/pending/exception indicators. Search/filter must remain assignment-scoped.

## 15. Driver Event Action UX
Pickup and Drop-off are separate primary actions with explicit labels. Confirmation is required when ambiguity or safety risk exists, but not mechanically where it creates harmful delay. Duplicate actions return an explicit idempotent result.

## 16. Driver Offline and Sync UX
Local acceptance is immediately visible as pending, never as server-confirmed. Syncing, retry pending, failed/needs attention and recovered states are distinct and actionable. Connectivity restoration may trigger retry but not duplicate action.

## 17. Parent App IA
Home → linked child selector → current transport status → limited history → notifications. A parent with multiple linked children switches only among authorized relationships.

## 18. Parent Child Overview UX
Show minimum necessary child identity and current state. Removed or unauthorized relationships show a privacy-safe unavailable state, not historical leakage.

## 19. Parent Notification UX
Notification copy identifies event meaning and uncertainty accurately. Deep links land in an authorized child context; delivery does not imply read acknowledgement.

## 20. Parent History UX
History is limited by approved policy, clearly distinguishes event state from notification state and shows unavailable/retention outcomes without inventing data.

## 21. School Dashboard IA
Overview → daily services → route/student state → exceptions → authorized audit context. Current operational state is primary; raw event history is secondary.

## 22. School Operational Overview UX
Prioritize active services, exceptions and stale-data indicators. Filters remain tenant- and role-scoped; empty operations are explicit.

## 23. School Service and Student UX
Service detail shows authorized route/student status and last-known freshness. Student inspection never exposes unrelated family or tenant data.

## 24. Exception UX
Group invalid transitions, sync failures, notification delays, revoked assignment and unavailable backend into actionable categories. Do not imply that an exception was resolved until evidence exists.

## 25. Super Admin IA
Tenants → schools → privileged users → platform oversight → audit. Routine child-data browsing is not a default destination.

## 26. Super Admin Sensitive Actions UX
Role changes, disablement, assignment changes, guardian linking/removal and tenant actions require clear scope, impact, safe confirmation where needed and audit outcome.

## 27. Authorization UX
Controls users cannot legitimately use SHOULD be hidden or disabled with safe explanation. Server-side authorization remains authoritative; hidden controls are not a security boundary.

## 28. Empty States
No assigned service; no linked children; no routes; no students; no active service; no history/notifications; no exceptions. Each state explains scope and the next legitimate action without fabricated content.

## 29. Error States
Backend unavailable, permission denied, expired session, partial/stale data, rejected action, failed sync and notification unavailable each require distinct, truthful copy and recovery guidance.

## 30. Loading and Refresh Behavior
Show what is loading and preserve safe last-known context where appropriate. Refresh may be manual or product-triggered; no zero-latency or guaranteed real-time promise is made.

## 31. Safety-Sensitive Confirmation Policy
Require confirmation for ambiguous, destructive or high-impact actions. Avoid confirmation for routine, reversible Driver progression when the context is unambiguous; provide immediate undo/exception guidance only where product policy allows.

## 32. Accessibility
Support readable contrast, scalable text, sufficiently large touch targets, keyboard navigation on web, screen-reader semantics, focus visibility and non-color-only state indicators.

## 33. Localization and RTL
Text must be externalizable; Persian/RTL layouts must support mirrored navigation and readable mixed-direction identifiers. Status meaning must not depend on word order or color alone.

## 34. Responsive Web Behavior
Desktop supports operational density; tablet preserves primary controls and readable tables; narrow view prioritizes current service and exception actions. No CSS implementation is specified.

## 35. UX Security and Privacy
Notifications, shared screens, logs/messages, search and deep links must minimize sensitive child data and enforce tenant/relationship boundaries. UI state must not reveal unrelated-object existence.

## 36. Interaction Feedback Language
Use consistent concepts: “Saved on this device”, “Waiting to sync”, “Syncing”, “Confirmed by service”, “Retry pending”, “Needs attention”, “Notification delayed”. Avoid “successful” when only local acceptance occurred.

## 37. Traceability
Driver action views map to FLOW-PICKUP/DROPOFF/OFFLINE and US-PICKUP/DROPOFF/OFFLINE. Parent views map to US-PARENTAPP/NOTIFY. Dashboard/admin views map to US-DASH/SUPER/AUDIT and AUTHZ/ROLE requirements.

## 38. UX Acceptance Criteria
- All four surfaces have IA and screen inventories.
- Driver flow separates Pickup, Drop-off and sync states.
- Parent flow protects linked-child boundaries.
- Dashboard prioritizes current state and exceptions.
- Super Admin sensitive actions are explicit and auditable.
- Empty/error/offline/accessibility/RTL expectations are documented.
- No pixel-level or implementation artifacts are introduced.

## 39. Open Policy Dependencies
- NON_BLOCKING: exact confirmation thresholds, history presentation limits, exception copy and support escalation.
- FUTURE_DECISION: student login, continuous GPS, advanced analytics, additional channels and rich personalization.
- BLOCKING: none identified for this UX specification.

## 40. Assumptions
Approved flows/stories/roles are authoritative; notification delivery is not read acknowledgement; dashboard updates may be eventual; ZIP is unavailable and unverified; restrictive authorization remains default.

## 41. Risks
Cognitive overload during transport, ambiguous status language, sensitive data on shared screens, stale dashboard interpretation, RTL layout errors and excessive confirmation friction.

## 42. UX QA Mapping
QA SHALL exercise each surface’s main, empty, error, forbidden, loading and degraded states; Pickup/Drop-off feedback; offline sync feedback; parent privacy; dashboard stale state; Super Admin audit prompts; accessibility and RTL behavior.

## 43. Security Review Mapping
Review tenant isolation, relationship-bound Parent visibility, assignment-bound Driver controls, hidden/disabled unauthorized actions, notification minimization, deep-link authorization, shared-screen privacy and privileged-action audit cues.

## 44. Phase Gate Checklist
- [x] Four product surfaces covered.
- [x] IA, navigation and screen inventory covered.
- [x] Driver offline/sync and safety actions covered.
- [x] Parent, dashboard and Super Admin UX covered.
- [x] States, errors, accessibility, RTL and privacy covered.
- [x] Traceability and QA/security mappings present.
- [ ] Commander approval pending.

Recommendation: `PASS_WITH_NON_BLOCKING_OPEN_QUESTIONS`.

## 45. Audit Appendix

Sources: approved Discovery, PRD, User Roles, User Stories, User Flows, Project Control Center and Commander constraints. Master Pipeline ZIP is unavailable and unverified. No code, API, schema, dependency or pixel design was created.

## 46. Surface Entry Points

Each surface has an explicit authorized entry point; deep links must re-check session, role, tenant and relationship context before showing content.

## 47. Primary Action Hierarchy

Each view has one safe primary action, clearly separated secondary actions and no privileged action presented as routine work.

## 48. Driver Attention Model

Driver interaction prioritizes the next assigned student and current safety-sensitive action, minimizing navigation and nonessential information while operating transport.

## 49. Pickup/Drop-off Visual Distinction

Pickup and Drop-off use distinct wording and feedback so the operator cannot confuse business transitions. Pending local actions are never styled as confirmed server events.

## 50. Sync Attention Model

Pending, retry and failed synchronization remain discoverable from the Driver primary path without blocking safe continuation of unrelated assigned work.

## 51. Notification Deep-Link Safety

Notification links open only after authorization and relationship checks; expired, removed or unrelated links show a privacy-safe unavailable state.

## 52. Search and Filter Safety

Search and filters operate only within the user's authorized tenant, assignment or relationship scope and do not reveal counts or suggestions from protected unrelated records.

## 53. Shared-Screen Privacy

Summaries and notifications minimize child information likely to appear on shared or locked screens; sensitive detail requires an authorized surface.

## 54. Audit Feedback

After sensitive or privileged actions, the UX communicates that the action was recorded for oversight without exposing internal implementation details.

## 55. Permission Revocation UX

If role, assignment or relationship access is revoked during an active session, protected controls stop safely and the user receives a clear reauthentication or escalation path.

## 56. Stale-Data Communication

When dashboard or parent data may be stale, the interface identifies freshness uncertainty and avoids presenting last-known state as current confirmed state.

## 57. Partial-Data Communication

If some records load and others fail, the UX distinguishes partial availability from empty data and offers safe retry without duplicating actions.

## 58. Retry Friction Policy

Retries are visible and bounded from the user's perspective; repeated actions do not require repeated destructive confirmation and do not create duplicate business effects.

## 59. Destructive Action Recovery

Disabling a user, removing a relationship or changing an assignment requires clear impact information and a recoverable path where policy permits.

## 60. Role-Specific Copy

User-facing copy names the relevant operational concept without exposing role internals or implying capabilities the current actor does not possess.

## 61. Error Copy Privacy

Errors identify the next safe action but do not disclose whether unrelated students, families, tenants or assignments exist.

## 62. Input and Validation Feedback

Validation feedback is local, specific and actionable; it distinguishes incomplete input from authorization denial and service unavailability.

## 63. UX Decision Record

Open UX decisions are recorded with owner, classification and downstream impact; no unresolved decision silently becomes an implementation requirement.

## 64. Reconciliation Note

The initial validation counted 45 headings. Nineteen explicit UX sections (46–64) were added during Commander-requested reconciliation. The resulting artifact now contains 64 literal top-level sections; no implementation artifact was introduced.

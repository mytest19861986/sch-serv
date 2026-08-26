# User Roles and Authorization Boundaries

## 1. Document Control

- Phase: 03 — User Roles
- Status: Draft / Commander Review
- Mode: Product and access specification only
- Implementation: Forbidden
- Next phase: Phase 04 User Stories remains locked.

## 2. Purpose

Define the product-level distinction between actors, authenticated roles, domain entities and system actors, together with tenant boundaries, ownership, surface access and authorization intent. This document does not define database tables, JWT claims, endpoints, middleware or code.

## 3. Actor vs Role Model

- An **actor** is a human, domain entity or system that participates in a product flow.
- An **authenticated role** is an authorized human capacity with a defined scope.
- A **domain entity** is represented by the product but is not automatically an authenticated user.
- A **system actor** performs bounded, auditable work on behalf of the platform.
- Student is a domain entity, not an authenticated role, unless a later product decision explicitly authorizes student login.

## 4. Global Authorization Principles

- AUTHZ-001: The product SHALL deny by default.
- AUTHZ-002: Access SHALL use least privilege and explicit authorization context.
- AUTHZ-003: Tenant isolation SHALL prevent normal access to another tenant's protected data.
- AUTHZ-004: Possessing an object identifier SHALL never grant access.
- AUTHZ-005: Sensitive child data SHALL be minimized and exposed only when necessary for the actor's task.
- AUTHZ-006: Privileged reads, writes, exports and access failures SHALL be auditable where applicable.
- AUTHZ-007: When authorization intent is unresolved, the product SHALL prefer denial.

## 5. Tenant and Ownership Boundaries

- A tenant represents an authorized school/business boundary for transport operations.
- School Admin, School Operator, Driver and Parent are tenant-scoped roles.
- Super Admin is platform-scoped but receives no implicit unrestricted child-data browsing.
- A student belongs to an authorized school context; a parent relationship does not override tenant boundaries.
- A driver owns no student data; the driver receives task-limited access through an active assignment.
- School ownership covers school configuration and operations within that tenant, not platform-wide administration.
- No cross-tenant access is allowed as a normal product capability. Any exceptional support process is a future decision and must be explicit, minimal, time-bounded and audited.

## 6. Product Surfaces

| Role/Actor | Driver App | Parent App | School Dashboard | Super Admin Dashboard | Backend Product Boundary |
|---|---:|---:|---:|---:|---:|
| Super Admin | No routine use | No routine use | Limited/support context only | Yes | Platform authority |
| School Admin | No | No | Yes | No | Tenant administration |
| School Operator | No | No | Yes | No | Daily operations |
| Driver | Yes | No | No | No | Assigned operations |
| Parent | No | Yes | No | No | Relationship-bound status |
| Student | No by default | No by default | Displayed as domain subject | No direct use | Domain entity |
| Notification Worker | No | No | No | No | Bounded notification task |

## 7. Role Definitions

### 7.1 Super Admin

- Purpose: operate and govern the platform across tenants.
- Responsibilities: tenant/school lifecycle, privileged-user oversight, platform audit and security oversight.
- Scope: platform-level administrative context.
- Sensitive data: minimum necessary access only; no default unrestricted child-data browsing.
- Prohibited: casual browsing of unrelated children, bypassing tenant controls, un-audited sensitive access and acting as a school user without explicit context.
- Requirements: ROLE-SUPER-001 SHALL require explicit platform authorization; ROLE-SUPER-002 SHALL audit privileged actions; ROLE-SUPER-003 SHOULD minimize child-data exposure.

### 7.2 School Admin

- Purpose: configure and administer one school/tenant.
- Responsibilities: school settings, authorized users, students, guardians, drivers, vehicles, routes and services at administrative level.
- Scope: one tenant; no platform-wide administration.
- Sensitive data: minimum necessary for school administration and authorized care operations.
- Prohibited: access to another tenant, platform security controls, or unassigned driver actions.
- Requirements: ROLE-SADMIN-001 SHALL be tenant-scoped; ROLE-SADMIN-002 SHALL separate configuration from platform administration; ROLE-SADMIN-003 SHALL audit sensitive administrative changes.

### 7.3 School Operator

- Purpose: run day-to-day transportation operations for one school/tenant.
- Responsibilities: monitor services, assignments, daily event status and operational exceptions.
- Scope: one tenant and operational data needed for the current work.
- Sensitive data: minimum necessary operational visibility.
- Prohibited: platform-wide settings, unrelated tenant data, and unassigned student event mutation.
- Requirements: ROLE-SOPS-001 SHALL be tenant-scoped; ROLE-SOPS-002 SHALL support daily operational views; ROLE-SOPS-003 SHALL not imply School Admin configuration authority.

### 7.4 Driver

- Purpose: execute assigned transport services.
- Responsibilities: view assigned route/service/student context, record Pickup/Drop-off and resolve sync states.
- Scope: active assignment, assigned service and assigned students only.
- Sensitive data: minimum route-required student information; no unrelated family or school administration data.
- Prohibited: assigning self, changing tenant configuration, viewing unrelated students or browsing historical data beyond authorized operational need.
- Requirements: ROLE-DRIVER-001 SHALL bind access to an active assignment; ROLE-DRIVER-002 SHALL authorize Pickup/Drop-off only in valid context; ROLE-DRIVER-003 SHALL expose sync failure without granting broader access.

### 7.5 Parent

- Purpose: monitor linked children's transportation status.
- Responsibilities: view own linked children, service status, event history permitted by product policy and notifications.
- Scope: explicit parent/guardian relationship and the child's tenant context.
- Sensitive data: only the minimum necessary information about linked children.
- Prohibited: unrelated student access, enumeration of students, cross-family access or school administration.
- Requirements: ROLE-PARENT-001 SHALL be relationship-bound; ROLE-PARENT-002 SHALL support multiple linked children where authorized; ROLE-PARENT-003 SHALL prevent access through guessed identifiers; ROLE-PARENT-004 SHALL protect against cross-family access.

### 7.6 Student

- Type: domain entity, not an authenticated role by default.
- Ownership: associated with an authorized school and parent/guardian relationship(s).
- Exposure: displayed only to actors with a valid school, assignment or relationship scope.
- Prohibited: implicit login, self-service access or disclosure to unrelated actors.
- Requirements: ROLE-STUDENT-001 SHALL preserve school context; ROLE-STUDENT-002 SHALL minimize sensitive exposure; ROLE-STUDENT-003 SHALL require a future product decision before student authentication.

## 8. System Actors

### Notification Worker

Bounded system actor that processes approved notification intent. It may access only the minimum recipient and event context needed to deliver a notification, must not change school configuration, and must produce auditable success/failure state.

### System/Service Actor

Generic platform actor for approved background processing. It must have an explicit purpose, bounded data scope, fail-closed behavior and auditability. It is not a human role.

### Support/Admin Operations

Not a default business role. Any future support capability requires manager approval, explicit impersonation/support context, least privilege, time limitation and audit evidence.

## 9. Ownership and Access Intent

- AUTHZ-008: A user may read or change only objects inside their authorized tenant and role scope.
- AUTHZ-009: A parent may access only explicitly linked children.
- AUTHZ-010: A driver may access only active assigned route/service/student context.
- AUTHZ-011: School roles may not perform platform administration.
- AUTHZ-012: System actors may not acquire human business authority by default.
- AUTHZ-013: Sensitive exports, bulk views and administrative changes require explicit authorization and audit.

## 10. Pickup/Drop-off Authorization

- Only an authorized Driver in a valid active assignment may initiate a student Pickup/Drop-off action.
- The action must be attributable to driver, service and student context.
- Duplicate, invalid-order or unauthorized actions must be denied or surfaced as an explicit failure; they must not silently mutate state.
- School Operator may monitor and handle authorized operational exceptions but does not automatically gain driver mutation authority.
- Parent may observe an accepted result for a linked child but may not create the event.

## 11. Access-State Expectations

Every surface must distinguish unauthenticated, authenticated-but-forbidden, out-of-scope, unavailable and empty states without leaking whether unrelated protected objects exist. Error messages must not reveal cross-tenant or cross-family data.

## 12. Ambiguity Classification

### BLOCKING

None identified for this product-level role model. Deny-by-default applies where intent is unresolved.

### NON_BLOCKING

- Exact School Admin versus School Operator permission matrix.
- Multiple guardian relationship policy and dispute handling.
- Historical Driver visibility duration.
- Support escalation workflow.

### FUTURE_DECISION

- Student authentication.
- Temporary cross-tenant support access.
- Additional operational roles.
- Guardian invitation/revocation workflow details.

## 13. Security and Privacy Intent

Child identity, family relationships, transportation history and location information are sensitive. Every role must receive minimum-necessary exposure, tenant and relationship isolation, role-appropriate visibility, auditable privileged actions and protection against enumeration or inference of unrelated records.

## 14. Candidate Authorization Decisions

- ADR-R-001: Separate human roles from Student domain entity.
- ADR-R-002: School Admin and School Operator remain distinct concepts.
- ADR-R-003: Parent access is relationship-bound.
- ADR-R-004: Driver access is assignment-bound.
- ADR-R-005: Super Admin has platform authority without unrestricted child-data browsing.
- ADR-R-006: System actors receive bounded purpose-specific authority.

## 15. Evidence Provenance

- `DIRECT_MANAGER_DECISION`: governance and product authority.
- `COMMANDER_DECISION`: Phase 03 scope, security principles and ambiguity handling.
- `CONVERSATION_SOURCE`: approved Discovery and PRD.
- `MASTER_PIPELINE_SOURCE`: unavailable and not verified.
- `ASSUMPTION`: future decisions explicitly marked in Section 12.

## 16. Gate Recommendation

`PASS_WITH_NON_BLOCKING_OPEN_QUESTIONS`, pending Commander review. Phase 04 remains locked.


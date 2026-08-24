# Multi-Agent Review Protocol

## Purpose

Important design gates receive independent challenge before Commander approval. Reviews inform the Commander; they do not override direct Manager decisions or authorize implementation.

## Roles

| Role | Responsibility | Authority |
|---|---|---|
| Commander | Final technical, trade-off and gate decisions | Final decision owner |
| Codex | Documentation, repository operations, implementation only when authorized | Executes approved scope |
| Architecture Challenger | Alternatives, scale/complexity and hidden-risk review | Advisory |
| Security Reviewer | Tenant, privacy, abuse and threat review | Advisory |
| QA Reviewer | Testability, failure modes and regression evidence | Advisory |
| Product Reviewer | Product-scope and user-impact review | Advisory |

## Required Review Record

Every material finding records severity, evidence, recommendation, disposition (`ACCEPTED`, `PARTIALLY_ACCEPTED`, `REJECTED`, or `DEFERRED`) and rationale. Missing preferred models use a suitable independent fallback; unavailability alone is not a project blocker.

## Gate Rule

No specialist review by itself closes a gate. Commander approval is required. Documentation-only phases remain documentation-only unless the Commander explicitly authorizes a later phase.

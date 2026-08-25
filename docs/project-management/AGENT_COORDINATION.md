# Agent Coordination

| Role | Responsibility |
|---|---|
| Commander | Final coordination and technical authority |
| Codex | Repository executor and documentation/mechanical executor |
| Gemini | Rapid analysis and research specialist |
| Qwen | Deep review and security challenger |
| QA | Test strategy and acceptance validation |
| Security | Threat modeling, authorization and privacy review |
| Database | PostgreSQL, audit, partitioning and query review |
| DevOps | CI/CD, deployment, observability and scaling |

No specialist agent may bypass the project gate or authorize implementation independently.

## Governance Rule GOV-001 — Autonomous Phase Progression

The Commander evaluates a passing Gate, closes it, unlocks and authorizes the
next phase, and issues its complete task without waiting for a separate Manager
approval. The Manager's explicit hold/stop, a material external-governance
change, production-impacting irreversible action, cost/legal commitment, or an
unresolved fundamental business requirement remains an escalation boundary.

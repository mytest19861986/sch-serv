# Slice 13.01 — Foundation Runtime and Authentication Base

Status: IN_PROGRESS. Branch: `phase13/foundation-auth`.

## Delivered scope

- NestJS/TypeScript runtime bootstrap, health/readiness, strict configuration, JSON structured logging, and correlation IDs.
- Stable privacy-safe API error envelope.
- Provisional configurable HMAC token boundary, deny-by-default credential verifier, current principal context, identity-status hook, and deny-by-default authorization policy.
- Authentication and authorization foundation tests; no business domain, PostgreSQL schema, migration, Redis, or client surface.

## Provisional implementation decision

The token boundary is explicitly provisional. See `services/backend/PROVISIONAL_IMPLEMENTATION_DECISION.md`. No credential store, session lifetime, refresh, rotation, device limit, or final production policy is implemented.

## Dependency record

| Dependency | Version family | Purpose / why required | Alternative | Risk / decision |
|---|---|---|---|---|
| NestJS core/common/platform-express | 11.2.x | Approved NestJS runtime and HTTP boundary | hand-rolled Node HTTP | Maintained approved direction; accepted |
| jose | 6.2.x | Provisional signed-token abstraction | custom crypto | No transitive dependencies; accepted; final token policy deferred |
| reflect-metadata, rxjs | locked transitive/runtime | NestJS runtime requirements | none practical | accepted |
| TypeScript, Jest, ts-jest, Supertest, ESLint, types | locked dev tooling | type/lint/unit/integration evidence | untested tooling | accepted for required validation only |

`esbuild` and `unrs-resolver` postinstall scripts were inspected as transitive test/dev tooling and are allowlisted narrowly by pnpm. No allow-all build script policy is used.

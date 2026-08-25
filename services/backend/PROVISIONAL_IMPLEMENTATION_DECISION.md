# Provisional Implementation Decision — Authentication Token Boundary

Phase 13.01 needs an executable authentication boundary while the approved
specifications defer the final credential, session, device, rotation, and
lifetime policy. This slice therefore uses a configurable HMAC-signed JWT only
as a **provisional implementation**, behind token-issuer and credential-verifier
interfaces.

- The signing secret comes only from `AUTH_PROVISIONAL_SIGNING_SECRET`; it is
  never committed or logged.
- No expiry, refresh, device-limit, rotation, or credential policy value is
  hard-coded. These require a later approved decision.
- The default credential verifier denies login. Tests inject a verifier; this
  foundation creates no production account or credential.
- The default identity-status hook is replaceable and provides disabled/revoked
  rejection at the protected-request boundary.
- Token claims are treated as server-issued context, while client tenant headers
  are ignored for authorization.

This document is not a final production authentication policy.

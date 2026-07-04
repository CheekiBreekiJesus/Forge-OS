# Outreach Send Jobs Security Review

Date: 2026-07-03

## Reviewed Areas

| Area | Current result |
|------|----------------|
| Cross-tenant access | Server mutations derive tenant from Supabase Auth plus active tenant membership in production. |
| Service-role exposure | Server-only durable store reads `SUPABASE_SERVICE_ROLE_KEY`; client UI does not import it. |
| Duplicate execution | Recipient idempotency keys plus attempt conflict handling prevent duplicate accepted sends. |
| Lock bypass | IndexedDB uses local TTL locks; Supabase lock acquisition uses an RPC update/returning path. |
| Daily real-send usage | Supabase usage increment is an atomic RPC; simulation does not consume allowance. |
| Suppression race | Processing rechecks suppression immediately before provider invocation. |
| Unbounded processing | One invocation processes at most one configured batch. |
| Retry loops | Retryable failures are scheduled for later and capped by `maxRetries`. |
| Payload leakage | Attempts persist sanitized codes/messages only, not API keys, headers, bodies, or provider payload dumps. |

## Fixed In This Pass

- Added server-only Supabase REST helpers for send jobs, recipients, attempts, lock release, lock acquisition, and usage increments.
- Added database-side daily usage increment RPC to avoid read-modify-write races.
- Added mocked REST tests confirming service-role headers, payload shape, RPC paths, and absence of secret payload logging.
- Added trusted send-job server route boundaries for queue, process, pause, resume, cancel, retry, and status.
- Added explicit send-job permission checks and cross-tenant route tests.
- Added sanitized status responses and sanitized route error tests.
- Added production Supabase Auth bearer-token adapter and active tenant-membership lookup.
- Added hosted campaign/recipient projection migration and server-only hosted repository bundle.
- Added static SQL migration checks for service-role grants, RLS, lock RPCs, daily usage RPCs, and hosted projection tables.

## Remaining Production Risks

1. **Trusted tenant selection:** users with multiple active memberships are rejected until Step 7D2 adds a trusted selector.
2. **Hosted handoff UI:** approved local IndexedDB campaigns still need an explicit prepare-for-server route and UI.
3. **Hosted RLS policies:** send-job tables remain service-role-only for this milestone.
4. **Postgres integration validation:** migration and RPCs have not been applied to a local or hosted Supabase database in this pass.
5. **Real Brevo batch path:** provider wiring remains deferred to Step 9 approval.

## Finding Status

No Blocker or High findings are present in the local simulation path, mocked server-only REST helper, or Step 7D1 auth/repository boundary. Production send-job execution still requires non-production database validation and explicit hosted campaign preparation before pilot use.

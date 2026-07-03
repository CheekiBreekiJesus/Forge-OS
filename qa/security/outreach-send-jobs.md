# Outreach Send Jobs Security Review

Date: 2026-07-03

## Reviewed Areas

| Area | Current result |
|------|----------------|
| Cross-tenant access | Server mutations derive tenant from trusted actor context; production auth adapter still pending. |
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

## Remaining Production Risks

1. **Production auth adapter:** development/test trusted headers are not a production auth mechanism.
2. **Hosted repository adapter:** default route execution remains blocked until server persistence is configured.
3. **Hosted RLS policies:** send-job tables are service-role-only until hosted auth maps local tenant references to membership rows.
4. **Postgres integration validation:** migration and RPCs have not been applied to a local or hosted Supabase database in this pass.
5. **Real Brevo batch path:** provider wiring remains deferred to Step 9 approval.

## Finding Status

No Blocker or High findings are present in the local simulation path, mocked server-only REST helper, or Step 7C development/test server boundary. Production send-job execution remains blocked until the production auth adapter, hosted repository adapter, and database integration tests are complete.

# Outreach Send Jobs Security Review

Date: 2026-07-02
Reviewer: Composer stabilization pass

## Reviewed Areas

| Area | Local simulation | Production (incomplete) |
|------|------------------|-------------------------|
| Cross-tenant access | Tenant ID on every repo call | Supabase RLS draft; no server repo |
| Service-role exposure | Not referenced in client | Migration grants service_role only |
| Duplicate execution | Idempotency keys + attempt dedupe | Lock RPC draft untested in prod |
| Lock bypass | IndexedDB TTL lock (demo) | Needs atomic RPC hardening |
| Suppression race | Recheck before send | Same rule applies when live |
| Unbounded processing | Batch size cap enforced | Server route must preserve cap |
| Retry loops | Deferred retry, max count | Same |
| Payload leakage | Sanitized error fields only | Same |

## Findings Fixed In Composer Pass

- UI mislabeled simulation as "durable" — corrected to local simulation banners.
- Hardcoded English UI result strings — moved to i18n.
- Process button enabled while paused — disabled when job status is `PAUSED`.

## Findings Requiring Codex

1. **ID strategy:** UUID migration vs string IDs — mapping and injection risk if inconsistent.
2. **Trusted tenant:** Browser-supplied `tenantId` acceptable for local MVP only; production routes must derive tenant from auth.
3. **Lock RPC:** `security invoker` draft needs tenant guard and security-definer review.
4. **Server routes:** Queue/process mutations must not trust arbitrary campaign-recipient IDs from UI without server-side validation.
5. **Migration deployment:** Do not apply until ID and auth model are resolved.

## No Blocker/High Issues In Local Simulation Path

No service-role keys, real provider calls, or email bodies logged in send-job attempt records.

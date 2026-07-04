# Auth Status Checkpoint

## Implemented

- Supabase OAuth callback now resolves membership before application entry.
- `src/proxy.ts` refreshes sessions and protects localized app pages plus non-public API routes in Supabase mode.
- Pending, denied, and tenant-selection pages exist for `pt-PT` and `en`.
- Role-to-permission mapping is centralized in `src/lib/auth/permissions.ts`.
- Membership status/permissions migration exists and has static tests.

## Deferred

- Runtime migration application to local/staging Supabase.
- Hosted OAuth smoke test with Google and Microsoft.
- Full administrator UI for membership lifecycle operations.
- Fine-grained per-module route permission enforcement beyond active-membership gating.

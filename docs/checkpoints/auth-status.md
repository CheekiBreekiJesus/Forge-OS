# Auth Status Checkpoint

## Implemented

- Supabase OAuth callback now resolves membership before application entry.
- `src/proxy.ts` refreshes sessions and protects localized app pages plus non-public API routes in Supabase mode.
- Pending, denied, and tenant-selection pages exist for `pt-PT` and `en`.
- Role-to-permission mapping is centralized in `src/lib/auth/permissions.ts`.
- Membership status/permissions migration exists, has static tests, and was validated against a local fresh database chain plus a synthetic pre-auth upgrade path.
- The first-tenant bootstrap template is available at `scripts/admin/bootstrap-tenant-membership.sql`.

## Deferred

- Hosted OAuth smoke test with Google and Microsoft.
- Full administrator UI for membership lifecycle operations.
- Fine-grained per-module route permission enforcement beyond active-membership gating.
- Applying migrations to an explicitly approved staging Supabase project.

# Auth Activation Security Review

Date: 2026-07-05
Branch: `integration/jh-gomes-auth-activation`

## Reviewed Controls

- OAuth callback uses safe internal redirect handling and rejects external, protocol-relative, backslash, decoded-backslash, and auth-loop redirects.
- Supabase mode fails closed when public Supabase configuration is missing.
- `src/proxy.ts` requires authenticated Supabase user cookies and active membership for protected pages and non-public API routes.
- Tenant context is resolved server-side from `tenant_memberships`; browser headers and request body tenant fields do not authorize proxy access.
- Pending, suspended, and revoked memberships are denied tenant RLS access by `current_user_tenant_ids()`.
- `tenant_memberships.status` defaults to `pending`; activation is deliberate.
- First-owner bootstrap is explicit, dry-run capable, and validates existing `auth.users` and `tenants` rows.
- Service-role usage is confined to server-side utilities and is not imported by browser client code.
- OAuth codes, refresh tokens, provider secrets, service-role keys, and private customer data were not added to committed artifacts.
- Provider webhook and unsubscribe routes remain public to the app-session proxy because they retain independent authentication.

## Evidence

- Targeted auth/session/membership tests: 11 files, 72 tests passed.
- Full local Supabase migration reset passed.
- Synthetic upgrade validation passed and converted legacy `disabled` membership to `suspended`.
- Local Supabase integration test passed.
- Supabase DB lint passed with no schema errors.
- Supabase DB advisors completed and reported existing warnings, not new blocking auth activation failures.
- Hosted outreach migration static check passed.

## Limitations

- No real staging OAuth provider login was executed; provider credentials and an authorized non-production project were not configured in this worktree.
- Fine-grained per-module route permission checks remain deferred after active-membership gating.
- Supabase `current_user_tenant_ids()` is a `security definer` helper in `public`; it is intentionally simple and returns only active memberships.
- Supabase advisors reported existing RLS performance warnings, multiple permissive policy warnings, and mutable `search_path` warnings on outreach functions. Those are release-integration follow-up items because changing them would touch broader outreach runtime behavior.
- npm audit reports existing high-severity dependency findings; dependency remediation is outside this branch scope.

# Supabase Auth Membership Plan

## Current Session Mechanism

- OAuth sign-in starts in the localized login UI and exchanges the provider code in `/auth/callback`.
- `createSupabaseServerClient` uses `@supabase/ssr` with request cookies and attempts to write refreshed cookies where permitted.
- `resolveForgeOSSession` already calls `supabase.auth.getUser()` and then uses the service-role client to load active tenant memberships.
- Existing production API authorization does not trust browser-supplied actor, tenant, role, or permission headers.

## Current Public Routes

- `/[locale]/login`
- `/auth/callback`
- `/auth/signout`
- `/api/health/local`
- `/[locale]/unsubscribe`
- `/api/outreach/unsubscribe`
- `/api/outreach/brevo/webhook`
- Static assets and Next.js internals

## Current Protected Routes

The application pages are not protected at the route boundary yet. The minimum active-membership protected pages are:

- `/(pt-PT|en)` dashboard
- `/(pt-PT|en)/crm`, `/customers`, `/products`, `/orders`, `/production`, `/inventory`, `/machines`, `/maintenance`, `/marketing`, `/settings`
- LeadOps pages under `/(pt-PT|en)/leadops`
- Quotation, customizer, job-card, inventory subsection and product subsection pages
- Operational send-job API routes, except public webhooks and unsubscribe endpoints

## Existing Tenant Entities

- `tenants` has `id`, `name`, `slug`, `default_locale`, timestamps and later `tenant_key` additions.
- Business tables are tenant-scoped with `tenant_id`.

## Existing Membership Entities

- `tenant_memberships` exists with `tenant_id`, `user_id`, `role` and timestamps in the base migration.
- Runtime code already expects `status` and `permissions`, but the base table does not define them.
- Required statuses are `pending`, `active`, `suspended`, and `revoked`.

## Existing Role Model

- Current auth roles are `super_admin`, `company_owner`, `marketing_manager`, `outreach_operator`, `sales`, `owner`, and `viewer`.
- Required app roles add production, warehouse, maintenance, machine, accounting, customer portal, and supplier portal roles.
- A canonical permission mapping is required for both navigation and server enforcement.

## Migration Requirements

- Add `status`, `permissions`, invitation/approval metadata and indexes to `tenant_memberships`.
- Add check constraints for supported statuses and roles.
- Keep service-side/admin mutation as the membership activation path.
- Preserve RLS and avoid granting anonymous mutation access.
- Add explicit grants if hosted Data API access is required, because Supabase changed default table exposure behavior for new projects in 2026.

## Server/Client Boundary

- Browser may initiate OAuth only.
- Server derives authenticated user from Supabase cookies.
- Server derives tenant, membership, roles, and permissions from database membership rows.
- Browser tenant selectors are treated only as selectors and must be revalidated against authenticated memberships.
- Local preview role controls remain UI-only and must not authorize server actions.

## Test Strategy

- Unit-test redirect safety, route classification, membership status handling, role-permission mapping, and tenant selection.
- Unit-test missing Supabase config and local-demo/Supabase-mode separation.
- Extend callback tests to assert membership gating after code exchange.
- Keep Playwright tests deterministic and avoid real Google, Microsoft, or Supabase OAuth calls.

## Fail-Closed Behavior

- In `FORGEOS_PERSISTENCE_MODE=supabase`, missing Supabase config or missing cookies block application access.
- OAuth without active membership redirects to pending/denied/tenant-selection states and never falls back to demo tenant data.
- Pending, suspended, and revoked memberships cannot access tenant data.
- Local demo routes remain usable outside Supabase persistence mode.

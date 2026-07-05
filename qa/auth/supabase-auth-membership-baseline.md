# Supabase Auth Membership Baseline

## Preflight

- Worktree: `C:\Users\J35U5\Desktop\VS Code\Forge-OS-auth-membership`
- Branch: `feat/supabase-auth-membership`
- Starting commit: `cf97561`
- Expected base: `origin/feat/supabase-oauth-foundation`
- Working tree before implementation: clean

## Confirmed Current State

- Next.js App Router is used with locale routes under `src/app/[locale]`.
- `proxy.ts` / `middleware.ts` does not exist yet.
- OAuth routes exist at `src/app/auth/callback/route.ts` and `src/app/auth/signout/route.ts`.
- Safe redirect utilities exist at `src/lib/auth/safe-redirect.ts`.
- Supabase SSR server and browser client factories exist.
- `resolveForgeOSSession` authenticates with `supabase.auth.getUser()` and loads active memberships via the service-role client.
- Send-job actor context already ignores spoofed production actor headers and validates selected tenants against active memberships.

## Confirmed Gaps

- OAuth callback does not resolve membership after code exchange.
- Application routes are not protected at the route boundary.
- Session refresh is not wired through Next.js `proxy.ts`.
- There is no generic pending-access, denied-access, or tenant-selection UI.
- Existing `tenant_memberships` base migration does not define required `status` or `permissions` columns, even though runtime code expects them.
- Role and permission mapping is partial and outreach-focused.
- Local preview role controls are UI-only and must not be treated as server authorization.

## Protected Areas

This baseline intentionally avoids modifying:

- Brevo sending and provider webhooks.
- Email draft personalization.
- Cup customizer.
- Inventory ledger.
- Product imports.
- Quotation pricing.
- Dependency versions.

## Initial Implementation Cut

The safest first cut is:

1. Add the minimal membership schema repair migration.
2. Add reusable route classification, session refresh, role/permission, and membership-resolution utilities.
3. Add `proxy.ts` for session refresh and route redirects without touching business modules.
4. Add pending/denied/tenant-selection pages.
5. Wire OAuth callback into membership routing.
6. Add focused unit tests and docs.

## Validation Plan

- Targeted auth tests first.
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Broader E2E/acceptance only if time and environment remain stable; no real OAuth provider calls.

# Cursor Feature Convergence — Auth Overlap Report

**Date:** 2026-07-04  
**Feature branch:** `integration/jh-gomes-feature-convergence-cursor` @ `fdfa472` (pre-push)  
**Auth comparison branch:** `origin/feat/supabase-auth-membership` @ `ee821f9`

## Summary

This feature branch intentionally **does not** include auth membership enforcement (`ee821f9`) or OAuth foundation (`cf97561`). A separate Codex agent owns auth activation. Future merge must resolve overlaps without pre-emptive conflict resolution on this branch.

## Auth branch commits not in feature branch

| Commit | Description |
|--------|-------------|
| `cf97561` | feat(auth): add Supabase OAuth foundation |
| `ee821f9` | feat(auth): add Supabase membership enforcement |

## Feature branch commits not in auth branch

Cup customizer (~20 commits), table UI merge (`c8beba6`), outreach verification cherry-picks (`d7a4dca`, `fdfa472`), convergence baseline (`6b6cc99`).

## Overlap zones (expect merge conflicts)

### i18n dictionaries

- `src/i18n/dictionaries.ts`
- `src/i18n/locales/en.ts`
- `src/i18n/locales/pt-PT.ts`

**Nature:** Feature branch adds cup-customizer and table-density strings. Auth branch adds `authAccess`, login error codes, OAuth loading states, membership notes. **Resolution:** union both sides; auth agent owns auth strings.

### Login / auth UI

- `src/app/[locale]/login/page.tsx`
- `src/components/login-shell.tsx`
- `src/components/auth-access-shell.tsx` (auth-only)
- `src/app/[locale]/access/*` (auth-only)
- `src/app/auth/callback/route.ts`, `signout/route.ts` (auth-only)

**Nature:** Integration base already has cookie session wiring (`306c3a6`). Auth branch extends with membership gates and OAuth. **Do not merge auth UI into feature branch.**

### Proxy (protected)

- `src/proxy.ts` — auth branch adds +91 lines for route protection

**Excluded from this branch.** Auth agent resolves.

### Migrations (protected)

- `supabase/migrations/202607040001_auth_membership_status_permissions.sql` — auth-only

**Excluded.** No migrations applied on this branch.

### Auth library

- `src/lib/auth/membership.ts`, `permissions.ts`, `routes.ts`, `safe-redirect.ts`
- `src/lib/auth/session.ts`, `types.ts`
- `src/lib/supabase/browser-client.ts`, `tenant.ts`

**Auth-only additions.** Integration base has partial session wiring; auth branch supersedes.

### Persistence

- `src/persistence/indexeddb/customizer-repositories.ts` — feature-only (cup merge)
- `src/persistence/customizer-integration.test.ts` — feature-only
- No overlap with auth persistence paths (Supabase outreach repos unchanged by either side for auth)

### Test helpers

- `e2e/helpers/runtime.ts` — auth branch modifies; feature branch unchanged
- `src/features/email-delivery/send-job-actor-context.ts` — both branches may differ; auth branch has test updates

### E2E / acceptance

- `e2e/acceptance/01-settings-and-profiles.spec.ts` — auth-only
- `e2e/profile-email-branding.spec.ts` — auth-only

## Recommended final convergence order

1. Merge auth activation branch into integration base (or rebase auth onto latest integration).
2. Merge this feature branch (`integration/jh-gomes-feature-convergence-cursor`) into the auth-enabled integration.
3. Resolve i18n by union merge.
4. Keep auth-owned files from auth branch; keep cup/table feature files from this branch.
5. Re-run full validation including auth E2E and cup/table E2E.

## Policy

This feature branch must **not** resolve auth conflicts pre-emptively.

# Cursor Final Convergence — Auth Overlap Report

**Date:** 2026-07-05  
**Convergence branch:** `integration/jh-gomes-cursor-convergence` @ `c09c124`  
**Auth comparison branch:** `origin/feat/supabase-auth-membership` @ `ee821f9`  
**Auth activation worktree:** `Forge-OS-auth-activation` (`integration/jh-gomes-auth-activation`)

## Summary

This convergence branch combines feature work (cup customizer, table UI, outreach verification) with dependency security remediation (Playwright 1.61.1, xlsx removal, ExcelJS adapter). It **does not** integrate OAuth foundation, membership enforcement, `proxy.ts` route protection, or auth migrations. The auth activation agent must merge separately.

## Classification of overlapping files

### AUTH-OWNED (take from auth branch on future merge)

| Path | Notes |
|------|-------|
| `src/proxy.ts` | Route protection (+91 lines on auth branch) |
| `src/lib/auth/*` | membership, permissions, routes, safe-redirect, session, types |
| `src/lib/supabase/browser-client.ts` | Supabase browser client |
| `src/lib/supabase/tenant.ts` | Tenant resolution |
| `src/app/auth/callback/route.ts` | OAuth callback |
| `src/app/auth/signout/route.ts` | Sign-out |
| `src/app/[locale]/access/denied/page.tsx` | Access denied |
| `src/app/[locale]/access/pending/page.tsx` | Pending membership |
| `src/app/[locale]/access/tenants/page.tsx` | Tenant picker |
| `src/app/[locale]/login/page.tsx` | Login page (membership gates) |
| `src/components/auth-access-shell.tsx` | Access UI shell |
| `src/components/login-shell.tsx` | Login UI |
| `supabase/migrations/202607040001_auth_membership_status_permissions.sql` | Membership migration |
| `src/features/email-delivery/send-job-actor-context.ts` | Actor authentication context |
| `src/features/email-delivery/send-job-actor-context.test.ts` | Actor auth tests |
| `src/app/api/outreach/send-jobs/tenant-memberships/route.ts` | Tenant membership API |
| `src/app/api/outreach/send-jobs/prepare-campaign/status/route.ts` | Auth-gated status |
| `docs/auth/*` | Auth documentation |
| `qa/auth/*`, `qa/security/supabase-auth-membership.md` | Auth QA |

### UNION MERGE (combine both sides)

| Path | Notes |
|------|-------|
| `src/i18n/dictionaries.ts` | Feature: cup/table strings; Auth: access/login/OAuth strings |
| `src/i18n/locales/en.ts` | Union all keys |
| `src/i18n/locales/pt-PT.ts` | Union all keys |
| `e2e/helpers/runtime.ts` | Auth modifies login helpers; feature unchanged |
| `e2e/acceptance/01-settings-and-profiles.spec.ts` | Auth adds membership assertions |
| `e2e/profile-email-branding.spec.ts` | Auth extends profile tests |
| `package.json`, `package-lock.json` | Reconcile versions after auth merge |
| `docs/checkpoints/auth-status.md` | Auth checkpoint docs |

### FEATURE/DEPENDENCY OWNED (keep from convergence branch)

| Path | Notes |
|------|-------|
| `src/components/cup-customizer-shell.tsx` | Cup customizer UI |
| `src/features/cup-customizer/*` | Customizer domain |
| `src/persistence/indexeddb/customizer-repositories.ts` | Customizer persistence |
| `src/components/*-shell.tsx` (table consumers) | Table density/overlays |
| `src/features/shared/spreadsheet/*` | Secure spreadsheet adapter |
| `src/features/leadops/import-file-parser.ts` | ExcelJS-backed import |
| `e2e/cup-customizer.spec.ts` | Cup E2E |
| `e2e/table-density-overlay.spec.ts` | Table E2E |
| `e2e/lead-import-wizard.spec.ts` | Import E2E |
| `e2e/acceptance/03-leads-import-outreach.spec.ts` | Import/outreach acceptance |
| `e2e/acceptance/05-customizer-quotation-production.spec.ts` | Customizer acceptance |
| `docs/security/*`, `qa/security/dependency-*` | Dependency remediation docs |
| Playwright 1.61.1, exceljs 4.4.0, no xlsx | Dependency graph |

## Known 401 E2E failures (pre-auth)

These four specs fail with console `401 (Unauthorized)` until auth activation merges:

1. `e2e/campaign-release-checkpoint.spec.ts` — "adds suppression and blocks re-approval"
2. `e2e/campaign-review-manual-send.spec.ts` — full manual send flow
3. `e2e/campaign-templates-drafts.spec.ts` — template/draft persistence
4. `e2e/lead-segmentation.spec.ts` — campaign snapshot/recipients

Root cause: send-job / tenant-membership API routes return 401 without activated session enforcement. **Do not weaken test assertions.**

## Recommended auth integration order

1. Complete `integration/jh-gomes-auth-activation` in its worktree (do not touch from this branch).
2. Merge auth activation into `integration/jh-gomes-cursor-convergence` (or a new integration branch).
3. Resolve i18n by union merge (auth strings + feature strings).
4. Take auth-owned files from auth branch; keep feature/dependency files from convergence.
5. Re-run: `npm ci`, `validate`, `test:e2e`, `test:acceptance`.
6. Expect the four campaign E2E specs to pass once session enforcement is wired.

## Policy

This convergence branch must **not** pre-resolve auth conflicts or merge auth proactively.

# Code Hygiene Audit

**Audit date:** 2026-07-05  
**Base:** `integration/jh-gomes-outreach-supabase-7d2` @ `213dc3e`  
**Action:** No source modifications in this branch.

---

## Lint results (`npm run lint`)

**11 warnings, 0 errors**

| File | Line | Warning | Rank |
|------|------|---------|------|
| `scripts/data-preparation/profile-lead-files.mjs` | 17 | `countEmails` unused | safe mechanical cleanup |
| `src/application/campaign-draft-service.ts` | 395 | `updated` assigned unused | needs feature-owner review |
| `src/application/lead-import-service.ts` | 204 | `_displayIndex`, `_id`, `_createdAt` unused | safe mechanical cleanup |
| `src/components/settings-shell.tsx` | 372, 374 | `company`, `locale` unused | needs feature-owner review |
| `src/persistence/db.ts` | 11, 377 | `Campaign` import, `timestamp` unused | needs feature-owner review |
| `src/persistence/interfaces.ts` | 34, 50 | `Campaign`, `OutreachCampaign` unused | needs feature-owner review |

---

## Dead-code candidates

### Smartlead provider (obsolete)

| Location | Rank |
|----------|------|
| `src/features/leadops/providers.ts` — Smartlead env reads | needs feature-owner review — deprecated but tested |
| `src/features/leadops/providers.test.ts` | potentially still used |
| i18n strings mentioning Smartlead | do not remove until UI updated |

### Unused type imports

| Location | Rank |
|----------|------|
| `src/persistence/db.ts` — `Campaign` | safe mechanical cleanup |
| `src/persistence/interfaces.ts` — `Campaign`, `OutreachCampaign` | safe mechanical cleanup |

### Abandoned routes

All routes in `npm run build` output are reachable. No orphan `page.tsx` files found.

| Route | Status |
|-------|--------|
| `/[locale]/quotations/customizer` | Stub on base; full UI on feature branch — **do not remove** |
| `/api/demo/*` | Demo fixtures — **potentially still used** for dashboard |

### Duplicate helpers

No systematic duplicate-function scan run (would need static analysis tool). Manual review noted:

- `EMAIL_DELIVERY_PROVIDER` vs `OUTREACH_DELIVERY_PROVIDER` — intentional alias in `providers.ts`
- Supabase URL resolution duplicated in `env.ts`, `mode.ts`, `durable-outreach-store.ts` — consolidate later

### Obsolete feature flags

| Flag | Status |
|------|--------|
| Smartlead env vars | deprecated |
| `OUTREACH_REAL_SEND_ENABLED` | active (Brevo gate) |

### Demo code

| Area | Rank |
|------|------|
| `src/demo/` | potentially still used — demo workflow |
| `src/app/api/demo/*` | potentially still used |

---

## Unused environment variables

See `qa/repository/environment-variable-audit.md`. Code-referenced but deprecated: Smartlead family.

---

## Summary by rank

| Rank | Count | Examples |
|------|------:|---------|
| Safe mechanical cleanup | 4 | Unused imports, dead script function |
| Needs feature-owner review | 6 | Smartlead removal, settings-shell params |
| Potentially still used | 5+ | Demo routes, Smartlead tests |
| Do not remove | — | Customizer stub, persistence aliases |

---

## Post-convergence cleanup order

1. Fix lint warnings (mechanical)
2. Remove Smartlead code after Brevo path confirmed
3. Consolidate Supabase URL helpers
4. Remove demo API routes only if dashboard no longer references

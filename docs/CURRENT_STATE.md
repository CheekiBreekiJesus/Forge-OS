# ForgeOS Current State

**Document date:** 2026-07-05  
**Current integration branch:** `integration/jh-gomes-release-candidate`  
**Starting release-candidate base:** `integration/jh-gomes-cursor-convergence` @ `64a1ebd`  
**Auth source:** `integration/jh-gomes-auth-activation` @ `4b42cc7`  
**Repository-hygiene source:** `chore/repository-hygiene` @ `4e9a71d`

This file describes the consolidated JH Gomes release-candidate branch. It does not mean hosted Supabase, OAuth providers, Brevo, or production deployment have been externally configured.

---

## Implemented On The Release Candidate

### Application Foundation

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS.
- Node.js 22.x repository target with npm 10.9.8 recorded in `packageManager`.
- Localized routes for `pt-PT` and `en`.
- Industrial dashboard shell with light/dark theme support.
- Module routes for CRM/customers, products, inventory, quotations, jobs, production, LeadOps, settings, demo workflows, and operational placeholders.

### Cursor Feature Convergence

- Cup Customizer workflow, including artwork upload, preview, simulation persistence, and quotation integration.
- Table density and action overlay improvements.
- Lead import and outreach acceptance coverage.
- Playwright upgraded to 1.61.1.
- `xlsx` removed.
- ExcelJS 4.4.0 adopted through the shared spreadsheet parser with dynamic import.

### Supabase Auth Activation

- Supabase OAuth callback and sign-out routes.
- Next.js `src/proxy.ts` session refresh and route protection in Supabase mode.
- Active tenant-membership enforcement through `tenant_memberships`.
- Pending, denied, and tenant-selection access pages.
- Safe internal redirect handling for OAuth `next` values.
- Auth membership migration for canonical statuses: `pending`, `active`, `suspended`, `revoked`.
- Bootstrap and synthetic validation SQL under `scripts/admin/`.

### Outreach And Send Jobs

- Lead import, segmentation, campaign creation, draft generation, review/approve, simulation send, and manual-send handoff.
- Server-owned send-job APIs with actor context.
- Brevo provider boundary, webhook route, provider-event persistence, and unsubscribe route.
- Real sending remains disabled unless explicitly configured.

### Persistence

| Mode | Configuration | Storage |
|------|---------------|---------|
| Local | `FORGEOS_PERSISTENCE_MODE=local` | IndexedDB/Dexie for local demo workflows |
| Supabase | `FORGEOS_PERSISTENCE_MODE=supabase` plus Supabase URL/keys | PostgreSQL via `supabase/migrations/` and server repositories |

Supabase migrations are validated locally in this release-candidate workflow. Hosted migration application is still an external deployment action.

---

## Not Yet Externally Activated

| Item | Status |
|------|--------|
| Hosted Supabase migrations | Not applied by this branch |
| Google OAuth provider | Not configured in hosted Supabase |
| Microsoft OAuth provider | Not configured in hosted Supabase |
| Hosted callback URLs | Not configured by this branch |
| First real tenant membership | Not bootstrapped by this branch |
| Real staging OAuth smoke test | Not executed |
| Real Brevo batch delivery | Not enabled |
| Production Vercel deployment | Not performed |
| Supabase Storage artwork upload | Deferred |
| Browser UI fully reading from Supabase | Deferred beyond current outreach server path |

---

## Required Local Validation

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run test:acceptance
npm run build
npm run validate
```

Supabase/local database validation:

```bash
npx supabase db reset --local --yes
npm run test:supabase:integration
```

Use only local Docker or an explicitly approved non-production/staging Supabase target. Do not apply migrations to production from this branch.

---

## Known Follow-Up Items

1. Verify GitHub Actions on `integration/jh-gomes-release-candidate`.
2. Run real staging OAuth smoke only after provider configuration and explicit approval.
3. Review Supabase advisor warnings before release promotion.
4. Keep `uuid` moderate audit findings documented through ExcelJS until upstream updates or a reviewed override exists.
5. Continue repository cleanup only after the release-candidate branch is green.

---

## Historical Context

- `docs/ai-context/*` remains historical planning context.
- `qa/repository/*` contains hygiene audits from the repository-hygiene branch.
- Branch-specific QA reports under `qa/integration/`, `qa/security/`, and `qa/outreach/` are evidence snapshots and should not be rewritten except by a new explicit validation pass.

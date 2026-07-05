# ForgeOS — Current State

**Document date:** 2026-07-05  
**Base branch:** `integration/jh-gomes-outreach-supabase-7d2`  
**Base commit:** `213dc3e` (`chore(supabase): add local development configuration`)  
**Next update:** After `integration/jh-gomes-cursor-convergence` merges to release, or when auth activation lands.

> This file describes what is on the **integration base**. Work on unmerged branches is listed separately — do not assume it is already merged.

---

## IMPLEMENTED ON BASE (`213dc3e`)

### Application foundation

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS
- Localized routes (`pt-PT`, `en`), theme system, industrial dashboard shell
- Module routes: CRM, products, inventory sections, quotations, leadops, demo workflow
- Vitest: 276 tests passing (59 files); Playwright configs and CI e2e subset

### Persistence

| Mode | Configuration | Storage |
|------|---------------|---------|
| **Local** (default) | `FORGEOS_PERSISTENCE_MODE=local` | IndexedDB (Dexie) — full outreach CRUD |
| **Supabase** | `FORGEOS_PERSISTENCE_MODE=supabase` + Supabase URL/keys | PostgreSQL via `supabase/migrations/` |

- Tenant key: `tenant_jh_gomes` → UUID lookup helpers
- Supabase repository bundle for outreach vertical
- SQL integration test: `npm run test:supabase:integration` (needs `FORGEOS_TEST_DATABASE_URL`)

### Outreach (JH Gomes priority)

- Lead import (CSV/XLSX), mapping profiles, campaign workflow
- Draft generation (deterministic + AI provider gateway)
- Review, approve, manual send handoff (Gmail/Outlook URLs)
- Simulation delivery and send-job API routes
- Server-owned send: `POST /api/outreach/messages/{messageId}/send`
- Atomic delivery claim RPC, send attempts, campaign recipients tables
- Brevo webhook route and provider-event persistence (test-send gated)
- Unsubscribe token flow

### Auth on base (limited)

- Supabase client/session scaffolding (`src/lib/auth/session.ts`)
- Test/E2E auth adapter (`FORGEOS_TEST_AUTH_ENABLED`, `FORGEOS_E2E`)
- Dev header auth (`FORGEOS_ALLOW_DEV_AUTH_HEADERS`, non-production only)
- **Not on base:** production OAuth login, full membership enforcement UI

### Migrations present (not applied by this doc)

10+ SQL files under `supabase/migrations/` including outreach schema, send jobs, RLS policies, tenant keys.

---

## COMPLETED ON UNMERGED BRANCHES

| Area | Branch | Status |
|------|--------|--------|
| OAuth login (Google/Microsoft) | `feat/supabase-oauth-foundation` | Complete on branch |
| Tenant membership enforcement | `feat/supabase-auth-membership` | Complete on branch |
| Auth activation integration | `integration/jh-gomes-auth-activation` | In test on branch |
| Cup Customizer UI | `feat/cup-customizer-integration-ui` | Active on branch |
| Cup preview layout fix | `fix/cup-customizer-preview-layout` | Merged into cup feature branch |
| Table density + action overlays | `fix/table-density-and-action-overlays` | Ready for convergence |
| Playwright audit remediation | `fix/playwright-audit-remediation` | Ready for convergence |
| XLSX security remediation | `fix/xlsx-security-remediation` | Ready for convergence |
| Product data staging import | `feat/jhgomes-product-data-staging` | On branch |
| Inventory product foundation | `feat/inventory-product-foundation` | WIP on branch (dirty worktree) |
| Dependency security convergence | `integration/dependency-security-cursor` | Active convergence |
| Feature convergence | `integration/jh-gomes-feature-convergence-cursor` | Active convergence |
| Final convergence | `integration/jh-gomes-cursor-convergence` | Active convergence |

---

## IN PROGRESS

- **Auth activation** — merging OAuth + membership into deployable path (`Forge-OS-auth-activation`)
- **Cursor feature convergence** — table UI, xlsx fix, playwright fix, cup customizer
- **Cursor dependency convergence** — package security alignment
- **Repository hygiene** — canonical docs and cleanup inventories (`chore/repository-hygiene`)

---

## EXTERNAL SETUP REQUIRED

These are not complete in any branch without operator action:

| Item | Notes |
|------|-------|
| **OAuth providers** | Google/Microsoft app registration in Supabase dashboard |
| **Supabase project** | URL, anon key, service role, hosted PostgREST |
| **Migration apply** | `supabase db push` or hosted migration run |
| **Tenant bootstrap** | Seed tenant + initial `tenant_memberships` rows |
| **Brevo configuration** | API key, sender identity, webhook secret |
| **RLS production validation** | Policy testing with real auth sessions |
| **Vercel deployment** | Environment variables, domain, preview protection |

---

## Validation commands (base)

```bash
npm run lint          # 11 warnings, 0 errors (2026-07-05)
npm run typecheck     # pass
npm test              # 276 passed, 3 skipped
npm run build         # pass
npm run test:e2e      # requires Playwright + dev server prep
npm run test:acceptance
npm run test:supabase:integration   # requires PostgreSQL
```

---

## Known limitations (base)

1. Browser UI reads IndexedDB even when server uses Supabase for send path.
2. Send-job routes use development header actor context in non-production.
3. Smartlead code paths remain for backward compatibility; Brevo is the active provider direction.
4. Cup Customizer route exists on base but full UI is on feature branch.
5. Production OAuth and membership enforcement require unmerged auth branches.

---

## Superseded documentation

- `docs/product/outreach-mvp-implementation.md` — pre-Supabase notes
- `docs/architecture/local-mvp-persistence.md` — outdated schema versions
- `docs/ai-context/02-current-architecture.md` — early planning

See `docs/DOCUMENT_STATUS.md` for the full index.

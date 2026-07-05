# ForgeOS 0.2.0 Local Demo Plan

**Version:** 0.2.0  
**Branch target:** `release/forgeos-0.2.0-local-demo`  
**Base:** `integration/jh-gomes-release-candidate` @ `3507986`  
**Date:** 2026-07-05

## Purpose

Establish a stable, repeatable **local-demo runtime contract** for JH Gomes walkthroughs without hosted Supabase, OAuth providers, Brevo, or paid AI calls. The demo uses browser IndexedDB only and stays isolated from development, E2E, acceptance, and customer-PC databases.

## Runtime contract

| Item | Value |
|------|-------|
| Node.js | **22.x** (`engines.node`: `>=22 <23`) |
| npm | **10.9.8** (`packageManager` pin) |
| Persistence | `FORGEOS_PERSISTENCE_MODE=local` |
| IndexedDB name | `forgeos:jhgomes:0.2.0-demo` |
| Base URL | `http://localhost:3000` |
| Default locale | `pt-PT` |
| AI provider | `deterministic` |
| Email delivery | `simulation` |
| Real send / Brevo / OAuth | **disabled** |
| `.env.local` | **not modified** by demo scripts |

Environment reference: `.env.demo.local.example`  
Script contract: `scripts/demo/contract.mjs`

## Package scripts

| Script | Action |
|--------|--------|
| `npm run demo:prepare` | Assert Node 22 + npm pin, run `npm ci`, create `.demo/` dirs |
| `npm run demo:start` | Start `next dev` on port 3000 with demo env injected |
| `npm run demo:reset` | Clear demo IndexedDB via headless browser (server must be running) |
| `npm run demo:seed` | Verify deterministic seed loads (server must be running) |
| `npm run demo:smoke` | Playwright smoke on port **3002** with demo DB (self-contained) |

All demo scripts **fail clearly** when Node is not major version 22.  
`demo:start` refuses occupied ports unless metadata proves a stale ForgeOS demo PID. It does **not** kill unrelated processes.

## Critical route / flow matrix

Routes are validated by `e2e/acceptance/00-smoke-and-navigation.spec.ts` and the demo smoke harness.

| Flow | Route (pt-PT) | Demo status | Notes |
|------|-----------------|-------------|-------|
| Login | `/pt-PT/login` | **Working (local preview)** | Local demo user selection; no Google/Microsoft OAuth |
| Dashboard | `/pt-PT` | **Working** | Greeting, onboarding checklist, notifications |
| Customers | `/pt-PT/customers` | **Working** | CRUD via drawer |
| LeadOps | `/pt-PT/leadops` | **Working** | Lead table, import wizard, KPIs |
| Lead detail | `/pt-PT/leadops/[leadId]` | **Working** | Deterministic email generation |
| Campaigns list | `/pt-PT/leadops/campaigns` | **Working** | Segmentation and draft workflow |
| Campaign detail | `/pt-PT/leadops/campaigns/[id]` | **Working** | Review, approve, simulation send job |
| Products | `/pt-PT/products` | **Working** | Catalog CRUD; seed products present |
| Cup Customizer | `/pt-PT/quotations/customizer` | **Working** | Simulation save; links from quotations |
| Quotations | `/pt-PT/quotations` | **Working** | Quote list; customizer navigation |
| Production | `/pt-PT/production` | **Working** | Production orders from seed |
| Machines | `/pt-PT/machines` | **Working** | Operations seed machines |
| Inventory | `/pt-PT/inventory` | **Working** | Stock items from operations seed |
| Settings | `/pt-PT/settings` | **Working** | Company profile, users, integrations panel |
| Backup / reset | Settings → **Dados e cópia de segurança** | **Working** | JSON export/import; demo reset preserves operational leads |
| Demo workflow | `/pt-PT/demo` | **Working** | CRM → production scripted walkthrough |
| Maintenance | `/pt-PT/maintenance` | **Placeholder** | Hosted-only explanatory shell |
| Sales orders | `/pt-PT/sales-orders` | **Preview shell** | Navigation present; limited operational data |
| Hosted Supabase mode | N/A | **Out of scope** | Demo contract is local-only |

## Deterministic local demo data

Seed source: `src/persistence/indexeddb/repositories.ts` → `seedDatabase()` using:

- `src/demo/seed.ts` — JH Gomes tenant, demo products
- `src/features/leadops/seed.ts` — LeadOps leads, campaigns, filter options
- `src/demo/operational-seed.ts` — machines, inventory, production defaults

Requirements:

- Tenant: `tenant_jh_gomes`
- `SEED_VERSION`: **4** (`src/domain/constants.ts`)
- All contact emails use `*.example.invalid` domains
- No real customer names, pricing from production, or private imports
- Lead import fixtures for live demos: `e2e/fixtures/leads-mixed.csv` (synthetic)

First browser load after reset triggers idempotent seed. `demo:reset` clears IndexedDB; reload applies fresh seed.

## Database isolation map

| Database name | Purpose |
|---------------|---------|
| `forgeos:jhgomes:0.2.0-demo` | **0.2.0 local demo** (this harness) |
| `forgeos:jhgomes:development` | Default dev (`src/domain/constants.ts`) |
| `forgeos:jhgomes:local` | Customer PC template |
| `forgeos:e2e:*` | Playwright E2E / acceptance (ephemeral) |

## Known gaps (not blocking demo checkpoint)

1. **Maintenance module** — placeholder until hosted CMMS path exists.
2. **Preview modules** (sales-orders, molds, quality, etc.) — shell navigation only.
3. **Supabase persistence** — intentionally disabled in demo contract.
4. **Real OAuth** — login page shows local preview path only.
5. **Browser reset/seed** — `demo:reset` and `demo:seed` require `demo:start` (or `--url`) because IndexedDB is browser-scoped.

## Validation checklist

```bash
npm run demo:prepare
npm run lint
npm run typecheck
npm test
npm run build
npm run demo:smoke
```

Manual walkthrough: `docs/demo/forgeos-0.2.0-walkthrough.md`  
QA baseline: `qa/demo/0.2.0-baseline.md`

## References

- `docs/CURRENT_STATE.md`
- `docs/checkpoints/jh-gomes-release-candidate.md`
- `e2e/acceptance/` — full acceptance suite (port 3001, separate DB)
- `scripts/customer-pc/` — Windows customer PC runtime (distinct contract)

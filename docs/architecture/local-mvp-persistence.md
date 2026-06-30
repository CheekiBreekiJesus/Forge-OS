# Local MVP Persistence Architecture

## Current state (before this increment)

- Demo workflow used React `useState` only; records were not durable.
- Outreach loaded static fixture arrays from `src/features/leadops/seed.ts`.
- Lead workspace drafts were saved per-lead in `localStorage`.
- Dashboard, Customers, Production, and Quotations showed placeholder module shells or static fixtures.
- CSV import was preview-only.
- Supabase schema drafts exist but no runtime client is connected.

## Target state

A **single-user local MVP** where:

- All commercial and operational records share one **tenant-scoped IndexedDB** database.
- Demo actions call **application services** that write through **repository interfaces**.
- Outreach, Dashboard, Customers, Quotations, and Production read the same data.
- Outreach email workflow persists in `outreachMessages` (replacing scattered `localStorage` keys).
- Data survives page refresh; reset/reseed clears only the local ForgeOS DB.
- Repository interfaces are ready for a future `SupabaseRepositoryBundle` without rewriting feature UI.

## Persistence technology

| Concern | Choice |
|--------|--------|
| Primary store | **IndexedDB** via [Dexie](https://dexie.org/) |
| Database name | `forgeos:jhgomes:development` |
| UI preferences | `localStorage` only if needed (not used for business data) |
| Server | No server persistence in this increment |

### Schema version

- Dexie schema version `1`
- Seed version tracked in `meta.seedVersion` (`SEED_VERSION = 1`)
- Future migrations: bump Dexie version + migration callback; document field mapping in this file

## Repository interfaces

Defined in `src/persistence/interfaces.ts`:

- `LeadRepository`
- `CustomerRepository`
- `OpportunityRepository`
- `QuoteRepository`
- `ProductionOrderRepository`
- `OutreachMessageRepository`
- `CampaignRepository`
- `ActivityRepository`
- `MetaRepository`

Access via `initializeRepositories()` / `getRepositories()` in `src/persistence/registry.ts`.

Feature components use React hooks (`src/persistence/hooks.ts`) and **do not** import Dexie directly.

## Entity relationships

```text
Tenant (tenant_jh_gomes)
  ├── Lead ──────────────┬── Customer (1:0..1 via conversion)
  │                      └── Opportunity (1:0..1)
  ├── OutreachMessage (1:0..1 per lead workflow)
  ├── Quote ────────────── ProductionOrder (1:0..1)
  ├── Campaign
  └── ActivityEvent (append-only audit trail)
```

### Canonical types

`src/domain/types.ts` — `Lead`, `Customer`, `Opportunity`, `Quote`, `ProductionOrder`, `OutreachMessage`, `Campaign`, `ActivityEvent`.

Mappers in `src/domain/mappers.ts` bridge to feature types (`LeadOpsLead`, etc.) without broad rewrites.

## Tenant scoping

- Default tenant: `tenant_jh_gomes` (`DEFAULT_TENANT_ID`)
- Every repository method takes `tenantId` as first argument
- IndexedDB compound indexes include `tenantId` where queries are tenant-filtered
- Seed data from Outreach fixtures is tenant-scoped; other-tenant seed row is excluded from JH Gomes DB

## Module integration points

| Module | Integration |
|--------|-------------|
| Demo (`/demo`) | `src/application/demo-workflow-service.ts` |
| Outreach (`/leadops`) | `useTenantLeads`, `outreachMessages.saveDraft` |
| Dashboard (`/`) | `useDashboardMetrics`, `useActivities` |
| Customers | `useCustomers` |
| Quotations (`/quotations`) | `useQuotes` |
| Production | `useProductionOrders` |
| Job card (`/jobs/[id]`) | Client load by `orderId` |
| CSV import | `persistImportedLeads` after user confirmation |

AI generation remains **`POST /api/leadops/generate`** — not duplicated in Demo.

## Data reset behavior

Settings in Demo workflow:

- **Reset demo data** — clears all IndexedDB tables for the local DB
- **Reseed** — reset + deterministic seed from Outreach fixtures

Does **not** affect `.env.local`, external APIs, or future Supabase projects.

## Migration path to Supabase

| Local entity | Supabase table (existing migration) | Notes |
|-------------|-------------------------------------|-------|
| Lead | `public.leads` | Map `crmStatus` ↔ `status`; outreach fields may need `leadops` extension columns |
| Customer | `public.customers` | `lead_id` FK exists |
| Opportunity | `public.opportunities` | Verify migration exists in operational foundation |
| Quote | `public.quotations` | `quote_number`, lines in `quotation_versions` |
| ProductionOrder | `public.production_orders` | |
| OutreachMessage | `leadops_messages` (202606300001 migration) | Workflow state |
| Campaign | `leadops_campaigns` | |
| ActivityEvent | `audit_events` or dedicated `activity_events` | May need new migration |

### Implementation steps (future)

1. Add `@supabase/supabase-js` and server client helpers
2. Implement `SupabaseRepositoryBundle` with same interfaces
3. Switch registry based on env (`PERSISTENCE_PROVIDER=supabase`)
4. Enable Auth + RLS; resolve `tenantId` from session
5. Deprecate IndexedDB bundle for production deployments

## Limitations

- **Browser-only** — data is per-browser, not synced across devices
- **No auth** — single implicit tenant
- **No RLS** — tenant isolation is conventional, not cryptographic
- **Products/machines/inventory** — still fixture-backed for quoting/job cards
- **Job card** — reads production order from IndexedDB but machine/product metadata from fixtures
- **E2E** — uses deterministic AI; no paid Abacus calls in CI

## Testing strategy

- Unit: `src/persistence/persistence.test.ts` (fake-indexeddb)
- Application services covered via same tests
- E2E: `e2e/local-mvp-workflow.spec.ts` — demo → outreach → reload
- Existing Outreach E2E updated for IndexedDB persistence

## Related files

```text
src/domain/           # Canonical types and mappers
src/persistence/      # Dexie DB, repositories, registry, provider
src/application/      # Demo workflow and CSV import services
docs/deployment/      # mvp-live-readiness.md
```

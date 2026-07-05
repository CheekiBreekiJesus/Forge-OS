# ForgeOS local demo data reference

Synthetic, tenant-scoped dataset for `tenant_jh_gomes` (JH Gomes-style demo). No real customer PII.

## Versioning

| Key | Value |
|-----|-------|
| Seed version (`meta.seedVersion`) | `5` |
| Schema version (`meta.schemaVersion`) | `13` |
| Anchor timestamp | `2026-06-01T10:00:00.000Z` |

## Entity counts (managed demo records)

| Entity | Count | Notes |
|--------|------:|-------|
| Company profile | 1 | Via `ensureDefault` |
| User profile | 1 | `operador@forgeos.preview` |
| Sender identity | 1 | Default simulation sender |
| Products | 8+ | From `demoProducts` + cup catalog |
| Machines | 2+ | UV screen + bag screen (operations seed) |
| Inventory items | 3+ | Includes low-stock ink scenario |
| Stock movements | 2+ | Receipt + consumption samples |
| Leads | 9 | `leadops_001`–`010` (excl. other-tenant) |
| Customers | 3 | Atlantic, Lisbon Coffee, Summit |
| Opportunities | 3 | Discovery → negotiation stages |
| Quotations | 3 | Draft, approved, sent |
| Production orders | 3 | Active, delayed, blocked |
| Campaigns | 4 | Draft through completed stages |
| Campaign recipients | 4 | Approved, draft, simulated, suppressed |
| Outreach messages | 3 | Draft + approved samples |
| Send jobs | 1 | Completed simulation job |
| Send job recipients | 1 | Delivered simulation |
| Send job attempts | 1 | Accepted simulation attempt |
| Customizer simulations | 1 | Complete cup workflow → draft quote |
| Email suppressions | 1 | Invalid email (`*.invalid`) |

## Scenario coverage

- **Normal records:** Atlantic Catering lead/customer, active production order.
- **Needs attention:** Draft quotation, pending artwork production order.
- **Delayed production:** `po_demo_delayed` scheduled, artwork pending.
- **Low inventory:** Blocked PO references low ink stock from operations seed.
- **Quotations:** `quote_demo_draft`, `quote_demo_approved`, `quote_demo_sent`.
- **Campaign stages:** Recipients in `APPROVED`, `PENDING`, `DELIVERED`, `SUPPRESSED`.
- **Suppression / invalid email:** `leadops_006` + `helena.costa@metro-stadium.invalid`.
- **Custom cup workflow:** `customizer_demo_cup_workflow` linked to `quote_demo_draft`.

## Deterministic IDs

Managed IDs are declared in `src/demo/local-demo-dataset.ts` (`LOCAL_DEMO_*_IDS`).

Reseed behaviour:

- **Same seed version, complete dataset:** no-op.
- **Missing managed rows:** `bulkPut` missing IDs only.
- **Seed version changed or `force`:** overwrite all managed demo rows via `bulkPut`.
- **Demo-only reset:** delete managed IDs, then reseed missing rows; user-created records preserved.

## Email domain policy

All synthetic addresses use `*.example` or `*.example.invalid`. No real inboxes.

## Tenant isolation

Demo lifecycle seeds `DEFAULT_TENANT_ID` (`tenant_jh_gomes`) only. `leadops_011` remains on `tenant_other_demo` for isolation tests.

## Code entry points

- Dataset builders: `src/demo/local-demo-dataset.ts`
- Apply / reset service: `src/demo/local-demo-seed-service.ts`
- Orchestration: `seedDatabase`, `resetDemoRecords`, `restoreDeterministicDemoState` in `src/persistence/indexeddb/repositories.ts`
- Guard: `src/features/demo/local-demo-guard.ts`

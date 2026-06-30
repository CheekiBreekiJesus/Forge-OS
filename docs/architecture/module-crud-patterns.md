# Module CRUD Patterns

Audit of operational CRUD coverage across ForgeOS MVP modules (local IndexedDB).

| Module | Route | Shell | List | Create | Edit | Archive | Restore | Duplicate | Related records | Role preview |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Customers | `/customers` | `customers-shell.tsx` | Yes | Yes | Yes | Yes | Yes | — | — | sales+ |
| Products | `/products` | `product-catalog-shell.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | — | all product roles |
| Quotations | `/quotations` | `quotations-shell.tsx` | Yes | Yes | — | Yes | Yes | Yes | customer/product | sales+ |
| Production | `/production` | `production-list-shell.tsx` | Yes | via quote | assign/status | Yes | Yes | — | machine | production_manager+ |
| Machines | `/machines` | `machines-shell.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | — | production+ |
| Inventory | `/inventory` | `inventory-shell.tsx` | Yes | Yes | Yes | Yes | Yes | — | stock movements | warehouse_manager+ |
| Outreach | `/leadops` | `leadops-dashboard-shell.tsx` | Yes | Yes | — | Yes | Yes | Yes | convert | sales+ |

## Shared UI (`src/components/crud/`)

- `PageHeader`, `PrimaryActionButton`, `SearchAndFilterBar`
- `EntityTable` (md+) / `EntityCardList` (sm)
- `EntityFormDrawer`, `RowActionMenu`, `ArchiveConfirmationDialog`
- `EmptyState`, `LoadingState`, `ErrorState`, `RelatedRecordsPanel`

## Data flow

1. Module shell reads via `usePersistence` hooks (`includeArchived` optional).
2. Mutations call repository methods on `state.repos`.
3. Every write calls `notifyDataChanged()` to refresh hooks.

## Archive semantics

- Default lists hide archived (`filterByArchive` in repositories).
- “Show archived” toggles `ListOptions.includeArchived`.
- Archive uses soft-delete fields (`active`, `archivedAt`, `archivedBy`).

## Preview-only features

- `role-preview.tsx` — localStorage `forgeos:preview-role`; not secure.
- `command-palette.tsx` — Ctrl/Cmd+K navigation and local search.
- `quick-create-menu.tsx` — header create shortcuts with hash deep links.

## Tests

| Layer | File |
| --- | --- |
| Unit persistence | `src/persistence/module-crud.test.ts` |
| Unit palette/roles | `src/features/crud/command-palette.test.ts`, `role-preview.test.ts` |
| E2E | `e2e/module-crud.spec.ts` |

# Product Data Import MVP — Architecture

## 1. Reused branch work

| Component | Location | Reuse |
| --- | --- | --- |
| CSV/XLSX parser | `src/features/product-import/parse-spreadsheet.ts` | SheetJS with `cellFormula: false`, `bookVBA: false` |
| Column mapping | `src/features/product-import/field-mapping.ts` | Alias-based header detection |
| Normalization | `src/features/product-import/normalize.ts` | PT number/currency, EAN, references |
| Duplicate/conflict | `src/features/product-import/duplicate-conflict.ts` | SKU, barcode, name warning |
| Pipeline | `src/features/product-import/pipeline.ts` | Batch creation and row staging |
| IndexedDB repos | `src/persistence/indexeddb/product-import-repositories.ts` | Local/demo persistence (Dexie v15) |
| UI shell | `src/components/product-import-shell.tsx` | Wizard workflow |

## 2. Parser choice

**SheetJS (`xlsx` v0.18.5)** for CSV and XLSX only. Formulas are read as displayed values (`cell.w` / `cell.v`), never executed. Legacy `.xls` is detected but not promoted unless already parsed safely.

## 3. Staging schema (Supabase)

- `prod_import_jobs` — tenant-scoped job metadata, status lifecycle, idempotency key, result summary
- `prod_import_rows` — staged rows with `source_row_number`, `original_values`, `normalized_values`, resolution
- `prod_import_mapping_profiles` — reusable column mappings per tenant
- `prod_import_validation_issues` — row-level errors/warnings separated from normalized values
- `apply_product_import_job` RPC — transactional apply with idempotent retry

## 4. Column-mapping model

Source headers map to canonical `ProductImportFieldKey` values via alias table. Profiles persist `column_mappings` JSON per tenant. Unmapped columns are ignored; required fields validated after mapping.

## 5. Validation model

Row validation runs after normalization: required `internalReference` + `description`, numeric parsing for prices/stock, EAN checksum warnings. Issues stored in `prod_import_validation_issues` with severity `error` | `warning`.

## 6. Duplicate-resolution model

| Rule | Match | User choice |
| --- | --- | --- |
| Tenant + internal reference | Strong duplicate | create / update / skip |
| Tenant + barcode | Strong duplicate | create / update / skip |
| Normalized name similarity | Warning only | manual review suggested |

Field-level conflicts show existing vs incoming values before approval. No silent merge.

## 7. Transaction strategy

Final apply uses Postgres function `apply_product_import_job(job_id, idempotency_key)`:

1. Lock job row (`importing` status)
2. Skip if already `completed` with same idempotency key (retry-safe)
3. Upsert `inv_item_masters` per approved row
4. Write `inv_activity_log` audit event
5. Set job `completed` with result summary; on failure set `failed` and roll back

## 8. API / server actions

| Route | Purpose |
| --- | --- |
| `POST /api/products/import/jobs` | Upload metadata, create job |
| `POST /api/products/import/jobs/[id]/parse` | Parse file body, stage rows |
| `PATCH /api/products/import/jobs/[id]/mapping` | Save column mapping |
| `POST /api/products/import/jobs/[id]/validate` | Run validation + duplicate analysis |
| `POST /api/products/import/jobs/[id]/approve` | Explicit approval |
| `POST /api/products/import/jobs/[id]/apply` | Transactional import |
| `GET /api/products/import/jobs` | Import history |
| `GET /api/products/import/jobs/[id]/error-report` | CSV error report (formula-safe) |

Auth: `resolveForgeOSSession` + `products:manage` or `inventory:manage`. Tenant isolation via RLS and session tenant UUID.

## 9. UI components

`ProductImportShell` wizard: file → worksheet → mapping → validation summary → row preview with duplicate controls → approval → progress → result + error report download. Pagination via `PAGE_SIZE = 25`.

## 10. Testing strategy

| Layer | Coverage |
| --- | --- |
| Unit | Parser, mapping, validation, duplicates, error-report escaping |
| Integration | Supabase migration + RPC idempotency + tenant isolation |
| E2E | Playwright wizard with synthetic CSV fixtures |
| Local | IndexedDB pipeline tests retained for offline demo |

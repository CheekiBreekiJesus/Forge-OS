# Inventory Product QA Summary

Date: 2026-07-01  
Branch: `feat/inventory-product-foundation`  
Checkpoint: Milestone 1 foundation (honest preview)

## Functional (unit-tested / deterministic)

- Ledger posting, idempotency, balanced transfers, reversals, negative-stock guard.
- Stock balance projection from entries + reservations.
- Unit conversion validation and quantity conversion.
- Barcode normalization (leading zeroes), resolution, validation rules.
- Code 128 ZPL rendering and mock print job recording.
- Import row normalization/validation (staging only).
- Preview permission matrix.
- PT/EN copy for workspace tabs and messages.

## Preview-only (UI)

- Nested `/products/[section]` and `/inventory/[section]` workspaces.
- Demo receipt, transfer, reversal buttons (in-session state only).
- Barcode resolver, label HTML/ZPL preview, import staging display.
- Variants/references/packaging sections show counts only.

## Persisted today

- Legacy product catalog and inventory CRUD (unchanged Dexie repos).
- Not the new canonical inventory-product entities.

## Deferred (not implemented)

- Production issue/output, WIP, vehicle loading, deliveries, invoicing, offline sync, Zebra printing, real CSV import commit.

## Validation results (final)

| Command | Result |
|---|---|
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm test` | 23 files, 127 tests pass |
| `npx vitest run src/features/inventory-product/ledger.test.ts` | 11/11 pass |
| `npm run test:e2e` | 83 pass, 1 skipped (`live-ai`), exit 0 |
| `npm run test:acceptance` | 50 pass, 1 skipped (`live-ai`), exit 0 |
| `npm run build` | Pass |
| `npm run validate` | Pass |
| `npm run ai:doctor -- --provider abacus` | Pass (no live call; SDK/key absent in test env) |

## Known limitations

- Workspace ledger data resets on navigation refresh (React state only).
- ZPL supports Code 128 only.
- Theme toggle may log a dev-mode hydration attribute warning after persisted light-theme reload; behavior and persistence remain correct.

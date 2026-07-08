# Inventory Product Foundation Baseline Validation

Date: 2026-07-01  
Branch: `feat/inventory-product-foundation`  
Starting commit: `2dc1287`  
Worktree: `C:\Users\J35U5\Desktop\VS Code\Forge-OS-inventory`

## Preconditions (start)

- Branch: `feat/inventory-product-foundation` from `2dc1287`.
- 31 uncommitted inventory milestone files; original `Forge-OS` checkout untouched.

## Baseline failures (starting commit)

1. E2E could reuse developer dev server and inherit Abacus outreach config.
2. Dashboard mobile horizontal overflow (~212px on `/pt-PT`).
3. Theme toggle hydration mismatch after persisted theme.
4. Customizer strict locator collision for `Orçamentos`.
5. Outreach subject test depended on live provider output.

## Final command results

| Command | Exit | Result |
|---|---:|---|
| `npm run lint` | 0 | Pass |
| `npm run typecheck` | 0 | Pass |
| `npm test` | 0 | 23 files, 127 tests pass |
| `npx vitest run src/features/inventory-product/ledger.test.ts` | 0 | 11/11 pass |
| `npm run test:e2e` | 0 | 83 pass, 1 skipped (`live-ai`) |
| `npm run test:acceptance` | 0 | 50 pass, 1 skipped (`live-ai`) |
| `npm run build` | 0 | Pass (92 static routes incl. inventory/product sections) |
| `npm run validate` | 0 | Pass |
| `npm run ai:doctor -- --provider abacus` | 0 | Pass; no live call |

## Repairs applied

- Playwright E2E port 3002, `reuseExistingServer: false`, deterministic AI env, empty `ABACUS_API_KEY`.
- Dashboard layout/table containment for mobile overflow.
- Theme toggle deferred render + SSR-stable defaults.
- Customizer E2E locator scoped to quotations subnav.
- Outreach E2E asserts deterministic provider.

## Residual notes

- Dev-mode hydration attribute warning may still log once when reloading with persisted light theme; E2E theme persistence tests pass.
- New inventory-product canonical entities are **not** in Dexie yet.

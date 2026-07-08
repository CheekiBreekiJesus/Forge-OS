# ForgeOS Pilot Baseline

Date: 2026-07-01

## Starting Point

- Branch: `codex/forgeos-foundation-app-shell`
- Starting commit: `99f5df5`
- Primary issue addressed in this slice: scoped demo reset must preserve operational/imported records.

## Checks Run

```bash
npm test -- src/persistence/persistence.test.ts
npm run typecheck
```

Results:

- Targeted persistence/Vitest suite: passed, 20 files and 105 tests.
- TypeScript typecheck: passed.

## Baseline Notes

- Full baseline commands requested by the pilot prompt were not all rerun in this slice because the immediate high-priority defect was isolated to IndexedDB reset behavior.
- `npm run ai:doctor -- --provider abacus` had passed in the prior live-verification run on this branch with Abacus configured and deterministic fallback enabled.
- Existing acceptance suite at commit `99f5df5` is the source baseline for broader UI and workflow coverage.

## Reset Behavior

`Reset demo data` now uses the repository-level scoped demo reset path:

- removes known seeded LeadOps leads and campaigns;
- removes demo records linked to seeded lead/customer/quote/order IDs;
- restores missing seeded leads and campaigns;
- preserves imported/manual leads;
- preserves outreach drafts for preserved leads;
- preserves settings, assets, manually created customers, quotations, production orders, products, machines and inventory.

`repos.reset()` remains the destructive clear-all path for backup restore and test setup.

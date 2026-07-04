# Cup Customizer Integration Overlap

Date: 2026-07-04  
Branch: `feat/cup-customizer-integration-ui`  
Comparison base: `160675a` (outreach MVP integration checkpoint)

## Files changed on this branch (cup customizer scope)

Primary customizer-only paths:

- `src/components/cup-customizer-shell.tsx`
- `src/components/cup-customizer-workflow-nav.tsx`
- `src/features/cup-customizer/**`
- `src/domain/customizer-types.ts`
- `src/persistence/indexeddb/customizer-repositories.ts`
- `src/persistence/customizer-integration.test.ts`
- `src/app/[locale]/products/cup-customizer/page.tsx`
- `src/app/[locale]/quotations/customizer/page.tsx`
- `packages/cup-customizer/**`
- `public/demo/products/*.svg`
- `e2e/cup-customizer.spec.ts`
- `docs/product/cup-customizer*.md`
- `qa/cup-customizer/**`
- `scripts/qa/cup-customizer-private-acceptance.ts`

## Files changed on concurrent integration branch

`origin/feat/email-outreach-mvp-integration` since `160675a` focuses on:

- Draft personalization (`src/features/leadops/*`)
- Campaign approval/draft services
- Sender profiles and settings UI
- Outreach i18n additions
- Campaign repository updates

## Overlapping files

| File | Reason | Risk | Mitigation |
|------|--------|------|------------|
| `src/i18n/dictionaries.ts` | Both add module strings | Medium | Merge customizer `workflow` / `mockup` blocks only |
| `src/i18n/locales/en.ts` | Same | Medium | Cherry-pick customizer section |
| `src/i18n/locales/pt-PT.ts` | Same | Medium | Cherry-pick customizer section |
| `src/persistence/db.ts` | Both may bump schema | High | Customizer uses optional fields; avoid new Dexie version unless required |
| `src/persistence/indexeddb/repositories.ts` | Shared quote repo | Low | Customizer changes isolated to `customizer-repositories.ts` |

## Non-overlapping protected areas (do not merge from this branch)

- Send-job routes and mutations
- Supabase outreach migrations
- Sender profile personalization
- Table density / global table components
- Authentication session handling
- Inventory ledger

## Recommended merge order

1. Merge `origin/feat/email-outreach-mvp-integration` into integration line first (or rebase cup branch onto it).
2. Cherry-pick / merge `feat/cup-customizer-integration-ui` customizer commits.
3. Resolve i18n conflicts by keeping both outreach and customizer dictionary sections.
4. Run `npm run validate` and `e2e/cup-customizer.spec.ts` after merge.
5. Do not merge inventory or table-density branches in the same pass.

## Cherry-pick friendly commits (this task)

1. `docs(cups): recovery plan and specification`
2. `feat(cups): products route and workflow navigation`
3. `feat(cups): gated photorealistic mockup workflow`
4. `feat(cups): idempotent draft quotation updates`
5. `test(cups): workflow, mockup, and quotation idempotency`
6. `docs(cups): product docs and checkpoint`

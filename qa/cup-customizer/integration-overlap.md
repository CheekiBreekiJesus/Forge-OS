# Cup Customizer Integration Overlap

Date: 2026-07-04  
Branch: `feat/cup-customizer-integration-ui` @ `34302bb`  
Preview UX source: `origin/fix/cup-customizer-preview-layout` (`1529a9d`)

## Merge completed

```
302c15a (feat/cup-customizer-integration-ui)
    └── 34302bb merge(cups): integrate preview UX repair
            └── 1529a9d (fix/cup-customizer-preview-layout)
```

**Conflicts:** none  
**Worktree:** `Forge-OS-cup-customizer-integration`

## Files on feature branch after merge

Primary customizer paths:

- `src/components/cup-customizer-shell.tsx`
- `src/components/cup-customizer-preview-panel.tsx`
- `src/components/cup-customizer-workflow-nav.tsx`
- `src/features/cup-customizer/**`
- `packages/cup-customizer/**` (includes `cup-design-canvas.tsx`)
- `src/domain/customizer-types.ts`
- `src/persistence/indexeddb/customizer-repositories.ts`
- `src/persistence/customizer-integration.test.ts`
- `e2e/cup-customizer.spec.ts`
- `docs/product/cup-customizer*.md`
- `qa/cup-customizer/**`, `qa/ui/cup-customizer-preview-layout-report.md`

## Concurrent branch overlap (unchanged)

`origin/feat/email-outreach-mvp-integration` since `160675a`:

| File | Risk | Mitigation |
|------|------|------------|
| `src/i18n/dictionaries.ts` | Medium | Keep both outreach and customizer sections |
| `src/i18n/locales/en.ts` | Medium | Cherry-pick customizer `customizerModule` block |
| `src/i18n/locales/pt-PT.ts` | Medium | Same |
| `src/persistence/db.ts` | High | Customizer uses optional fields; avoid unrelated Dexie bumps |

## Protected areas (do not merge from other branches into customizer pass)

- Send-job routes and mutations
- Supabase outreach migrations
- Sender profile personalization
- Table density / global table components
- Authentication session handling
- Inventory ledger

## Recommended later integration order

1. Merge `origin/feat/email-outreach-mvp-integration` first (or rebase outreach onto this line).
2. Merge `feat/cup-customizer-integration-ui` (`34302bb`) — preview UX already included.
3. Resolve i18n conflicts by keeping both dictionary sections.
4. Run `npm run validate` and `e2e/cup-customizer.spec.ts`.
5. Do **not** merge inventory or table-density branches in the same pass.

## Outreach requirements after customizer merge

- Marketing visualization meta keys (`cup-customizer:marketing-visualization:*`) available for future attachment workflows
- No direct coupling to campaign-send services in this branch
- Customizer mockup remains local IndexedDB only

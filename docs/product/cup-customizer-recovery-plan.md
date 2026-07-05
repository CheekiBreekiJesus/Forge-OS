# Cup Customizer Recovery Plan

Date: 2026-07-04  
Worktree: `Forge-OS-cup-customizer-integration`  
Branch: `feat/cup-customizer-integration-ui`  
Starting commit: `e808af0` — docs(customizer): document feature module layout and preview assets

## Preflight summary

| Check | Result |
|-------|--------|
| Worktree | `C:\Users\J35U5\Desktop\VS Code\Forge-OS-cup-customizer-integration` |
| Branch | `feat/cup-customizer-integration-ui` (continues `feat/cup-customizer-integration`) |
| Working tree | Clean after `next-env.d.ts` restore |
| Private files | None in tracked paths |
| Credentials | None committed |
| Unrelated changes | None |

Expected integration base: `origin/feat/email-outreach-mvp-integration` (commit `160675a` documented as outreach checkpoint).

## Existing implementation found

### Routes

| Route | Status |
|-------|--------|
| `/[locale]/quotations/customizer` | **Working** — primary shell |
| `/[locale]/products/cup-customizer` | **Added** — alias route to same shell |

### Components and packages

| Path | Role | Status |
|------|------|--------|
| `src/components/cup-customizer-shell.tsx` | Main UI shell | Working; extended with workflow steps and gated mockup |
| `packages/cup-customizer/rendering/cup-preview.tsx` | Deterministic preview | Working |
| `packages/cup-customizer/pricing/engine.ts` | Estimate pricing | Working |
| `packages/cup-customizer/adapters/forgeos.ts` | Bridge facade | Working |
| `src/features/cup-customizer/` | Configuration, upload, mockup export | Working |
| `src/persistence/indexeddb/customizer-repositories.ts` | Persistence + quote conversion | Working; idempotent draft quote update added |

### Persistence model

- IndexedDB table `customizerSimulations` (Dexie schema v13)
- Domain: `src/domain/customizer-types.ts`
- Local artwork: `LocalAsset` repository (tenant-scoped, private blobs)
- Quote linkage: `Quote.simulationId`, `Quote.mockupAssetId`, `Quote.isEstimate`
- Statuses: `draft`, `saved`, `converted`, `archived` (+ workflow display mapping)

### Quotation integration

- `convertSimulationToQuote()` creates draft estimate quotes
- Idempotent: re-converting updates the same draft quote line instead of duplicating
- Manual unit price override supported with reason field

### Image / mockup generation

- **Deterministic preview**: `CupPreview` component (offline, immediate)
- **Operational SVG mockup**: `buildMockupAssetBlob()` on save/quote
- **Photorealistic mockup**: explicit user action; deterministic provider in dev (no paid API)

### Tests

| File | Coverage |
|------|----------|
| `src/features/cup-customizer/*.test.ts` | Config, pricing, upload, mockup |
| `src/persistence/customizer-integration.test.ts` | Save, convert, archive |
| `e2e/cup-customizer.spec.ts` | Route, save, convert, navigation |
| `e2e/acceptance/05-customizer-quotation-production.spec.ts` | Acceptance path |

### Design documents

- `docs/architecture/cup-customizer-integration.md`
- `qa/customizer/current-diagnostic.md`

### Product assets

- `public/demo/products/pp-cup-250.svg`, `pp-cup-330.svg`, `pp-cup-500.svg`, etc.
- Broken-image fallback in `CupPreview`

## Broken or incomplete areas (before this task)

1. No `/products/cup-customizer` route (navigation from products used quotations path only)
2. No mobile step workflow — single long form on small screens
3. Photorealistic mockup was auto-generated SVG on save only; no explicit gated action
4. Quote re-conversion returned existing quote without updating pricing
5. No stale-mockup detection when artwork/configuration changes
6. Documentation spread across architecture doc only; product docs incomplete
7. No private acceptance script

## Duplicate implementations

- **None.** Single package boundary at `packages/cup-customizer` + feature module at `src/features/cup-customizer`. Do not add a second customizer.

## Safest continuation strategy

1. Preserve `packages/cup-customizer` adapter boundary and IndexedDB persistence.
2. Extend `cup-customizer-shell.tsx` with workflow navigation and gated mockup — do not rebuild.
3. Add products route alias; keep quotations route as canonical entry from quote flows.
4. Extend `convertSimulationToQuote` for idempotent draft updates.
5. Add feature-local tests and documentation under `docs/product/` and `qa/cup-customizer/`.
6. Avoid touching outreach, send-job, auth, inventory ledger, or central table-density code.

## UI defects addressed in this task

- Mobile step navigation and sticky controls
- Explicit photorealistic mockup labelling and stale state
- Commercial-data warnings when pricing cannot be resolved
- `aria-live` regions for save and generation feedback

## Missing commercial data

Pricing uses operational demo rules (`personalizedCupQuotationRules`). When rule resolution fails or product has no commercial fields, UI shows **Commercial data required** and allows labelled temporary manual override only.

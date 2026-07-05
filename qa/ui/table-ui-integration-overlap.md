# Table UI integration overlap analysis

**Branch:** `fix/table-density-and-action-overlays`  
**Base commit:** `160675a`  
**Compared integration branch:** `origin/feat/email-outreach-mvp-integration`  
**Date:** 2026-07-03

## Files changed by this branch

### New files
- `src/components/ui/collapsible-table-viewport.tsx`
- `src/components/ui/table-density-labels.ts`
- `src/components/ui/overlay-layers.ts`
- `src/components/ui/overlay-position.ts`
- `src/components/crud/data-table-action-menu.tsx`
- `src/features/ui/use-collapsible-rows.ts`
- `src/features/ui/use-collapsible-rows.test.ts`
- `src/features/ui/leadops-table-density.integration.test.ts`
- `e2e/table-density-overlay.spec.ts`
- `docs/ui/data-table-behavior.md`
- `docs/ui/overlay-and-action-menus.md`
- `qa/ui/table-density-overlay-*.md`

### Modified files
- `src/components/crud/entity-table.tsx`
- `src/components/crud/entity-card-list.tsx`
- `src/components/crud/row-action-menu.tsx`
- `src/components/crud/index.ts`
- `src/components/leadops-lead-management-panel.tsx`
- `src/components/leadops-campaign-list-shell.tsx`
- `src/features/leadops/lead-management.ts`
- CRUD shells: customers, products, inventory, quotations, production, machines

## Files changed on integration branch (since `160675a`)

At analysis time, `origin/feat/email-outreach-mvp-integration` matches base commit `160675a` (no additional commits on remote). Concurrent personalization work is expected on separate worktrees and may diverge after this snapshot.

Typical integration-touch files (avoided by this branch):
- `src/i18n/dictionaries.ts`, `src/i18n/locales/en.ts`, `src/i18n/locales/pt-PT.ts`
- `leadops-campaign-detail-shell.tsx`
- Sender profile and draft personalization modules

## Overlap

| File | This branch | Integration branch | Risk |
|------|-------------|-------------------|------|
| Central i18n | Not modified | Likely modified | Avoided — isolated labels |
| `leadops-campaign-detail-shell.tsx` | Not modified | Likely modified | Avoided |
| `leadops-lead-management-panel.tsx` | Modified | Possible | Low — UI density only |
| `lead-management.ts` | Constants only | Possible | Low — page size constants |

## Recommended merge order

1. Merge `fix/table-density-and-action-overlays` first (isolated UI primitives, no i18n dictionary edits).
2. Merge `feat/email-outreach-mvp-integration` (personalization, templates, sender profiles).
3. If `leadops-lead-management-panel.tsx` conflicts, keep integration business logic and re-apply collapsible viewport wrapper from this branch.

Do **not** merge integration into this branch while the personalization agent is active.

# Cup Customizer Preview UX — Branch overlap

**Base:** `302c15a`  
**Branch:** `fix/cup-customizer-preview-layout`  
**Compared:** `origin/feat/cup-customizer-integration-ui`, `origin/feat/email-outreach-mvp-integration` (160675a)

## Files changed on this branch (feature-local)

```
packages/cup-customizer/rendering/cup-design-canvas.tsx
packages/cup-customizer/adapters/forgeos.ts
packages/cup-customizer/index.ts
src/components/cup-customizer-shell.tsx
src/components/cup-customizer-preview-panel.tsx
src/features/cup-customizer/*
src/i18n/locales/pt-PT.ts (customizerModule only)
src/i18n/locales/en.ts (customizerModule only)
src/i18n/dictionaries.ts (customizerModule only)
e2e/cup-customizer.spec.ts
docs/product/cup-customizer*.md
qa/cup-customizer/*
qa/ui/cup-customizer-preview-layout-report.md
```

## Avoided overlap

- No changes to email draft personalization, Brevo, send-job routes
- No Supabase outreach migrations
- No inventory ledger or global table density
- No authentication modules

## Integration order recommendation

1. Merge `fix/cup-customizer-preview-layout` into `feat/cup-customizer-integration-ui`
2. Resolve i18n conflicts in `customizerModule` only (feature-local keys)
3. Run `e2e/cup-customizer.spec.ts` at 1440×900 before outreach integration merge

# Cup Customizer QA Baseline

Date: 2026-07-04  
Branch: `feat/cup-customizer-integration-ui`  
Starting commit: `e808af0`

## Environment

- Worktree: `Forge-OS-cup-customizer-integration`
- Local DB: IndexedDB `forgeos:jhgomes:development`
- Locales: `pt-PT` (primary), `en`
- Viewports: 390×844, 768×1024, 1440×900

## Routes under test

| Route | Expected |
|-------|----------|
| `/pt-PT/quotations/customizer` | Cup customizer shell loads |
| `/pt-PT/products/cup-customizer` | Same shell (products alias) |
| `/en/quotations/customizer` | English dictionary |

## Core workflow baseline

1. Open customizer
2. Select cup product (250 ml / 330 ml / 500 ml synthetic demo products)
3. Set quantity
4. Configure printing (colours, print area)
5. Upload synthetic artwork (`e2e/fixtures/logo.png`)
6. Adjust scale, offset, rotation
7. Deterministic preview updates immediately
8. Save simulation — persists after reload
9. Reopen saved simulation — artwork transforms restored
10. Optional: Generate realistic mockup (deterministic provider, no paid call)
11. Create quotation — draft estimate quote linked
12. Update simulation and re-convert — same quote line updated (no duplicate)

## Automated checks

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e -- e2e/cup-customizer.spec.ts
npm run build
npm run ai:doctor -- --provider abacus
```

## Safety constraints

- No email send
- No Brevo call
- No paid AI / image API in tests
- No production Supabase mutation
- No inventory ledger posting
- Synthetic artwork and demo pricing only in CI

## Known limitations at baseline

- Photorealistic mockup is a deterministic enhanced SVG in development, not a production print proof
- Pricing is estimate-only from operational demo rules
- Artwork blobs remain in local IndexedDB; not synced to cloud without future asset storage
- External JH Gomes website customizer API not integrated

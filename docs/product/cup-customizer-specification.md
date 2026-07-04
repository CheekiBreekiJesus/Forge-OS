# Cup Customizer Specification

Date: 2026-07-04  
Status: Active — JH Gomes MVP

## Users

| Persona | Capabilities |
|---------|--------------|
| Sales Representative | Create simulations, attach customers, generate draft quotations |
| Marketing Manager | Preview artwork, generate mockups for outreach context |
| Company Owner | Review estimates, approve quotations outside customizer |
| Customer Portal User | Not in scope for this MVP (future) |

## Core entities

### Cup customization project (`CustomizerSimulation`)

| Field | Type | Notes |
|-------|------|-------|
| id | string | `sim_*` |
| tenantId | string | Tenant isolation enforced |
| customerId | string \| null | Optional until quotation |
| contactId | — | Via customer/lead linkage |
| quotationId | `quoteId` | Set on conversion |
| status | `draft` \| `saved` \| `converted` \| `archived` | Persistence status |
| workflowStatus | display mapping | DRAFT → QUOTED derived for UI |
| name | `productName` + quantity | List display |
| createdBy | string | Actor |
| createdAt / updatedAt | ISO | Audit |

### Cup configuration (`CustomizerConfiguration`)

| Field | Description |
|-------|-------------|
| cup product/reference | `productId` + catalog `Product` |
| material | PP, Paper, Reusable |
| capacity | From product (`cupSize`) |
| cup colour | From product `color` field |
| quantity | Integer ≥ 1 |
| printing method | Screen print (operational rules) |
| number of printing colours | `printColorCount` 1–2 |
| print side/configuration | `wrap`, `front`, `back` |
| packaging option | Notes field (future structured) |
| setup requirements | Derived in pricing (`setupCost`, plate) |
| notes | Free text |

### Artwork

| Field | Storage |
|-------|---------|
| original filename | `LocalAsset.fileName` |
| MIME type | `LocalAsset.mimeType` |
| local asset reference | `artworkAssetId` |
| width / height | Validated on upload (future metadata) |
| position X/Y | `artworkOffsetX`, `artworkOffsetY` |
| scale | `artworkScale` |
| rotation | `artworkRotation` |
| print-area assignment | `printArea` |
| front/back assignment | `artworkPosition` |
| validation status | Upload validator result |

### Mockup

| Type | Implementation |
|------|----------------|
| Deterministic preview | `CupPreview` — source of truth for transforms |
| Operational SVG | `mockupAssetId` on save |
| Photorealistic (optional) | `mockupGeneration.realisticMockupAssetId` — explicit generate |
| generation status | `none` \| `generating` \| `complete` \| `stale` \| `failed` |
| provider | `deterministic` in dev; `abacus` when configured server-side |
| stale detection | Configuration fingerprint mismatch |

### Quotation link

| Field | Location |
|-------|----------|
| quotation ID | `CustomizerSimulation.quoteId` |
| quotation line | Single-line quote model (ForgeOS `Quote`) |
| pricing configuration version | `pricing.ruleId` |
| calculation result | `pricing` snapshot |
| currency | EUR |
| generatedAt | Quote `createdAt` / `updatedAt` |

## Workflow steps

1. **Product** — cup, capacity, material, quantity
2. **Printing** — colours, print area, cliché via pricing engine
3. **Artwork** — upload, transforms
4. **Preview** — deterministic cup preview
5. **Price and quotation** — estimate, customer, save, convert

Desktop: side-by-side panels. Mobile: step navigation with preserved state.

## Printing validation (JH Gomes)

| Option | Supported |
|--------|-----------|
| 1-colour printing | Yes |
| 2-colour printing | Yes (pricing engine) |
| Front print | Yes (`front`) |
| Front and back | Partial — `wrap` simulates full wrap; `back` as separate area |
| Print-area overflow | Warning in preview; allowed when configuration supports |

Unsupported options must not appear as silently accepted.

## Commercial data policy

- Consume `packages/cup-customizer` pricing engine
- Do not duplicate formulas in UI
- Missing data: show **Commercial data required**
- Manual override: labelled temporary, stored in `pricing.manualUnitPriceOverride`
- Never persist invented defaults as authoritative

## Privacy

- Artwork in IndexedDB `LocalAsset` only
- No automatic external upload
- No artwork in git
- Mockup generation in dev uses deterministic provider

## Reuse of ForgeOS entities

- `Product` from product catalog
- `Customer`, `Lead` from CRM
- `Quote` from quotations module
- `LocalAsset` from email-composition asset layer

No competing quotation or product architecture.

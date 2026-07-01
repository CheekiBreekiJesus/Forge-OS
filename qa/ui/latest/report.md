# ForgeOS UI/UX QA Report

## Codex Addendum - Marketing Studio Foundation

**Branch:** `feat/marketing-studio-foundation`
**Date:** 2026-07-01
**Scope:** Marketing Studio routes and local-only provider previews

### Routes Added For Review

| Route | Locale | Notes |
|---|---|---|
| `/pt-PT/marketing` | Portuguese | Marketing Studio overview |
| `/en/marketing` | English | Marketing Studio overview |
| `/pt-PT/marketing/campaigns` | Portuguese | Campaign Builder |
| `/pt-PT/marketing/image-studio` | Portuguese | Mock image generation |
| `/pt-PT/marketing/assets` | Portuguese | Asset Library |
| `/pt-PT/marketing/brand-kit` | Portuguese | Brand Kit |
| `/pt-PT/marketing/audiences` | Portuguese | Audiences |
| `/pt-PT/marketing/accounts` | Portuguese | Advertising account diagnostics |
| `/pt-PT/marketing/analytics` | Portuguese | Local analytics |
| `/pt-PT/marketing/video-studio` | Portuguese | Storyboard-only video studio |

### Current Assessment

Marketing Studio is suitable for local demo review only. It has local deterministic copy generation, mock image output, disabled Google Ads/Meta Ads provider previews, and local export packages. It does not perform live publishing, paid generation, external uploads, or provider metric sync.

### Required Manual Browser QA

- Verify the full-width desktop layout at 1440x900.
- Verify tablet layout at 768x1024.
- Verify mobile layout at 390x844.
- Confirm forms submit in Campaigns, Brand Kit, Audiences, Image Studio, Advertising Accounts, and Video Studio.
- Confirm the live-publish disabled state is visible and cannot be bypassed.

---

**Branch:** `codex/forgeos-foundation-app-shell`  
**Commit:** `65d253c`  
**Date:** 2026-06-29  
**Agent:** Cursor QA Observer (Phase 1 – Read-only)

---

## Routes Reviewed

| Route | Locale | Viewport |
|---|---|---|
| `/pt-PT` | Portuguese | Desktop ~526×829 (IDE browser) |
| `/en` | English | Desktop ~526×829 |
| `/pt-PT/leadops` | Portuguese | Desktop |
| `/en/leadops` | English | Mobile ~390×844 |
| `/pt-PT/leadops/leadops_001` | Portuguese | Desktop |

---

## Viewports

- Desktop: 1440×900 requested (IDE browser renders at ~526×829 – confirmed via `window.innerWidth`)
- Mobile: 390×844 requested (IDE browser approximates narrower)

> Note: The Cursor IDE embedded browser renders at a fixed internal width (~526px), below the `lg` (1024px) Tailwind breakpoint. All "desktop" screenshots show a narrow-viewport rendering. The sidebar is therefore hidden in all screenshots. Manual verification in a full browser at 1440px is required to confirm desktop sidebar layout.

---

## Overall Presentation-Readiness Assessment

**Rating: DEMO-READY WITH KNOWN GAPS**

The application shell, navigation structure, routing, dark industrial theme, and LeadOps module are coherent and functional. The layout renders correctly and the data model is sound.

Two issues significantly reduce demo quality and professionalism:

1. **The entire Portuguese dictionary lacks diacritics** — this is immediately visible to any Portuguese speaker and makes the product appear unfinished.
2. **The mobile hamburger menu button does nothing** — users on any viewport below 1024px have no sidebar access.

These two issues alone are presentation blockers for a Portuguese-speaking stakeholder demo.

---

## Findings

### FORGE-QA-001 — Missing diacritics in the entire pt-PT dictionary

**Severity:** High  
**Evidence:** `src/i18n/locales/pt-PT.ts`, all pages  
**Screenshots:** `desktop-dashboard.png` (see header and all card labels), `desktop-leadops.png`

**Description:**  
Nearly every Portuguese string in `src/i18n/locales/pt-PT.ts` is missing diacritical marks. The file appears to have been written without a Portuguese keyboard or spell-checker. Examples:

| Found | Correct |
|---|---|
| `"Producao"` | `"Produção"` |
| `"Orcamentos"` | `"Orçamentos"` |
| `"Maquinas"` | `"Máquinas"` |
| `"Manutencao"` | `"Manutenção"` |
| `"Definicoes"` | `"Definições"` |
| `"Inventario"` | `"Inventário"` |
| `"Aqui esta o resumo da sua operacao."` | `"Aqui está o resumo da sua operação."` |
| `"Aprovacao de logo/artwork"` | `"Aprovação de logo/artwork"` |
| `"Preparacao de quadros"` | `"Preparação de quadros"` |
| `"Abaixo do limite disponivel"` | `"Abaixo do limite disponível"` |
| `"Modulos MVP em preparacao"` | `"Módulos MVP em preparação"` |
| `"Empresa de referencia"` | `"Empresa de referência"` |
| `"Catalogo de produtos"` | `"Catálogo de produtos"` |
| `"Nao inclui dados operacionais privados."` | `"Não inclui dados operacionais privados."` |
| `"Visao geral para equipas operacionais."` | `"Visão geral para equipas operacionais."` |
| `"Proximas tarefas recomendadas"` | `"Próximas tarefas recomendadas"` |
| `"Orcamentos abertos"` | `"Orçamentos abertos"` |
| `"Alertas manutencao"` | `"Alertas de manutenção"` |

This pattern repeats throughout every section of the file (~200+ affected strings).

**User impact:** Any Portuguese-speaking user or stakeholder immediately recognizes the text as unfinished. All navigation labels, dashboard headings, and module descriptions are affected.

**Proposed correction:** Perform a full pass of `src/i18n/locales/pt-PT.ts` adding all missing cedillas (ç), acute accents (á, é, í, ó, ú), circumflexes (â, ê, ô), and tildes (ã, õ, ão, ões). Use European Portuguese conventions throughout. **This is the single highest-impact fix.**

**Files affected:**
- `src/i18n/locales/pt-PT.ts` (complete rewrite of text values)

---

### FORGE-QA-002 — Mobile hamburger menu button is non-functional

**Severity:** High  
**Evidence:** `src/components/app-frame.tsx` line 96–102

**Description:**  
The hamburger menu button rendered below the `lg` (1024px) breakpoint has no `onClick` handler and no associated mobile drawer or sheet component:

```tsx
<button
  aria-label="Menu"
  className="grid size-10 place-items-center rounded-lg border border-slate-700 text-slate-200 lg:hidden"
  type="button"
>
  =
</button>
```

The sidebar is `hidden lg:flex` — hidden below 1024px and visible at 1024px and above. At any viewport narrower than 1024px (which includes all tablets and mobile devices), clicking the "Menu" button has no effect. The user has no path to navigate between modules.

Additionally, the icon used is the literal equals character `=`, not a recognizable hamburger icon.

**User impact:** Complete loss of navigation on mobile and tablet. Any demo conducted on a narrow viewport or tablet will appear broken.

**Proposed correction:**
1. Add a `useState` for `isMobileMenuOpen`.
2. Add an `onClick={() => setIsMobileMenuOpen(true)}` to the button.
3. Render a slide-in drawer/overlay with the sidebar contents when `isMobileMenuOpen` is true.
4. Replace `=` with three horizontal `<span>` bars or an SVG hamburger icon.

**Files affected:**
- `src/components/app-frame.tsx`

---

### FORGE-QA-003 — "Gerar email PT-PT" button: generation unconfirmed via automated testing

**Severity:** Medium (unconfirmed — requires manual browser verification)  
**Evidence:** `src/components/leadops-detail-workspace.tsx` lines 80–96, browser interaction

**Description:**  
During automated testing, clicking the "Gerar email PT-PT" button did not populate the `Assunto` or `Mensagem` fields. Multiple click methods were attempted (browser tool ref click, JS `.click()` dispatch, Enter key press). The DOM confirmed no `readOnly` attribute and correct checked state on product checkboxes, but the textarea remained empty throughout.

The source code logic appears correct: `generatePtPtEmail()` should produce a valid message when a campaign is selected, and `campaign_001` is pre-selected. The most likely explanation is that the Cursor IDE browser's JavaScript context does not correctly propagate click events to React's synthetic event system.

**Manual verification required:** Open `http://localhost:3000/pt-PT/leadops/leadops_001` in a standard browser, click "Gerar email PT-PT", and confirm the Assunto and Mensagem fields populate.

**If confirmed as real bug:** The `generateMessage` function relies on `selectedCampaign` not being null. Verify the `campaigns` prop is received correctly by the client component.

**Files affected:**
- `src/components/leadops-detail-workspace.tsx`
- `src/features/leadops/workflow.ts`

---

### FORGE-QA-004 — "X selected" counter hardcoded in English

**Severity:** Medium  
**Evidence:** `src/components/leadops-dashboard-shell.tsx` line 256

**Description:**  
The selection counter that appears after selecting leads is hardcoded as English:

```tsx
<span className="text-xs text-slate-500">{selectedLeadIds.length} selected</span>
```

This string is not in the dictionary and appears in English even on the `pt-PT` locale.

**User impact:** Minor inconsistency visible only when leads are selected.

**Proposed correction:**  
Add `selectedCount` key to `leadops` → `table` in both locale dictionaries, e.g.:
- `pt-PT`: `"selecionados"`
- `en`: `"selected"`

Then use `{copy.table.selectedCount}` in the component.

**Files affected:**
- `src/i18n/locales/pt-PT.ts`
- `src/i18n/locales/en.ts`
- `src/components/leadops-dashboard-shell.tsx`

---

### FORGE-QA-005 — Static date range in header is two years out of date

**Severity:** Low  
**Evidence:** `src/i18n/locales/pt-PT.ts` line 25, `src/i18n/locales/en.ts` line 25

**Description:**  
Both locale dictionaries contain a hardcoded date range:
- pt-PT: `"13 - 19 Maio 2024"`
- en: `"13 - 19 May 2024"`

The current date is June 2026. This is visually jarring in a demo context — the header reads as if the dashboard is stale by two years.

**User impact:** Reduces credibility in any live demo or stakeholder walkthrough.

**Proposed correction:**  
For MVP/prototype, replace the hardcoded date with `"Demo"` or a relative string. For production, drive the date range from a real operational context variable.

**Files affected:**
- `src/i18n/locales/pt-PT.ts`
- `src/i18n/locales/en.ts`

---

### FORGE-QA-006 — Portuguese product labels in workflow.ts lack diacritics

**Severity:** Low  
**Evidence:** `src/features/leadops/workflow.ts` lines 15–40, lines 139–163

**Description:**  
The `leadOpsProductCatalog` pt-PT labels and `buildSequencePreview` strings are missing diacritics:

| Found | Correct |
|---|---|
| `"copos de plastico personalizados"` | `"copos de plástico personalizados"` |
| `"talheres biodegradaveis"` | `"talheres biodegradáveis"` |
| `"descartaveis para food-service"` | `"descartáveis para food-service"` |
| `"solucoes de embalagem"` | `"soluções de embalagem"` |
| `"Seguimento curto a confirmar se faz sentido enviar opcoes..."` | `"...opções..."` |
| `"Ultima nota de baixa pressao..."` | `"Última nota de baixa pressão..."` |
| `"Opcoes JH Gomes para ${lead.companyName}"` | `"Opções JH Gomes para..."` |

**User impact:** Product names shown in the LeadOps composer appear unfinished.

**Proposed correction:** Update all `ptLabel` strings and hardcoded pt-PT text in `workflow.ts` to use correct Portuguese diacritics.

**Files affected:**
- `src/features/leadops/workflow.ts`

---

### FORGE-QA-007 — Email body loses paragraph breaks due to `.filter(Boolean)`

**Severity:** Low  
**Evidence:** `src/features/leadops/workflow.ts` lines 118–136

**Description:**  
The generated email body is constructed as an array with intentional blank-line separators (`""`), then filtered with `.filter(Boolean)`:

```ts
body: [
  `${greeting},`,
  "",             // paragraph break — removed by filter!
  contextSentence,
  ...
]
  .filter(Boolean)  // strips "" entries
  .join("\n"),
```

`filter(Boolean)` treats empty strings as falsy and removes them. The resulting email body has no paragraph breaks — all sentences run together in a single block, which is poor email formatting.

**User impact:** Generated emails appear as a single unbroken paragraph in the preview and would be sent without proper spacing.

**Proposed correction:** Replace `.filter(Boolean)` with `.filter((line) => line !== undefined && line !== null)` to preserve intentional empty-string paragraph separators.

**Files affected:**
- `src/features/leadops/workflow.ts`

---

### FORGE-QA-008 — `activeModule` inconsistency between LeadOps list and detail views

**Severity:** Low (code quality, no visible UX regression)  
**Evidence:** `src/components/leadops-dashboard-shell.tsx` line 86, `src/components/leadops-detail-workspace.tsx` line 181

**Description:**  
The LeadOps dashboard shell passes `activeModule="marketing"`, while the LeadOps detail workspace passes `activeModule="customers"`. Because `isLeadOpsActive` (derived from `supplementalRoute`) overrides the module highlight logic when on a `/leadops/...` route, this inconsistency has no visible effect today.

However, if the `isLeadOpsActive` logic ever changes, the sidebar could highlight the wrong module.

**Proposed correction:** Standardise both to `activeModule="marketing"` (or introduce a `"leadops"` module key).

**Files affected:**
- `src/components/leadops-detail-workspace.tsx`

---

### FORGE-QA-009 — Filter option values are in English regardless of locale

**Severity:** Informational  
**Evidence:** `src/components/leadops-dashboard-shell.tsx`, `src/features/leadops/seed.ts`

**Description:**  
The LeadOps filter dropdowns (Industry, Status, Quality, Source) derive their option values directly from the seed data (`lead.industry`, `lead.status`, etc.). These values are in English: "Hospitality", "Events", "Food & Beverage", "ready", "queued", "high", "medium".

The Status and Quality options are rendered as-is in the filter `<select>`, not through the locale dictionary's `statuses`/`qualities` maps (which would show localized values). Only the lead table rows use the dictionary for display.

**User impact:** On the `pt-PT` locale, filter dropdowns show English option values.

**Proposed correction:** Use localized labels for filter option display. Pass a translation function to `FilterSelect` or pre-localize filter options through the view model.

**Files affected:**
- `src/components/leadops-dashboard-shell.tsx`
- `src/features/leadops/view-models.ts`

---

## Functional Regression Results

| Step | Result | Notes |
|---|---|---|
| 1. Open LeadOps | PASS | Route `/pt-PT/leadops` loads correctly |
| 2. Open a lead | PASS | `/pt-PT/leadops/leadops_001` loads with lead data |
| 3. Product selection (UI state) | PASS (DOM-confirmed) | First 2 products pre-selected; checkboxes not disabled; `readonly` accessibility state was a false positive |
| 4. Generate PT-PT message | UNCONFIRMED | Button click registered but textarea remained empty in IDE browser; code logic appears correct; manual browser verification required |
| 5. Edit message | NOT TESTED | Blocked by step 4 |
| 6. Approve message | NOT TESTED | Blocked by step 4 |
| 7. Assign campaign | PARTIAL | Campaign select renders 4 options correctly; selection not tested end-to-end |
| 8. Review sequence | PASS | Sequence preview panel renders correctly (placeholder text) |
| 9. Queue message | NOT TESTED | Blocked by step 4 (button correctly disabled without approved message) |
| 10. Simulate sending | NOT TESTED | Blocked by step 4 |
| 11. Status, metrics, activity | NOT TESTED | Blocked by step 4 |

---

## Recommended Action Order

| Priority | Finding | Fix Complexity |
|---|---|---|
| 1 | **FORGE-QA-001** – pt-PT diacritics | Medium (text only, 1 file) |
| 2 | **FORGE-QA-006** – workflow.ts diacritics | Low (text only, 1 file) |
| 3 | **FORGE-QA-002** – Mobile menu button | Medium (requires drawer component) |
| 4 | **FORGE-QA-003** – Email generation (manual verification first) | Unknown until confirmed |
| 5 | **FORGE-QA-007** – Email paragraph breaks | Low (1-line change) |
| 6 | **FORGE-QA-004** – "selected" counter localization | Low |
| 7 | **FORGE-QA-005** – Stale date range | Low |
| 8 | **FORGE-QA-008** – activeModule inconsistency | Low |
| 9 | **FORGE-QA-009** – Filter localization | Medium (view model change) |

---

## Notes for Phase 2

- FORGE-QA-001 and FORGE-QA-006 are pure text changes — safe for Cursor to apply.
- FORGE-QA-002 (mobile drawer) requires adding a stateful overlay component — Codex is better suited if the fix grows beyond a simple toggle.
- FORGE-QA-003 must be manually confirmed in a real browser before any code change.
- FORGE-QA-007 is a 1-line change with high formatting impact — safe for Cursor.
- FORGE-QA-004 requires a small dictionary addition + component update — safe for Cursor.
- Do not alter domain logic, seed data, or workflow business rules.

---

*Report generated by Cursor QA Observer — Phase 1 complete. Awaiting approval to proceed to Phase 2.*

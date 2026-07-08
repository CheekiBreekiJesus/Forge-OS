# ForgeOS Dashboard Visual Refresh

## Visual references

- Dark: `docs/design/references/forgeos-dashboard-dark.png`
- Light: `docs/design/references/forgeos-dashboard-light.png`

## Current component map

| Area | Files |
|------|-------|
| App shell | `src/components/app-frame.tsx`, `app-frame-client.tsx`, `app-frame-nav.tsx`, `mobile-nav-drawer.tsx` |
| Theme | `src/theme/tokens.css`, `theme-provider.tsx`, `theme-script.tsx`, `theme-storage.ts`, `ui-classes.ts` |
| Dashboard | `src/components/dashboard-client-shell.tsx`, `src/components/dashboard/*` |
| Dashboard data | `src/features/dashboard/metrics.ts`, `preferences.ts`, `alerts.ts`, `copilot.ts` |
| Navigation | `src/modules/config.ts`, `src/features/crud/role-preview.tsx` |
| Preview modules | `src/components/module-page-shell.tsx`, `src/i18n/preview-module-copy.ts` |

## Target component map

The live dashboard route (`/[locale]`) renders `DashboardClientShell`, which composes:

- KPI row (`DashboardKpiCard`)
- Marketing summary (`MarketingSummaryCard`)
- Operational panels (`OeeSummary`, `InventorySummary`, `AlertsActivityPanel`)
- Business panels (`ProductionOrdersTable`, `RevenueChart`, `DashboardCopilot`)
- Customize dialog (`DashboardCustomizeDialog`)

## Theme strategy

- Semantic CSS variables in `src/theme/tokens.css` for dark and light modes
- Inline init script prevents flash of incorrect theme
- `ThemeProvider` persists user preference in `localStorage` key `forgeos:theme`
- Components consume tokens through utility classes and `var(--forge-*)` references

## Navigation strategy

- `primaryNavKeys` defines sidebar order
- LeadOps remains a supplemental route with dedicated nav item
- Preview modules route to polished shells via `ModulePageShell` + `preview-module-copy.ts`
- Existing functional routes unchanged (`/quotations`, `/leadops`, `/customers`, etc.)

## Responsive strategy

- Desktop: fixed sidebar, 5-column KPI grid, 3-column panels
- Tablet/mobile: drawer navigation, stacked panels, horizontally scrollable tables

## Module status map

| Module | Status |
|--------|--------|
| Dashboard | Live |
| Outreach / LeadOps | Live |
| Customers, Products, Quotations, Production, Inventory, Machines, Settings | Live CRUD |
| CRM, Sales Orders, Molds, Quality, Purchasing, Suppliers, Sales, Billing, Reports | Preview shells |
| Marketing | Preview shell; Outreach is the functional marketing workflow |

## Functionality preserved

- Outreach generate → edit → approve → copy → Gmail/Outlook → mark sent
- Role-based navigation filtering
- Locale switching (PT / EN)
- Local persistence and dashboard metrics from IndexedDB
- Onboarding checklist and notifications

## Customization behavior

Preferences stored in `forgeos:dashboard-preferences`:

- Panel visibility
- Panel order
- Density (comfortable / compact)
- Default date range

## Demo vs live metrics

- KPI cards mark preview values with localized demo label
- OEE and revenue use local quote/production data when present
- Inventory and alerts prefer repository records, falling back to preview items

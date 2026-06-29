# ForgeOS — Dashboard UI/UX Design Plan

Reference: JH Gomes dashboard mockup (dark industrial theme, pt-PT copy).

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0B1120` | Page background |
| `--surface` | `#111827` | Cards, sidebar |
| `--surface-elevated` | `#1F2937` | Hover, inputs |
| `--primary` | `#F97316` | Active nav, CTAs |
| `--success` | `#22C55E` | Positive deltas |
| `--danger` | `#EF4444` | Overdue, high alerts |
| `--info` | `#3B82F6` | Charts, info badges |
| `--foreground` | `#F9FAFB` | Primary text |
| `--muted` | `#9CA3AF` | Secondary text |

**Typography:** Inter or system sans; dense tables at 13–14px body.

**Spacing:** 4px grid; card padding 16–20px; sidebar width 240px.

## Layout Regions

```
┌──────────┬────────────────────────────────────────────────┐
│ Sidebar  │ TopBar (search, locale, notifications, theme)  │
│ 240px    ├────────────────────────────────────────────────┤
│          │ Greeting + date range + Personalize            │
│          ├────────────────────────────────────────────────┤
│          │ KPI row (5 cards)                              │
│          ├────────────────────────────────────────────────┤
│          │ OEE (4col) │ Inventory (4col) │ Alerts (4col)   │
│          ├────────────────────────────────────────────────┤
│          │ Orders (4col)│ Revenue (4col) │ Copilot (4col)  │
├──────────┴────────────────────────────────────────────────┤
│ Status footer                                                │
└──────────────────────────────────────────────────────────────┘
```

## Component Map

| UI Block | Package | i18n namespace |
|----------|---------|----------------|
| AppSidebar | `apps/web` | `nav.*` |
| TopBar | `apps/web` | `shell.*` |
| KpiCard | `@forgeos/ui` | `dashboard.kpi.*` |
| OeeWidget | `apps/web` | `dashboard.oee.*` |
| InventorySummary | `apps/web` | `dashboard.inventory.*` |
| AlertsFeed | `apps/web` | `dashboard.alerts.*` |
| ProductionOrdersTable | `apps/web` | `dashboard.production.*` |
| RevenueChart | `apps/web` | `dashboard.revenue.*` |
| CopilotPanel | `apps/web` | `copilot.*` |
| StatusFooter | `apps/web` | `footer.*` |

## Interaction Patterns

- **Ctrl+K:** Command palette (search) — Phase 1 placeholder
- **Language:** Dropdown updates `locale` cookie + `next-intl` without reload
- **Theme:** Toggle `class="dark"` / `light` on `<html>`
- **Personalize:** Modal to toggle widget visibility (persists via API)
- **Date range:** Updates all KPI/chart queries via shared URL state `?from=&to=`

## Accessibility

- WCAG 2.1 AA contrast on dark theme
- Focus rings on interactive elements
- `aria-live` for alert feed updates
- Chart data tables available as screen-reader fallback (future)

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| ≥1280px | Full 12-column grid per mockup |
| 1024–1279 | Stack row 2 into 2+1 columns |
| <1024 | Sidebar collapses to icon rail; copilot full-width below |

## Module Navigation (Sidebar)

All labels from `nav` keys: dashboard, crm, customers, quotations, orders, production, inventory, maintenance, molds, quality, purchasing, sales, invoicing, reports, marketing, settings.

Phase 1: only Dashboard route implemented; others show "Coming soon" page with same shell.

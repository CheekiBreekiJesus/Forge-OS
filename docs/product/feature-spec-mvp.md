# ForgeOS — Phase 1 MVP Feature Specification

## Product Overview

**ForgeOS** is a multi-tenant Industrial Operating System unifying ERP, MES-lite, WMS, CMMS, CRM, and AI Copilot for manufacturing SMEs.

**Tagline:** One Operating System for the Modern Factory

**First tenant:** JH Gomes (Portugal) — default locale `pt-PT`

---

## Phase 1 Scope (MVP)

| Module | Priority | Description |
|--------|----------|-------------|
| Dashboard | P0 | Role/tenant-customizable KPIs, widgets, alerts feed |
| CRM | P0 | Pipeline: Lead → Contacted → Quotation → Negotiation → Won → Production |
| Customers | P0 | B2B customer master, contacts, addresses |
| Quotations | P0 | Quote builder, line items, status workflow |
| Inventory | P0 | Stock levels, movements ledger, min thresholds, QR-ready IDs |
| Production Orders | P0 | Work orders, progress %, delivery dates |
| AI Copilot | P1 | Tool-using agent; responds in user locale; queries in English |
| Internal Newsletter | P2 | Tenant-scoped announcements ("What's New") |

**Out of scope (Phase 2+):** CMMS, molds, quality, invoicing, CMS, predictive maintenance.

---

## Dashboard (P0) — Functional Requirements

### KPI Row
- Production OEE (%) with sparkline and week-over-week delta
- Weekly revenue (currency formatted per locale)
- Open quotations count
- Overdue orders count (negative trend = good)
- Maintenance alerts count

### Widgets
- **OEE:** Donut (availability, performance, quality) + daily bar chart
- **Inventory summary:** Top N items with stock vs minimum progress bars
- **Alerts & activities:** Prioritized feed (high / medium / low)
- **Production orders table:** OP id, product, qty, progress bar, delivery date
- **Revenue chart:** Line chart for selected date range
- **AI Copilot panel:** Chat UI with suggested actions

### Global Shell
- Sidebar navigation (all Phase 1+ module placeholders)
- Tenant selector
- Search (Ctrl+K)
- Language switcher (pt-PT, en, es-ES) — no full page reload
- Notifications badge
- Theme toggle (dark default, light optional)
- User profile + role display
- Footer: version, system status, environment badge, support link

### Customization
- Per-user widget visibility/order (stored per tenant + user)
- Date range selector for dashboard metrics

---

## Multilingual Rules (Non-Negotiable)

| Layer | Language |
|-------|----------|
| UI strings | i18n keys only — never hardcoded in components |
| Backend code, schema, APIs, logs | English only |
| User-facing DB content | `entity_translations` or JSONB localized fields |
| AI responses | User's selected UI language |
| AI tool queries | English |

---

## Multi-Tenant & Security

- Every business table includes `tenant_id`
- RLS policies on Supabase enforce tenant isolation
- RBAC: roles (e.g. `director`, `production_manager`, `warehouse_operator`, `sales`)
- Audit log on create/update/delete for critical entities

---

## Success Criteria (MVP)

1. JH Gomes tenant can log in and see localized dashboard (pt-PT default)
2. Language switches at runtime with correct date/currency/number formatting
3. Sample KPI data renders from API or seed data
4. No cross-tenant data visible in integration tests
5. AI Copilot stub accepts messages and returns localized placeholder responses

---

## Non-Functional Requirements

- Desktop-first management UX; responsive down to tablet
- Dark mode default (`#0B1120` industrial palette)
- LCP < 2.5s on dashboard (Vercel edge)
- Sentry error tracking in production
- Vitest unit tests for shared/i18n; Playwright smoke for dashboard shell

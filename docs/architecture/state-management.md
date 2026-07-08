# ForgeOS — State Management Approach

## Principles

1. **Server state by default** — Dashboard metrics, orders, inventory from Supabase via Server Components and Route Handlers
2. **Minimize client state** — Only UI chrome and ephemeral interaction state on the client
3. **Tenant + locale in server context** — Never trust client for `tenant_id`

## State Categories

| Category | Technology | Examples |
|----------|------------|----------|
| Remote / domain | Supabase + React Query (client widgets only) | KPI refresh, copilot stream |
| URL state | `nuqs` or Next.js `searchParams` | Date range, active tab |
| Session | Supabase Auth cookies | User, tenant, role |
| UI preferences | Zustand + `localStorage` persist | Sidebar collapsed, theme |
| Dashboard layout | Zustand + API sync | Widget order/visibility |
| i18n locale | `next-intl` + cookie `FORGEOS_LOCALE` | pt-PT, en, es-ES |
| Form state | React Hook Form + Zod | Quotation builder (future) |

## Dashboard Page Data Flow

```
Request
  → middleware: auth + locale cookie
  → layout: load tenant, user, messages(locale)
  → page (RSC): parallel fetch dashboard APIs
  → stream HTML with widgets
  → client islands: charts (Recharts), copilot input, theme toggle
```

## Zustand Store: `useShellStore`

```typescript
{
  sidebarCollapsed: boolean
  theme: 'dark' | 'light'
  setSidebarCollapsed: (v: boolean) => void
  setTheme: (v: 'dark' | 'light') => void
}
```

Persist: `localStorage` key `forgeos-shell`

## Zustand Store: `useDashboardStore`

```typescript
{
  widgetConfig: WidgetConfig[]
  setWidgetConfig: (config: WidgetConfig[]) => void
  syncFromServer: () => Promise<void>
}
```

Optimistic update on personalize → `PATCH /api/v1/dashboard/widgets` → rollback on error.

## AI Copilot Conversation State

- `conversation_id` in component state or URL
- Message list: client state during session; persisted server-side Phase 1.1
- Streaming: SSE from `/api/v1/copilot/chat` (future)

## Caching

| Data | Strategy |
|------|----------|
| Dashboard summary | `revalidate: 60` seconds |
| Static nav/i18n | Build-time + edge cache |
| User profile | `no-store` |
| Inventory movements | Never cache client-side |

## Realtime (Phase 2)

Supabase Realtime subscriptions scoped by `tenant_id` for production status and alerts.

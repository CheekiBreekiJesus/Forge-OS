# ForgeOS — Testing Strategy

## Pyramid

```
        ┌─────────────┐
        │ Playwright  │  E2E smoke (dashboard, i18n switch)
        ├─────────────┤
        │ Integration │  API routes + Supabase local
        ├─────────────┤
        │ Vitest unit │  i18n, shared, formatters, RBAC helpers
        └─────────────┘
```

## Tools

| Tool | Scope |
|------|-------|
| Vitest | `packages/i18n`, `packages/shared`, `packages/api` |
| Playwright | `apps/web` critical paths |
| Supabase CLI | Local DB + RLS policy tests (future) |

## MVP Test Cases

### Unit (Vitest)
- `formatCurrency(124850, 'pt-PT', 'EUR')` → correct symbol/placement
- `formatDateRange` for pt-PT vs en
- Translation key resolution with fallback to `en`
- Zod schemas reject cross-tenant UUID in wrong shape

### Integration
- `GET /api/v1/dashboard/summary` returns 401 without auth
- Tenant A cannot read Tenant B customer (RLS)

### E2E (Playwright)
1. Load `/dashboard` — greeting visible in pt-PT
2. Switch language to English — nav labels change without reload
3. KPI cards render five metrics
4. Theme toggle switches light/dark class on `html`
5. Sidebar shows ForgeOS logo and active Dashboard state

## CI (GitHub Actions — future)

```yaml
- pnpm install
- turbo run lint typecheck test
- playwright install --with-deps
- turbo run e2e --filter=web
```

## Coverage Targets (MVP)

| Package | Line coverage goal |
|---------|-------------------|
| i18n | ≥90% |
| shared | ≥80% |
| web UI | E2E smoke only initially |

## Test Data

- Seed script: tenant `jh-gomes`, user João Gomes, sample KPIs matching mockup
- Never use production credentials in CI

## Sentry

- Staging/production: capture unhandled errors
- Source maps uploaded from Vercel build

# ForgeOS

**One Operating System for the Modern Factory**

Multi-tenant Industrial OS for manufacturing — ERP, MES-lite, WMS, CMMS, CRM, and AI Copilot in a single platform.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — defaults to **pt-PT** dashboard (JH Gomes pilot).

## Repository Structure

```
apps/
  web/       # Next.js management UI (Phase 1)
  admin/     # Platform admin (stub)
  mobile/    # Shop floor PWA (stub)
packages/
  i18n/      # pt-PT, en, es-ES message catalogs
  ui/        # Shared UI components
  shared/    # Types, demo data
  database/  # Supabase SQL migrations
  auth/      # Session helpers (stub)
  api/       # API layer (stub)
  ai/        # Copilot tools (stub)
docs/        # Architecture & product specs
```

## Multilingual

| Layer | Language |
|-------|----------|
| UI | `pt-PT` (default), `en`, `es-ES` via `@forgeos/i18n` |
| Backend / DB / APIs | English only |

## Documentation

- [MVP Feature Spec](docs/product/feature-spec-mvp.md)
- [System Architecture](docs/architecture/system-design.md)
- [Database Schema](docs/database/schema-overview.md)
- [API Contract](docs/api/api-contract-mvp.md)
- [Roadmap](docs/roadmap/phases.md)

## Tech Stack

Next.js · React · TypeScript · Tailwind · shadcn-style UI · Supabase · OpenAI · Vercel · Vitest · Playwright

## License

Proprietary — JH Gomes / ForgeOS

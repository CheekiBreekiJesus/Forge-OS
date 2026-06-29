# ForgeOS

ForgeOS is an early MVP prototype for a multi-tenant industrial operating system for manufacturing SMEs.

The first deployment target is JH Gomes, but the platform must remain generic and tenant-aware from the beginning.

## Current Status

Implemented:

- Next.js App Router foundation
- TypeScript configuration
- Tailwind CSS styling
- ESLint configuration
- Localized routes for `pt-PT` and `en`
- Structured translation dictionaries
- Static industrial dashboard shell inspired by the ForgeOS design direction
- Placeholder modules for Dashboard, Customers, Products, Orders, Production, Inventory, Machines, Maintenance, Marketing, and Settings
- Client-side JH Gomes demo workflow from lead to inventory reservation
- Supabase/PostgreSQL schema and seed files for the persistent demo MVP
- Static demo API routes for automation fixtures and Copilot prompt responses
- Operational foundation for article master data, labels, machines, routings, quote rules, quality templates, document templates, import templates, and large-order preparation
- Vitest coverage for the core demo workflow

Not implemented yet:

- Supabase client/server integration
- Supabase Auth-backed sessions
- Persistent CRUD operations
- AI provider integration
- Supabase Storage-backed artwork upload

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

- `http://localhost:3000/pt-PT/login`
- `http://localhost:3000/pt-PT`
- `http://localhost:3000/en`

The root route redirects to `pt-PT`.

## JH Gomes Demo Flow

Current demo entry points:

- Login shell: `http://localhost:3000/pt-PT/login`
- Dashboard: `http://localhost:3000/pt-PT`
- Interactive CRM to production flow: `http://localhost:3000/pt-PT/demo`
- Product catalog: `http://localhost:3000/pt-PT/products`
- Automation fixture API: `http://localhost:3000/api/demo/automation?locale=pt-PT`
- Copilot fixture API: `http://localhost:3000/api/demo/copilot?action=summarize-dashboard`
- Operational fixture API: `http://localhost:3000/api/demo/operational`

The interactive demo currently runs client-side with seeded demo data. It covers:

- Create lead
- Convert lead to customer/opportunity
- Create personalized cup quote
- Upload artwork placeholder
- Approve quote
- Create production order
- Generate job card
- Assign compatible machine
- Update artwork/screen status
- Log production progress
- Reserve inventory

Still pending:

- Supabase Auth and real login/session handling
- Supabase Storage-backed artwork uploads
- Persistent CRM/quote/production records
- Persistent product, quotation rule, quality, import, document, and large-order workflows
- n8n webhook delivery
- OpenAI-backed copilot responses
- Playwright test suite
- Printable PDF generation

## Verification

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

## Supabase Persistence Draft

The repo includes a Supabase schema draft for the JH Gomes demo MVP:

- Migration: `supabase/migrations/202606150001_demo_mvp_schema.sql`
- Seed data: `supabase/seed.sql`

The schema includes tenant-scoped tables for products, leads, customers, opportunities, quotes, machines, production orders, job cards, inventory, stock movements, quote requests, email templates, webhook events, and Copilot actions.

The operational foundation migration adds product master extensions, suppliers, warehouses, locations, labels/packaging, production routings, configurable quotation rules and tiers, quote versions, price override audit logs, production setup records, quality templates/records, document templates, import templates/batches, and large-order preparation records.

Additional handover documentation:

- `docs/ai-context/11-operational-foundation.md`

The app still runs from local demo data. Supabase Auth, Storage, and CRUD wiring are the next persistence step.

## Project Rules

- Internal code, routes, types, database fields, and API naming must stay in English.
- User-facing text must come from localization dictionaries.
- Supported MVP locales are `pt-PT` and `en`.
- Spanish `es` should be easy to add later, but is not translated yet.
- Do not commit secrets, private customer data, supplier records, or private business data.
- Do not hardcode JH Gomes-specific workflows into global modules.

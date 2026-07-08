# ForgeOS Operational Foundation

Date: 2026-06-26

## Current Repository Audit

Confirmed implementation:

- Next.js App Router, React, TypeScript, Tailwind CSS.
- Localized `pt-PT` and `en` routes.
- Static/demo login, dashboard, product catalog, CRM-to-production demo flow, and operator job-card page.
- Synthetic JH Gomes tenant and demo data only.
- Supabase migrations and seed files for tenant-scoped demo persistence.
- Demo API routes for automation, Copilot, and operational fixtures.
- Vitest coverage for quotation, production job-card generation, stock reservation, automation fixtures, Copilot responses, operational quote rules, stock movement rules, production metrics, and import validation.

Technical debt and missing functionality:

- Supabase Auth is modeled but not wired into the Next.js runtime.
- Supabase client/server integration is not implemented yet.
- CRUD screens are still demo shells; durable writes are pending.
- shadcn/ui is not installed despite being a target stack item.
- Playwright is not configured yet.
- PDF generation is modeled through document templates but not implemented.
- Import templates and validation exist in code; file upload/import execution is pending.

## Database Changes

Migration:

- `supabase/migrations/202606260001_operational_foundation.sql`

New or extended areas:

- Product/article master data: product code, designation, family, supplier, units, package/box/pallet quantities, barcode, QR code, location, lifecycle status, labels, materials, packaging, compatible machines, and process type.
- Process types: direct sale, label application, repacking/labelling, internal production/customization.
- Suppliers, warehouses, and warehouse locations.
- Labels and packaging with versioning.
- Machine metadata: manuals, supported operations, setup time, speed, maintenance status, and defects.
- Production routings and routing steps.
- Configurable quotation rules, tiers, quote versions, and price override audit logs.
- Production setup records and expanded production result fields.
- Quality templates and quality records.
- Document templates and import templates.
- Import batches with error reports.
- Large-order preparation records and lines.

RLS:

- Every new tenant-scoped table has Row Level Security enabled.
- Policies use `public.current_user_tenant_ids()` to restrict tenant access.
- Storage paths are documented as tenant-scoped under `artwork/`, `labels/`, `documents/`, and `imports/`.

## API And Server Actions

Current demo API routes:

- `GET /api/demo/automation`
- `GET /api/demo/copilot`
- `GET /api/demo/operational`

Server actions are not implemented yet. The next persistence step should add tenant-checked server actions for product creation, quotation version creation, stock movement posting, quality record creation, and large-order preparation updates.

## Functional Domain Logic

Files:

- `src/demo/operational-types.ts`
- `src/demo/operational-seed.ts`
- `src/demo/operational-workflows.ts`

Implemented logic:

- Configurable personalized cup quote calculation using seeded quotation rules and quantity tiers.
- Manual unit price override audit log generation.
- Stock movement application for reservation, consumption, receipt, production output, transfer, adjustment, cycle count, and full count.
- Production metrics: completion rate, scrap rate, rejection rate, setup time, production duration, downtime, units per hour, estimated versus actual performance.
- Import template required-field validation.

## JH Gomes Process Types

- Type 1: `direct-sale`
- Type 2: `label-application`
- Type 3: `repacking-labelling`
- Type 4: `internal-production`

The schema stores process types as data so custom tenant-specific variants can be added later.

## Document Templates

Modeled template types include quotation, sales order, production order, setup sheet, production log, quality inspection, non-conformity report, waste record, downtime record, picking list, large-order preparation sheet, packing list, inventory count sheet, and goods receipt.

Current status: metadata and required fields exist; actual print/PDF rendering is pending.

## Import Templates

Modeled import templates include products, suppliers, customers, labels, machines, warehouses, locations, opening stock, quotation pricing rules, bills of materials, and routings.

Current status: template metadata, example columns, and validation rules exist; upload parsing and import execution are pending.

## Testing Strategy

Current:

- `npm run test` covers core demo logic and operational workflow rules.
- `npm run typecheck`, `npm run lint`, and `npm run build` are required gates.

Next:

- Add database migration validation with a local Supabase test database.
- Add integration tests for server actions once persistence is wired.
- Add Playwright for login, quote creation, product creation, production order, barcode inventory, and large-order preparation flows.

## Known Limitations

- Data is synthetic and safe for demo use.
- No private JH Gomes customer, supplier, pricing, or operational data is included.
- Auth, role enforcement in the running app, file storage, PDF generation, and import execution are not complete.
- Real JH Gomes master data must be collected and imported through the templates before production use.

# 02 Current Architecture

## 1. Current Technical Stack

Known / preferred:
- Web application
- React or Next.js
- Tailwind CSS
- TypeScript preferred
- GitHub repository
- Agentic coding workflow using Codex / Cursor / Claude Code

Not yet defined:
- Exact framework version
- Database
- ORM
- Auth provider
- Deployment platform
- File storage provider
- AI provider
- Background jobs
- Email provider
- CMS architecture

## 2. Frontend Architecture

Recommended:
- Use a modular app structure.
- Use reusable components.
- Use a layout system suitable for dashboard software.
- Use i18n from the start.
- Keep business-specific screens separate from generic components.

Suggested high-level areas:
- `/dashboard`
- `/customers`
- `/orders`
- `/production`
- `/inventory`
- `/machines`
- `/maintenance`
- `/marketing`
- `/settings`

Assumption:
- Next.js App Router is a suitable default unless the repo already uses another structure.

## 3. Backend Architecture

Not yet defined.

Recommended:
- Use backend/API routes compatible with the chosen frontend framework.
- Keep business logic in service/domain layers, not directly inside UI components.
- Enforce tenant isolation in all queries.
- Use explicit validation for all write operations.
- Add audit fields to important records.

## 4. Database / Storage Architecture

Not yet defined.

Recommended default:
- Relational database.
- Tenant-scoped tables.
- Clear core entities:
  - Tenant
  - User
  - Customer
  - Product
  - Order
  - ProductionJob
  - InventoryItem
  - Machine
  - MaintenanceTask
  - TechnicalSheet
  - MarketingAsset

Potential database:
- PostgreSQL

Potential ORM:
- Prisma or Drizzle

Status:
- Not yet confirmed.

## 5. Authentication / Authorization Model

Not yet defined.

Required:
- Multi-tenant user model.
- Users belong to one or more tenants.
- Roles/permissions required.

Suggested roles:
- Owner
- Admin
- Manager
- Operator
- Sales
- Marketing
- Viewer

Open Question:
- Should users support membership in multiple companies/tenants?

## 6. External Integrations

Known desired integrations:
- Website/CMS publishing
- SEO tooling
- Email marketing
- Social media post generation
- UPS shipping quote
- Competitor price scraping
- Barcode scanning through mobile devices
- AI provider for copilots/agents

Mentioned business context:
- Brevo is used for marketing email by JH Gomes.

Not yet defined:
- Whether ForgeOS should integrate directly with Brevo in MVP.
- Which shipping API to use.
- Which AI provider to use.
- Which CMS architecture to use.

## 7. AI / Agent Architecture

Relevant but not yet implemented.

Potential AI features:
- AI copilot for operations
- Marketing content generator
- Internal newsletter generator
- Lead research support
- Production assistant
- Documentation assistant
- Agentic workflows for repetitive admin tasks

Rules:
- AI features must not require sending unnecessary sensitive tenant data to external providers.
- AI-generated actions should be reviewable before execution.
- Do not implement autonomous high-risk workflows too early.

## 8. Known Architecture Gaps

- No confirmed database design.
- No confirmed auth system.
- No confirmed deployment target.
- No confirmed i18n library.
- No confirmed API design.
- No confirmed module boundaries.
- No confirmed testing strategy.
- No confirmed AI provider.
- No confirmed data import/export strategy.
- No confirmed file storage strategy.

## 9. Recommended Next Architecture Decisions

High priority:
1. Choose framework structure.
2. Choose database and ORM.
3. Define tenant model.
4. Define auth provider.
5. Define i18n approach.
6. Define MVP module boundaries.
7. Define initial schema.
8. Define deployment target.

Recommended default architecture:
- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma or Drizzle
- Auth provider with organization/tenant support
- Structured i18n using locale dictionaries

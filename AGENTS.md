# AGENTS.md

## 1. Project Summary

Project name: ForgeOS  
Repository name: Assumption: `forge-os`  
Current stage: prototype / early MVP planning  
Primary development target: multi-tenant SaaS web app

ForgeOS is an Industrial Operating System for manufacturing companies. It combines ERP, WMS, CRM, CMMS, production planning, marketing tooling, website management, BI, and AI copilot functionality into one web-based platform.

The first deployment target is JH Gomes, a small Portuguese manufacturing and cup-printing business.

## 2. Product Goal

Build a production-grade, multi-tenant SaaS platform for small and medium manufacturing companies, starting with practical operational tools for JH Gomes.

Initial focus:
- Production management
- Warehouse/inventory management
- Customer/order management
- Cup printing job setup sheets
- Internal operational documentation
- Basic marketing/content tooling
- AI-assisted workflows

## 3. Current Priority

Current priority: define and build the ForgeOS MVP for JH Gomes.

Immediate technical priority:
1. Establish clean repo structure.
2. Implement multilingual web app foundation.
3. Define core data model.
4. Build first operational modules for JH Gomes:
   - Customers
   - Products
   - Orders/jobs
   - Production sheets
   - Inventory items
   - Machine setup documentation

## 4. Tech Stack

Known / preferred:
- Frontend: Next.js or React
- Styling: Tailwind CSS
- Language: TypeScript preferred
- Backend language: English naming conventions
- Frontend localization: Portuguese and English initially
- Future localization: Spanish

Not yet defined:
- Database
- ORM
- Authentication provider
- Hosting provider
- Backend framework if not using Next.js full-stack
- AI provider
- Queue/background job system
- File storage

## 5. Development Rules

- Keep code modular and readable.
- Use TypeScript where possible.
- Prefer explicit types over implicit `any`.
- Use English for all code, database fields, API routes, internal naming, and comments.
- User-facing UI text must support localization.
- Do not hardcode Portuguese text directly in components unless localization is not yet implemented and the text is clearly marked for migration.
- Keep business logic separate from presentation components.
- Avoid premature complexity.
- Prefer simple, maintainable architecture over over-engineered abstractions.
- Do not add external dependencies without a clear reason.

## 6. Architecture Rules

- Design from day one as multi-tenant SaaS.
- Every business record that belongs to a company should be tenant-scoped.
- Do not assume ForgeOS is only for JH Gomes.
- JH Gomes is the first tenant and reference implementation.
- Keep tenant-specific configuration separate from generic platform logic.
- Avoid hardcoding JH Gomes-specific workflows into global modules.
- Use domain modules where practical:
  - CRM
  - Orders
  - Production
  - Inventory
  - Machines
  - Maintenance
  - Marketing
  - Website/CMS
  - AI Copilot

## 7. Security Rules

- Never commit API keys, tokens, passwords, credentials, or private customer data.
- Use environment variables for secrets.
- Add `.env.example` with placeholder values only.
- All tenant data must be isolated by tenant/company.
- Authorization must enforce tenant boundaries.
- Do not expose internal IDs unnecessarily in user-facing UI.
- Log operational events carefully; avoid logging sensitive customer data.
- Any AI feature must avoid sending unnecessary private business data to external providers.

## 8. Localization / Language Rules

- Backend, database, API, code, and internal architecture should always be in English.
- Frontend must support:
  - Portuguese Portugal: `pt-PT`
  - English: `en`
- Future language:
  - Spanish: `es`
- JH Gomes deployment should default to European Portuguese.
- Avoid Brazilian Portuguese phrasing for the Portuguese UI.
- Store translations in a structured i18n system.
- Do not duplicate components just to support different languages.

## 9. Testing / Build Rules

Not yet defined.

Recommended default:
- Add linting.
- Add type checking.
- Add basic unit tests for business logic.
- Add integration tests for critical flows once backend exists.
- Ensure `npm run build` or equivalent passes before completing tasks.
- Add seed/demo data for local development.

## 10. Files the Agent Should Read Before Changing Code

Read these first:
- `AGENTS.md`
- `docs/ai-context/00-project-brief.md`
- `docs/ai-context/01-product-vision.md`
- `docs/ai-context/02-current-architecture.md`
- `docs/ai-context/03-domain-knowledge.md`
- `docs/ai-context/04-decisions-log.md`
- `docs/ai-context/05-roadmap.md`
- `docs/ai-context/06-data-model-draft.md`
- `docs/ai-context/07-ui-ux-direction.md`
- `docs/ai-context/08-open-questions.md`
- `docs/ai-context/09-codex-startup-prompt.md`
- `docs/ai-context/10-cleanup-checklist.md`

Then inspect actual repository files:
- `package.json`
- framework config files
- app/router structure
- database schema/migrations
- existing components
- existing API routes
- existing environment templates
- README

## 11. Definition of Done for Agent Tasks

A task is done only when:
- The implementation matches the documented product direction.
- Tenant isolation is preserved or explicitly not applicable.
- UI strings are localization-ready.
- Code uses English internal naming.
- Type checking passes.
- Build passes.
- New logic has tests where practical.
- Existing behavior is not broken.
- Documentation is updated if the implementation changes project assumptions.
- No secrets or private data are committed.

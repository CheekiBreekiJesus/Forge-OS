# 05 Roadmap

## 1. Immediate Next Tasks

1. Create clean repository structure.
2. Add this AI context documentation.
3. Choose and confirm tech stack.
4. Set up TypeScript web app.
5. Add Tailwind CSS.
6. Add i18n foundation for `pt-PT` and `en`.
7. Define database and ORM.
8. Define multi-tenant schema.
9. Build basic dashboard shell.
10. Build first CRUD modules:
   - Tenants
   - Users
   - Customers
   - Products
   - Orders
   - Production jobs

## 2. MVP Scope

Recommended MVP:
- Authentication
- Tenant/company model
- Dashboard
- Customers
- Products
- Orders
- Production jobs
- Technical production sheets
- Inventory basics
- Machine records
- Basic Portuguese/English UI
- Simple role-based access
- Basic export/print of production sheets

JH Gomes-specific MVP:
- Cup sizes: 250 ml, 330 ml, 500 ml
- Cup printing production sheet
- Production speed estimates per cup size
- Setup notes
- Reject tracking
- Operator notes

## 3. Post-MVP Scope

- Maintenance management
- Spare parts tracking
- Supplier management
- Advanced warehouse management
- Barcode scanning
- UPS/shipping quote integration
- Marketing content tools
- Website/CMS management
- Internal newsletter generator
- AI copilot
- Analytics/BI
- Competitor price scraper
- Import/export tools

## 4. Future / Advanced Features

- AI agents for admin workflows
- Marketing automation
- SEO automation
- Email campaign integration
- Social media content scheduling
- Advanced production scheduling
- Machine data collection
- IoT/machine telemetry
- Predictive maintenance
- Multi-site tenants
- Spanish localization
- Industry-specific templates
- Mobile/tablet shop-floor interface

## 5. Suggested Implementation Order

Phase 1: Foundation
1. Repo setup
2. App shell
3. i18n
4. Auth
5. Tenant model
6. Database schema

Phase 2: Core business data
1. Customers
2. Products
3. Orders
4. Production jobs
5. Technical sheets

Phase 3: JH Gomes practical workflow
1. Cup product templates
2. Cup production sheets
3. Setup checklists
4. Production run tracking
5. Print/export production sheet

Phase 4: Operations expansion
1. Inventory
2. Machines
3. Maintenance
4. Spare parts
5. Basic analytics

Phase 5: AI and marketing
1. AI assistant for documentation
2. Marketing content generator
3. Newsletter generator
4. Website/CMS support
5. External integrations

## 6. What Codex Should Avoid Doing Too Early

Avoid:
- Complex enterprise ERP accounting
- Autonomous AI actions without review
- Hardcoded JH Gomes-only architecture
- Large microservice architecture
- Complex permission engine before roles are defined
- Premature machine telemetry
- Premature native mobile app
- Overly complex production scheduling
- Unvalidated third-party integrations
- Adding many dependencies before MVP shape is clear

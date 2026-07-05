<div align="center">

# ⚙️ ForgeOS

### One Operating System for the Modern Factory

**A modular, AI-ready industrial operating system for manufacturing SMEs.**

ForgeOS brings production, inventory, maintenance, CRM, quotations, documentation, automation, analytics, and AI-assisted operations into one connected platform.

<br />

![Status](https://img.shields.io/badge/status-early%20MVP-f59e0b?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-dual%20persistence-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/license-not%20yet%20published-lightgrey?style=for-the-badge)

<br />

[Vision](#-vision) · [Current Demo](#-current-demo) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [Roadmap](#-roadmap)

</div>

---

## 🏭 Vision

Manufacturing companies often operate across disconnected spreadsheets, WhatsApp conversations, emails, paper documents, legacy ERP systems, maintenance tools, and manually maintained reports.

ForgeOS is being designed to replace that fragmentation with a single modular platform that can support the complete operational lifecycle:

```text
Lead → Quotation → Customer Approval → Production Planning
     → Manufacturing → Quality Control → Inventory → Delivery
     → Maintenance → Reporting → Continuous Improvement
```

The first deployment target is **JH Gomes**, while the platform is being designed from the beginning as a reusable, tenant-aware SaaS product for other industrial companies.

### Target industries

- Plastic injection
- Mold manufacturing
- CNC machining
- Packaging
- Industrial automation
- Metalworking
- Industrial assembly
- Other small and medium manufacturing operations

---

## 🎯 Product principles

ForgeOS follows a small set of durable design principles:

- 📱 **Mobile-first on the shop floor**
- 🖥️ **Desktop-optimized for management**
- 🧩 **Modular by design**
- 🏢 **Multi-tenant and tenant-aware**
- 🤖 **AI-ready workflows**
- 🔌 **Open integration boundaries**
- 📦 **Offline-capable warehouse direction**
- 🔐 **Role-based access and tenant isolation**
- 🧾 **Auditable operational actions**
- ⚡ **Fast, practical, low-friction user experience**
- 🌍 **Localized for European manufacturing teams**

---

## 🚧 Current status

ForgeOS is currently an **early MVP and operational prototype**.

The application is suitable for demonstration, product discovery, workflow validation, and architecture development. It is **not yet ready for production use**.

### Implemented foundation

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS
- Localized routes for `pt-PT` and `en` with structured translation dictionaries
- Light and dark theme system and industrial management dashboard
- **Dual persistence:** IndexedDB (Dexie) local mode + Supabase/PostgreSQL outreach slice
- Tenant-aware domain model with `tenant_jh_gomes` reference tenant
- **Outreach (leadops):** lead import, campaigns, draft generation, review/approve, simulation send
- Send-job API routes, Brevo webhook boundary, unsubscribe flow
- Product, quotation, inventory, production, and demo workflow modules
- Supabase migrations (10+ files) and SQL integration tests
- AI provider gateway (deterministic default; optional Abacus/OpenAI/etc.)
- Agent maintenance and health-check orchestration
- **Vitest** (276+ unit tests) and **Playwright** e2e/acceptance configs

### Not yet production-ready

- Production OAuth login and full tenant membership enforcement (on integration branches)
- Applied Supabase migrations and RLS validation in a live project
- Browser UI fully on Supabase reads (server send path only today)
- Live Brevo campaign batch delivery (test-send foundation exists)
- Supabase Storage artwork uploads
- n8n production automations
- Production monitoring and alerting
- Printable production and quotation PDFs

See `docs/CURRENT_STATE.md` for base vs unmerged branch detail.

---

## ✨ Current demo

The current JH Gomes demo validates a connected path from commercial activity into factory operations.

### Demo workflow

```text
Create lead
  ↓
Convert lead into customer and opportunity
  ↓
Create a personalized cup quotation
  ↓
Attach artwork placeholder
  ↓
Approve quotation
  ↓
Create production order
  ↓
Generate job card
  ↓
Assign compatible machine
  ↓
Update artwork and screen-preparation status
  ↓
Log production progress
  ↓
Reserve inventory
```

### Local demo entry points

| Area | Route |
|---|---|
| Login shell | `http://localhost:3000/pt-PT/login` |
| Main dashboard | `http://localhost:3000/pt-PT` |
| Interactive operational demo | `http://localhost:3000/pt-PT/demo` |
| Product catalog | `http://localhost:3000/pt-PT/products` |
| English interface | `http://localhost:3000/en` |
| Automation fixture API | `http://localhost:3000/api/demo/automation?locale=pt-PT` |
| Copilot fixture API | `http://localhost:3000/api/demo/copilot?action=summarize-dashboard` |
| Operational fixture API | `http://localhost:3000/api/demo/operational` |

The root route redirects to Portuguese (`pt-PT`).

---

## 🧱 Planned product modules

### Phase 1 — Commercial and operational core

- Dashboard
- CRM
- Customers
- Quotations
- Inventory
- Production orders
- Outreach / Contactos Comerciais email workflow
- AI Copilot
- Internal newsletter

### Phase 2 — Factory control

- Preventive and corrective maintenance
- Machine tracking
- Mold management
- Quality management
- Downtime logging
- OEE foundations

### Phase 3 — Growth platform

- Website builder
- CMS
- SEO workflows
- Social-media automation
- Email marketing
- Campaign management

### Phase 4 — Intelligence and ecosystem

- Predictive maintenance
- AI-assisted production scheduling
- Analytics engine
- SaaS marketplace
- Industry-specific extensions

---

## 🧠 Outreach direction

Outreach, shown in Portuguese as Contactos Comerciais, is the commercial outreach module for turning standardized lead databases into controlled, personalized campaigns. The internal feature and route name remain `leadops` for compatibility.

The intended workflow is:

```text
Import leads
  → validate and classify
  → enrich company context
  → recommend relevant products
  → generate concise PT-PT outreach
  → review and approve
  → assign campaign and sequence
  → queue through an email provider
  → track replies, bounces, and outcomes
```

The architecture is designed to support provider abstractions for:

- OpenAI and other AI-generation providers
- Deterministic demo generation
- Smartlead email delivery
- Mock provider simulation
- Future n8n orchestration

Deterministic generation and simulation delivery work without credentials. OpenAI and Smartlead boundaries are server-side and remain optional for configured environments.

---

## 🏗️ Architecture

### Application stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Database direction | PostgreSQL through Supabase |
| Authentication direction | Supabase Auth |
| File storage direction | Supabase Storage |
| Automation direction | n8n |
| AI direction | Provider-based AI services |
| Testing | Vitest, Playwright (e2e + acceptance) |
| Deployment direction | Vercel |
| Monitoring direction | Sentry |

### Architectural boundaries

ForgeOS is being developed around clear service boundaries rather than provider-specific UI logic.

Examples include:

- repositories for persistence
- domain services for business rules
- provider abstractions for AI and email delivery
- tenant-aware queries
- audit-event recording
- localized presentation layers
- deterministic fixtures for safe demos

### Repository structure

```text
Forge-OS/
├── agent/                     # Agent and canary policies
├── docs/                      # Architecture and engineering context
├── qa/                        # QA schemas and trackable reports
├── scripts/
│   └── agent-orchestrator/    # Maintenance, health, privacy, and Codex tooling
├── src/
│   ├── app/                   # Next.js routes and demo APIs
│   ├── components/            # Shared application components
│   ├── demo/                  # Operational demo domain and fixtures
│   └── i18n/                  # Locale dictionaries and translation support
├── supabase/
│   ├── migrations/            # PostgreSQL schema drafts
│   └── seed.sql               # Demo seed data
├── AGENTS.md                  # Repository agent instructions
└── package.json               # Commands and dependencies
```

As ForgeOS grows, feature modules are expected to move toward isolated boundaries such as:

```text
src/features/<module>/
├── domain/
├── application/
├── infrastructure/
├── ui/
└── tests/
```

---

## 🗃️ Data and persistence direction

The repository currently includes Supabase migrations for the demo and operational foundation.

### Core entities

- tenants
- users and roles
- customers and contacts
- leads and opportunities
- products and product types
- quotations and quotation versions
- machines and machine capabilities
- production orders and job cards
- inventory and stock movements
- suppliers, warehouses, and locations
- labels and packaging requirements
- quality templates and records
- document and import templates
- audit and automation events

### Existing migrations

- `supabase/migrations/202606150001_demo_mvp_schema.sql`
- `supabase/migrations/202606260001_operational_foundation.sql`
- `supabase/seed.sql`

**Local mode** (default) stores outreach data in IndexedDB with full CRUD. **Supabase mode** routes server-owned send operations through PostgreSQL. Migrations exist but must be applied to a Supabase project; OAuth, membership enforcement, and RLS production validation are in progress on separate branches.

---

## 🚀 Getting started

### Requirements

- Node.js 20 or newer recommended
- npm
- Git

### Installation

```bash
git clone https://github.com/CheekiBreekiJesus/Forge-OS.git
cd Forge-OS
npm install
```

### Environment configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

On PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Local development works without live Supabase, AI, or Brevo credentials. Copy `.env.test.example` values for Playwright acceptance runs.

Never commit `.env`, `.env.local`, API keys, service-role credentials, customer data, or private operational records.

### Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000/pt-PT
```

---

## 🧪 Quality and verification

Run the complete application verification suite:

```bash
npm run lint
npm run typecheck
npm test
npm run build
# or combined:
npm run validate
```

Playwright (requires browser install):

```bash
npm run test:e2e
npm run test:acceptance
```

### Agent maintenance commands

```bash
npm run agent:health
npm run agent:maintain
npm run agent:test
npm run agent:canary
```

| Command | Purpose |
|---|---|
| `agent:health` | Evaluates repository and application health |
| `agent:maintain` | Runs the controlled maintenance workflow |
| `agent:test` | Runs orchestrator tests |
| `agent:canary` | Tests scoped Codex-agent availability and safety |

The canary may report `executable_missing` when the Codex CLI is not available to the subprocess environment. This is a known development-environment limitation rather than an application failure.

---

## 🤖 Development with AI agents

ForgeOS uses narrow, reviewable agent tasks rather than uncontrolled repository-wide generation.

Every agent task should:

1. Inspect the branch, commit, status, and relevant files.
2. Preserve pre-existing work.
3. Define allowed files and directories.
4. Avoid unrelated dependency or formatting changes.
5. Add focused tests.
6. Run lint, typecheck, tests, and build where relevant.
7. Report exact files changed and validation results.
8. Avoid commits unless explicitly requested.

Repository-specific instructions are defined in:

- `AGENTS.md`
- `.cursor/rules/`
- `agent/maintenance-policy.json`
- `agent/canary-policy.json`
- `docs/engineering/agent-privacy-policy.md`

---

## 🔐 Security, privacy, and public-repository notice

This repository is currently public to simplify demonstration, collaboration, and review during early development.

Do not commit:

- production credentials
- customer or lead databases
- personal contact information
- supplier pricing
- private quotations
- service-role keys
- API tokens
- private manufacturing data
- confidential JH Gomes records
- generated local agent logs containing sensitive content

All demo records must be fictional, anonymized, or explicitly safe for public use.

Before production deployment, ForgeOS will require a complete review of:

- tenant isolation
- Supabase RLS policies
- authentication and authorization
- secrets management
- audit retention
- GDPR obligations
- backups and disaster recovery
- external-provider data handling

The repository may become private as the project moves from public prototype work into production integration.

---

## 🗺️ Roadmap

### Near term

- Merge auth activation (OAuth + tenant membership)
- Complete Cursor feature convergence (table UI, xlsx security, Playwright fixes, Cup Customizer)
- Apply Supabase migrations and validate RLS in hosted project
- Wire browser UI to Supabase reads in supabase persistence mode
- Brevo live campaign delivery (gated by configuration)
- Cup Customizer quotation preview for JH Gomes
- Secure spreadsheet import adoption across branches

### Medium term

- Connect Smartlead and n8n through provider abstractions
- Implement production documentation workflows
- Add inventory scanning and traceability
- Add machine, mold, and maintenance workspaces
- Add quotation PDF generation
- Add audit-log interfaces

### Long term

- Production scheduling optimization
- OEE and downtime analytics
- Predictive maintenance
- AI-assisted operational decisions
- Multi-company SaaS administration
- Industry-specific module marketplace

---

## 🌍 Localization

Supported MVP locales:

- 🇵🇹 `pt-PT` — European Portuguese
- 🇬🇧 `en` — English

Internal code, routes, database fields, types, and API names remain in English. User-facing content should be provided through locale dictionaries.

Spanish and additional European languages may be added later.

---

## 🤝 Contributing and collaboration

ForgeOS is currently under active product development rather than open community governance.

For any proposed change:

- keep the scope small;
- preserve tenant awareness;
- avoid hardcoding JH Gomes-specific behavior into shared modules;
- add or update tests;
- document architectural decisions;
- never include private business data;
- validate both Portuguese and English user-facing content.

---

## 📄 License

No public open-source license has been published yet.

Until a license is added, the source code remains protected by default copyright rules. Public visibility does not automatically grant permission to copy, redistribute, sublicense, or commercially reuse the project.

---

## 🧭 Project direction

ForgeOS is being built to become a practical operating layer for modern manufacturing companies—not another disconnected dashboard.

The long-term goal is to create a platform that helps factories improve:

- throughput;
- setup time;
- scrap and quality;
- inventory accuracy;
- maintenance response;
- quoting speed;
- operational visibility;
- customer follow-up;
- documentation quality;
- management decision-making.

<div align="center">

### ⚙️ ForgeOS

**One Operating System for the Modern Factory**

Built first for real factory operations. Designed to scale into a multi-tenant industrial platform.

</div>

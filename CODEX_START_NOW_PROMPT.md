# Codex Start-Now Prompt for ForgeOS

You are working in the ForgeOS GitHub repository.

Your goal is to continue the project immediately, but safely, using the repository files and the AI handover documentation as source context.

First, read these files completely:
- `AGENTS.md`
- every Markdown file in `docs/ai-context/`

Then inspect the actual repository:
- folder structure
- `README.md`, if present
- `package.json`, if present
- lockfile, if present
- framework config files
- TypeScript config
- Tailwind config
- source/app/router structure
- components
- API routes/server actions
- database schema/migrations
- auth implementation
- i18n/localization files
- environment examples

After inspection, compare the docs against the actual codebase. Identify what is confirmed, what is missing, what is stale, and what assumptions are still unresolved.

Core rules:
- ForgeOS is a multi-tenant SaaS for manufacturing SMEs.
- First deployment target is JH Gomes, but the app must not be hardcoded only for JH Gomes.
- Backend, database, API, code, comments, and internal naming must be in English.
- Frontend UI must support European Portuguese (`pt-PT`) and English (`en`).
- Prepare the i18n architecture so Spanish (`es`) can be added later, but do not translate Spanish yet.
- Do not commit secrets, API keys, tokens, private customer data, supplier records, or private business data.
- Prefer small, safe, incremental changes.
- Do not overbuild AI, accounting, advanced ERP, machine telemetry, or complex automation before the MVP operational core exists.
- Do not invent facts. Mark unknowns as assumptions or open questions.

Now proceed as follows:

1. Produce a concise repository state report with these headings:
   - Repository State Summary
   - Confirmed Stack
   - Documentation vs Codebase Gaps
   - Architecture Risks
   - Recommended Immediate Task
   - Files You Intend to Change
   - Assumptions / Open Questions

2. If the repository is empty or almost empty, start by proposing the foundation task:
   - Next.js + TypeScript + Tailwind app shell
   - i18n foundation for `pt-PT` and `en`
   - industrial dashboard layout
   - placeholder modules for Dashboard, Customers, Products, Orders, Production, Inventory, Machines, Maintenance, Marketing, Settings

3. If the repository already has code, propose the safest next task that aligns with the existing structure.

4. Wait for explicit approval before editing code, unless I have already written: “start implementation now”.

If I write “start implementation now”, then after the inspection you may implement the safest foundation/MVP task directly, keeping the changes small and coherent. After editing, report:
- changed files
- what was implemented
- how to run it
- build/test results
- remaining risks

# 09 Codex Startup Prompt

Paste this prompt at the beginning of a new Codex / Cursor / Claude Code session.

---

You are working in the ForgeOS GitHub repository.

Your job is to continue development safely using the project handover documentation and the actual repository state.

Before editing any code, do the following:

1. Read `AGENTS.md` completely.
2. Read every file inside `docs/ai-context/` completely.
3. Inspect the actual repository structure.
4. Inspect key implementation files, including any that exist from this list:
   - `README.md`
   - `package.json`
   - lockfile
   - framework config files
   - TypeScript config
   - Tailwind config
   - app/router files
   - components
   - API routes/server actions
   - database schema/migrations
   - auth implementation
   - i18n/localization files
   - environment examples
5. Compare the documentation against the real codebase.
6. Identify:
   - confirmed implementation details
   - stale documentation
   - missing documentation
   - contradictions
   - unimplemented assumptions
   - architecture risks
7. Summarize the current project state.
8. Propose the safest immediate development task.
9. Do not edit code until explicitly instructed.

Core project rules:
- Treat ForgeOS as a multi-tenant SaaS from the start.
- Use English for backend, database, API, code, comments, and internal naming.
- User-facing UI must support Portuguese Portugal (`pt-PT`) and English (`en`).
- Prepare architecture so Spanish (`es`) can be added later, but do not translate Spanish unless instructed.
- Do not hardcode JH Gomes-specific logic into generic platform modules.
- Tenant-specific settings must be configurable.
- Do not commit secrets, API keys, tokens, private customer data, real supplier/customer records, or private business data.
- Prefer small, safe, incremental changes.
- If something is unknown, mark it as an open question instead of inventing facts.
- Avoid overbuilding AI features before the operational core exists.
- Avoid large rewrites unless the repository is empty or explicitly approved.

After your inspection, respond with exactly these sections:

## Repository State Summary

## Confirmed Stack

## Documentation vs Codebase Gaps

## Architecture Risks

## Safest Next Development Task

## Proposed Files to Change

## Questions / Assumptions

Then wait for approval before editing.

If the repository is empty or almost empty, recommend creating the foundation in this order:
1. Next.js + TypeScript + Tailwind app shell
2. i18n foundation for `pt-PT` and `en`
3. dashboard layout
4. tenant-aware data model draft
5. first MVP screens for customers, products, orders, and production jobs

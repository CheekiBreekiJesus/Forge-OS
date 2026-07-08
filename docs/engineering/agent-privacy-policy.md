# Agent Privacy Policy

Guidance for AI agents (Codex, Cursor, and others) working on ForgeOS.

## Scope

Applies to all repository work, local QA, screenshots, logs, prompts, and generated reports.

## Rules

1. **No real customer data in Git** — commits must not include live CRM exports, invoices, contacts, pricing sheets, artwork, or internal documents.
2. **Synthetic fixtures only** — demo and test data must be fictional and customer-neutral unless stored in gitignored local paths.
3. **Secrets stay local** — never commit `.env`, `.env.local`, API keys, or Supabase service-role keys. Use `.env.example` placeholders only.
4. **Redact in reports** — QA findings, task briefs, and chat must not reproduce credentials, personal emails, phone numbers, or business-specific identifiers from local files.
5. **Screenshots** — crop or blur any accidental exposure of private UI data before sharing outside the machine.
6. **Logs** — avoid logging full request bodies, auth tokens, or customer PII from local runs.

## Local-only paths

Customer-specific data preparation inputs and outputs belong under ignored directories documented in `.gitignore` (e.g. `scripts/data-preparation/local/`).

## Tenant neutrality

ForgeOS core modules must not embed JH Gomes-specific business rules. Tenant configuration belongs in tenant-scoped settings, not global code.

## Escalation

If unsure whether data is sensitive, treat it as private and keep it out of Git and agent prompts.

## Maintenance orchestrator reports

The agent maintenance workflow writes sanitized reports under `qa/reports/`.

Rules for generated reports:

1. Never include absolute user profile paths, npm cache paths, or machine-specific home directories.
2. Redact secrets, tokens, API keys, authorization headers, and database connection strings.
3. Use repository-relative paths only.
4. Do not copy customer exports, tenant records, or local-only preparation outputs into health reports or Codex task briefs.
5. Generated `latest-health.json` and `next-codex-task.md` are local artifacts and are gitignored by default.

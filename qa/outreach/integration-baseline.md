# Email Outreach MVP Integration — Baseline

**Worktree:** `Forge-OS-outreach-integration`  
**Integration branch:** `feat/email-outreach-mvp-integration`  
**Recorded:** 2026-07-03

## Source A — Send-job / provider foundation (current HEAD)

| Field | Value |
| --- | --- |
| Branch | `origin/feat/email-outreach-send-jobs` (lineage) |
| Starting commit | `fb82211` — feat(outreach): add trusted send-job server mutations |
| Validation (pre-merge) | Clean working tree on integration branch |

**Scope:** Brevo provider foundation, durable unsubscribe, provider webhooks, Supabase suppression/events, local simulation send jobs, durable Supabase send-job store, locks/daily usage, trusted actor abstraction, authorization, queue/process/pause/resume/cancel/retry/status routes, Brevo campaign batches disabled.

## Source B — LeadOps import / operator hardening (to merge)

| Field | Value |
| --- | --- |
| Branch | `origin/feat/outreach-import-ops-hardening` |
| Head commit | `60fa927` — docs(outreach): record private import acceptance |
| Remote contains | Yes (`git branch -r --contains 60fa927`) |

**Scope:** Hardened CSV/XLSX import, worksheet selection, reusable mapping profiles, normalization, duplicate review, import history, lead filters, sendability evaluation, real workbook sheet-switch fix, private acceptance runner.

## Expected conflict areas

| Area | Risk | Resolution strategy |
| --- | --- | --- |
| `src/persistence/db.ts` | **High** | Keep sequential Dexie versions; union all stores (import + send-job) |
| `src/persistence/interfaces.ts` | **High** | Merge repository interfaces from both branches |
| `src/persistence/indexeddb/repositories.ts` | **High** | Wire both import mapping profiles and send-job repos |
| `src/features/backup/service.ts` | **High** | Backup vN includes import batches, mapping profiles, send jobs |
| `src/features/backup/restore-validation.ts` | Medium | Validate both entity sets |
| `src/components/leadops-campaign-detail-shell.tsx` | **High** | Keep simulation send controls + import-agnostic campaign UI |
| `src/components/leadops-import-wizard.tsx` | Medium | Take import-ops hardening; no send-job removal |
| `src/i18n/locales/*.ts` | **High** | Union all PT/EN keys |
| `package.json` / lock | Medium | Union dependencies (xlsx etc.) |
| `docs/checkpoints/email-outreach-status.md` | Medium | Merge status from both milestones |
| E2E specs | Medium | Keep both campaign-release and send-job simulation tests |

## Critical merge rule

The diff `fb82211..60fa927` shows import-ops branch **removed** send-job files (routes, services, types, migrations). Merge must **restore and preserve** send-job foundation from HEAD while **adding** import-ops enhancements — never accept deletions of send-job architecture.

## Privacy / credentials

- No private lead files tracked
- No `.env` or credentials in working tree
- Private acceptance scripts output gitignored aggregates only

## Pre-merge validation status

| Check | Result |
| --- | --- |
| Correct worktree | Yes |
| Correct branch | Yes |
| Clean working tree | Yes |
| `fb82211` on remote | Yes (`origin/feat/email-outreach-send-jobs`) |
| `60fa927` on remote | Yes (`origin/feat/outreach-import-ops-hardening`) |

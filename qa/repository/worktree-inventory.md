# ForgeOS Worktree Inventory

**Audit date:** 2026-07-05  
**Auditor:** repository-hygiene agent (read-only)  
**Scope:** `C:\Users\J35U5\Desktop\VS Code\Forge-OS*`  
**Base reference:** `integration/jh-gomes-outreach-supabase-7d2` @ `213dc3e`

## Summary

| Metric | Count |
|--------|------:|
| ForgeOS directories found | 32 |
| Registered git worktrees | 32 |
| Clean worktrees | 24 |
| Dirty worktrees | 8 |
| Worktrees with shared stash | 32 (all share `stash@{0}`) |

## Worktree table

| Path | Branch | HEAD | Upstream | Ahead/Behind | Status | Stashes | Purpose | Agent owner |
|------|--------|------|----------|--------------|--------|---------|---------|-------------|
| `Forge-OS` | `release/jh-gomes-outreach-supabase` | `86d5bd2` | *(none)* | — | **DIRTY** | 1 | Release integration work; ahead of 7d2 base | Unknown / local edits |
| `Forge-OS-auth-activation` | `integration/jh-gomes-auth-activation` | `4b42cc7` | `origin/...` | 0/0 | clean | 1 | Auth activation integration | **ACTIVE_AGENT** |
| `Forge-OS-auth-membership` | `feat/supabase-auth-membership` | `ee821f9` | `origin/...` | 0/0 | clean | 1 | Supabase membership enforcement | **ACTIVE_AGENT** |
| `Forge-OS-codex` | `agent/codex-next-task` | `bd33f90` | *(none)* | — | clean | 1 | Abandoned agent task (customizer) | Abandoned |
| `Forge-OS-cup-customizer-integration` | `feat/cup-customizer-integration-ui` | `db8a19a` | `origin/...` | 0/0 | **DIRTY** (`next-env.d.ts`) | 1 | Cup Customizer UI integration | **ACTIVE_AGENT** |
| `Forge-OS-cup-customizer-preview-ux` | `fix/cup-customizer-preview-layout` | `1529a9d` | `origin/...` | 0/0 | **DIRTY** (`next-env.d.ts`) | 1 | Preview layout fix (merged into feature branch) | Superseded local |
| `Forge-OS-cursor` | `agent/cursor-ui-review` | `bd33f90` | *(none)* | — | clean | 1 | Abandoned agent UI review | Abandoned |
| `Forge-OS-cursor-dependency-convergence` | `integration/dependency-security-cursor` | `bd3f477` | `origin/...` | 0/0 | clean | 1 | Dependency + security convergence | **ACTIVE_AGENT** |
| `Forge-OS-cursor-feature-convergence` | `integration/jh-gomes-feature-convergence-cursor` | `601b5b5` | `origin/...` | 0/0 | clean | 1 | Feature convergence (table, xlsx, playwright, cup) | **ACTIVE_AGENT** |
| `Forge-OS-cursor-final-convergence` | `integration/jh-gomes-cursor-convergence` | `64a1ebd` | `origin/...` | 0/0 | clean | 1 | Final cursor convergence + auth overlap docs | **ACTIVE_AGENT** |
| `Forge-OS-dependency-audit` | `chore/dependency-audit-triage` | `24c7f3d` | `origin/...` | 0/0 | clean | 1 | Dependency audit triage docs | Historical |
| `Forge-OS-dependency-integration` | `integration/dependency-security-remediation` | `a4610df` | `origin/...` | 0/0 | clean | 1 | Dependency remediation integration | READY_FOR_INTEGRATION |
| `Forge-OS-inventory` | `feat/inventory-product-foundation` | `f02471c` | `origin/...` | 0/0 | **DIRTY** (7 modified, 2 untracked) | 1 | Inventory/product foundation | **ACTIVE_AGENT** |
| `Forge-OS-jh-gomes-mail` | `feat/jh-gomes-mail-connector` | `0a60750` | `origin/...` | 0/0 | clean | 1 | JH Gomes mailbox connector | Historical / parked |
| `Forge-OS-local-runtime` | `feat/customer-pc-local-runtime` | `dadd43c` | `origin/...` | 0/0 | clean | 1 | Customer PC local runtime | Historical |
| `Forge-OS-maintenance` | `maintenance/light-scan-20260704-1357` | `4ed280e` | `origin/...` | 0/0 | **DIRTY** (3 files) | 1 | Maintenance light scan | Abandoned local edits |
| `Forge-OS-marketing-studio` | `feat/marketing-studio-foundation` | `ecbb190` | `origin/...` | 0/0 | clean | 1 | Marketing studio foundation | Historical |
| `Forge-OS-oauth-foundation` | `feat/supabase-oauth-foundation` | `cf97561` | `origin/...` | 0/0 | clean | 1 | Supabase OAuth foundation | **ACTIVE_AGENT** |
| `Forge-OS-outlook-local` | `feat/outlook-local-send-mvp` | `8d146ff` | `origin/...` | 0/0 | clean | 1 | Outlook local send MVP | Historical |
| `Forge-OS-outreach` | `feat/email-outreach-live-mvp` | `b9c41f1` | `origin/...` | 0/0 | **DIRTY** (`next-env.d.ts`) | 1 | Early outreach live MVP | SUPERSEDED |
| `Forge-OS-outreach-integration` | `feat/email-outreach-mvp-integration` | `e6760f5` | `origin/...` | 0/0 | clean | 1 | Outreach MVP integration merge | INTEGRATED (into 7d2 path) |
| `Forge-OS-outreach-ops` | `feat/outreach-import-ops-hardening` | `60fa927` | `origin/...` | 0/0 | clean | 1 | Import ops hardening | INTEGRATED |
| `Forge-OS-outreach-provider` | `feat/email-outreach-provider` | `9cf9936` | `origin/...` | 0/0 | clean | 1 | Provider + unsubscribe foundation | INTEGRATED |
| `Forge-OS-playwright-remediation` | `fix/playwright-audit-remediation` | `5ef6630` | `origin/...` | 0/0 | clean | 1 | Playwright audit remediation | READY_FOR_INTEGRATION |
| `Forge-OS-product-import` | `feat/jhgomes-product-data-staging` | `314f6fb` | `origin/...` | 0/0 | clean | 1 | Product data staging import | **ACTIVE_AGENT** |
| `Forge-OS-repository-hygiene` | `chore/repository-hygiene` | `213dc3e` | `origin/integration/jh-gomes-outreach-supabase-7d2` | 0/0 | clean | 1 | This documentation hygiene branch | This task |
| `Forge-OS-send-jobs` | `feat/email-outreach-send-jobs` | `47af013` | `origin/...` | 0/0 | clean | 1 | Hosted send-job runtime | **ACTIVE_AGENT** |
| `Forge-OS-send-jobs-7d2` | `feat/email-outreach-send-jobs-7d2` | `ab5deaa` | `origin/...` | 0/0 | **DIRTY** (`next-env.d.ts`) | 1 | Step 7D2 send jobs (merged into 7d2 base) | SUPERSEDED local |
| `Forge-OS-spreadsheet-security-review` | `review/xlsx-security-remediation` | `73a897b` | `origin/fix/xlsx-security-remediation` | 0/0 | clean | 1 | Review mirror of xlsx fix | SAFE_TO_DELETE_LATER |
| `Forge-OS-supabase-7d2-integration` | `integration/jh-gomes-outreach-supabase-7d2` | `213dc3e` | *(none)* | — | **DIRTY** (`next-env.d.ts`) | 1 | Canonical integration base mirror | Base reference |
| `Forge-OS-table-ui` | `fix/table-density-and-action-overlays` | `7ac724d` | `origin/...` | 0/0 | clean | 1 | Table density + action overlays | **ACTIVE_AGENT** |
| `Forge-OS-xlsx-remediation` | `fix/xlsx-security-remediation` | `73a897b` | `origin/...` | 0/0 | clean | 1 | Spreadsheet security remediation | READY_FOR_INTEGRATION |

## Uncommitted work at risk

### High risk (application source)

| Worktree | Files | Risk |
|----------|-------|------|
| `Forge-OS` | `.github/workflows/ci.yml`, `docs/CURRENT_STATE.md`, `src/application/send-job-server-mutations.test.ts`, `src/features/email-delivery/send-job-actor-context.ts`, `src/features/leadops/providers.ts` | Uncommitted integration edits on release branch; may conflict with active agents |
| `Forge-OS-inventory` | 7 modified + 2 new persistence files | Active WIP; loss if worktree reset |
| `Forge-OS-maintenance` | `profile-lead-files.mjs`, `campaign-draft-service.ts`, `providers.ts` | Orphaned edits on maintenance branch |

### Low risk (generated / local config)

| Worktree | Files | Risk |
|----------|-------|------|
| `Forge-OS-cup-customizer-integration` | `next-env.d.ts` | Auto-generated by Next.js; safe to discard |
| `Forge-OS-cup-customizer-preview-ux` | `next-env.d.ts` | Same |
| `Forge-OS-outreach` | `next-env.d.ts` | Same |
| `Forge-OS-send-jobs-7d2` | `next-env.d.ts` | Same |
| `Forge-OS-supabase-7d2-integration` | `next-env.d.ts` | Same |
| `Forge-OS` | `.cursor/settings.json`, `FORGEOS_RECOVERY_AUDIT.md`, `scripts/data-preparation/fixtures/synthetic_products.csv` | Local IDE config + audit notes; review before commit |

## Automatic `next-env.d.ts` changes

Five worktrees show modified `next-env.d.ts`. This file is generated by Next.js when `npm run dev` or `npm run build` runs. It should be gitignored or normalized after convergence. Do not treat these as intentional feature work.

## `.cursor/settings.json`

Present as **untracked** in `Forge-OS` (primary worktree on `release/jh-gomes-outreach-supabase`). This is local IDE configuration. Recommend adding to `.gitignore` or documenting as personal-only; do not commit unless team agrees on shared Cursor settings.

## Generated QA output

Tracked under `qa/` (40 files). See `docs/engineering/qa-artifact-retention.md`. Local-only paths (gitignored): `qa/reports/latest-health.json`, `qa/acceptance/results/`, Playwright HTML reports.

## Private-data risks

| Location | Concern |
|----------|---------|
| `scripts/data-preparation/local/` | Should remain gitignored; customer lead workbooks |
| `qa/outreach/private-import-profile.md` | Documents private acceptance; verify no real PII in tracked content |
| `Forge-OS` untracked `synthetic_products.csv` | Verify synthetic-only before any commit |
| Shared stash `pre-inventory unrelated local changes` | Present in all 32 worktrees; inspect before drop |

## Abandoned / temporary worktrees

| Worktree | Recommendation |
|----------|----------------|
| `Forge-OS-codex` | `agent/codex-next-task` @ `bd33f90`, no upstream — archive after convergence |
| `Forge-OS-cursor` | `agent/cursor-ui-review` @ `bd33f90`, no upstream — archive after convergence |
| `Forge-OS-cup-customizer-preview-ux` | Fix merged into `feat/cup-customizer-integration-ui` — remove worktree after convergence |
| `Forge-OS-send-jobs-7d2` | Superseded by 7d2 integration base — remove after merge |
| `Forge-OS-spreadsheet-security-review` | Review mirror of `fix/xlsx-security-remediation` — remove after convergence |
| `Forge-OS-outreach` | Early MVP branch superseded by integration path — parked |
| `Forge-OS-maintenance` | Dirty orphaned edits — do not use for new work |

## Shared stash note

Every worktree reports:

```
stash@{0}: On codex/forgeos-foundation-app-shell: pre-inventory unrelated local changes
```

This is a repository-wide stash from an earlier branch. Inspect with `git stash show -p stash@{0}` before any cleanup. Do not drop without owner review.

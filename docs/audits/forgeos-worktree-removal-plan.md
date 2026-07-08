# ForgeOS Worktree Removal Plan — Phase B

**Generated:** 2026-07-08  
**Canonical repository:** `C:\Users\J35U5\Desktop\VS Code\Forge-OS`  
**Main HEAD after merge:** `626a348`  
**Merge commit:** `db8737e`  
**Archive checkpoint:** `archive/pre-main-merge-20260708` @ `8059973`

---

## Summary

| Metric | Before Phase B | After initial safe removal |
|--------|----------------|---------------------------|
| Registered worktrees | 35 | 30 |
| Removed (Phase B) | — | 5 |
| Retained intentionally | — | 30 (incl. canonical) |

---

## Removed in Phase B (verified safe)

| Path | Branch | HEAD | Reason |
|------|--------|------|--------|
| `Forge-OS-codex` | `agent/codex-next-task` | `bd33f90` | Clean; ancestor of `main`; stale agent sandbox |
| `Forge-OS-cursor` | `agent/cursor-ui-review` | `bd33f90` | Clean; ancestor of `main`; duplicate of codex |
| `Forge-OS-local-runtime` | `feat/customer-pc-local-runtime` | `dadd43c` | Clean; ancestor of `main`; deployment track integrated |
| `Forge-OS-outreach-ops` | `feat/outreach-import-ops-hardening` | `60fa927` | Clean; ancestor of `main`; superseded |
| `Forge-OS-outreach-provider` | `feat/email-outreach-provider` | `9cf9936` | Clean; ancestor of `main`; superseded |

Method: `git worktree remove "<path>"` (no `--force`).

---

## Retained worktrees (30)

### KEEP_CANONICAL

| Path | Branch | Notes |
|------|--------|-------|
| `Forge-OS` | `main` | Active product repository |

### KEEP_TEMPORARILY_DIRTY (mandated or generated-only dirt)

| Path | Branch | Dirty summary | Reason |
|------|--------|---------------|--------|
| `Forge-OS-inventory` | `feat/inventory-product-foundation` | 7 modified + 2 untracked | **Inventory WIP** — patch archived |
| `Forge-OS-maintenance` | `maintenance/light-scan-20260704-1357` | 3 modified leadops files | Maintenance scan edits |
| `Forge-OS-0.2.0-local-demo` | `release/forgeos-0.2.0-local-demo` | showcase SVG | Demo ancestry; 86 commits not in main |
| `Forge-OS-cup-customizer-integration` | `feat/cup-customizer-integration-ui` | `next-env.d.ts` | Superseded by release; dirty |
| `Forge-OS-cup-customizer-preview-ux` | `fix/cup-customizer-preview-layout` | `next-env.d.ts` | Superseded by release; dirty |
| `Forge-OS-inventory-mobile` | `feat/inventory-mobile-barcode-mvp` | `next-env.d.ts` | Experimental deferred |
| `Forge-OS-outreach` | `feat/email-outreach-live-mvp` | `next-env.d.ts` | Ancestor of main but dirty |
| `Forge-OS-release-candidate` | `integration/jh-gomes-release-candidate` | CI/README/playwright | PR #3 integration source |
| `Forge-OS-send-jobs-7d2` | `feat/email-outreach-send-jobs-7d2` | `next-env.d.ts` | 7D2 source; partially integrated |
| `Forge-OS-supabase-7d2-integration` | `integration/jh-gomes-outreach-supabase-7d2` | `next-env.d.ts`; `.env.local` | PR #3 target branch; env present |

### KEEP_RECOVERY_BACKUP (unique commits not in main)

| Path | Branch | Ahead of main | Phase B classification |
|------|--------|---------------|------------------------|
| `Forge-OS-auth-activation` | `integration/jh-gomes-auth-activation` | 11 | **SUPERSEDED** — integrated into release |
| `Forge-OS-auth-membership` | `feat/supabase-auth-membership` | 9 | **SUPERSEDED** — migrations reconciled |
| `Forge-OS-cursor-dependency-convergence` | `integration/dependency-security-cursor` | 13 | **EXPERIMENTAL** |
| `Forge-OS-cursor-feature-convergence` | `integration/jh-gomes-feature-convergence-cursor` | 41 | **EXPERIMENTAL** |
| `Forge-OS-cursor-final-convergence` | `integration/jh-gomes-cursor-convergence` | 49 | **EXPERIMENTAL** |
| `Forge-OS-dependency-audit` | `chore/dependency-audit-triage` | 9 | **PRESERVED ONLY** |
| `Forge-OS-dependency-integration` | `integration/dependency-security-remediation` | 18 | **INFRASTRUCTURE** — partial extract done |
| `Forge-OS-jh-gomes-mail` | `feat/jh-gomes-mail-connector` | 4 | **DEFERRED** |
| `Forge-OS-marketing-studio` | `feat/marketing-studio-foundation` | 2 | **DEFERRED** |
| `Forge-OS-oauth-foundation` | `feat/supabase-oauth-foundation` | 8 | **SUPERSEDED** |
| `Forge-OS-outlook-local` | `feat/outlook-local-send-mvp` | 13 | **DEFERRED** |
| `Forge-OS-outreach-integration` | `feat/email-outreach-mvp-integration` | 2 | **SUPERSEDED** |
| `Forge-OS-playwright-remediation` | `fix/playwright-audit-remediation` | 11 | **PRESERVED ONLY** (docs) |
| `Forge-OS-product-import` | `feat/jhgomes-product-data-staging` | 7 | **DEFERRED** |
| `Forge-OS-repository-hygiene` | `chore/repository-hygiene` | 11 | **PRESERVED ONLY** |
| `Forge-OS-send-jobs` | `feat/email-outreach-send-jobs` | 1 | **SUPERSEDED** |
| `Forge-OS-spreadsheet-security-review` | `review/xlsx-security-remediation` | 14 | **INFRASTRUCTURE** |
| `Forge-OS-table-ui` | `fix/table-density-and-action-overlays` | 7 | **DEFERRED** |
| `Forge-OS-xlsx-remediation` | `fix/xlsx-security-remediation` | 14 | **INFRASTRUCTURE** (duplicate HEAD with #32) |

---

## Next removal candidates (manual review required)

Do **not** remove until branch archived on remote and/or dirty trees cleaned:

1. Superseded integration worktrees after tagging: `auth-activation`, `oauth-foundation`, `send-jobs`, `outreach-integration`
2. Cup customizer worktrees after confirming `next-env.d.ts`-only dirt
3. PR #3 worktrees (`release-candidate`, `supabase-7d2-integration`) after env vars compared to canonical `.env.local`
4. Convergence experiment worktrees (`cursor-*-convergence`) — archive branches first

---

## Non-worktree folders (VS Code root)

| Folder | Classification |
|--------|----------------|
| `ForgeOS-Consolidation-Preservation-20260708` | **KEEP** — inventory WIP patch + manifests |
| `ForgeOS-7D2-Recovery-Backup` | **KEEP** — recovery backup |
| `.forgeos-agent-locks` | **KEEP** — coordination |

---

*End of removal plan.*

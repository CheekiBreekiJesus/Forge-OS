# ForgeOS Branch Inventory

**Audit date:** 2026-07-05  
**Base reference:** `integration/jh-gomes-outreach-supabase-7d2` @ `213dc3e`

## Classification legend

| Status | Meaning |
|--------|---------|
| `ACTIVE_AGENT` | Branch has an active agent worktree; do not delete |
| `READY_FOR_INTEGRATION` | Complete feature/fix; awaiting merge into convergence |
| `INTEGRATED` | Work absorbed into integration base or release path |
| `SUPERSEDED` | Replaced by a newer branch or integration line |
| `HISTORICAL_BACKUP` | Point-in-time backup; retain until release tagged |
| `UNKNOWN` | Needs owner decision |
| `SAFE_TO_DELETE_LATER` | May delete after convergence + release checkpoint |

**Deletion conditions (global):** No branch may be deleted until (1) its work is merged or explicitly abandoned in writing, (2) `integration/jh-gomes-cursor-convergence` or successor is merged to release, (3) a release checkpoint documents the final commit, and (4) no worktree references the branch.

---

## Required branches

| Branch | HEAD (local) | Remote | Classification | Notes | Delete when |
|--------|-------------|--------|----------------|-------|-------------|
| `integration/jh-gomes-outreach-supabase-7d2` | `213dc3e` | `origin/...` | **INTEGRATED** (current base) | Canonical outreach + Supabase slice | Never; becomes release tag anchor |
| `feat/supabase-oauth-foundation` | `cf97561` | yes | **ACTIVE_AGENT** | OAuth login foundation | After auth activation merge + 30-day retention |
| `feat/supabase-auth-membership` | `ee821f9` | yes | **ACTIVE_AGENT** | Tenant membership enforcement | After auth activation merge + 30-day retention |
| `integration/jh-gomes-auth-activation` | `4b42cc7` | yes | **ACTIVE_AGENT** | Combines OAuth + membership for activation | After merged to release + checkpoint |
| `feat/cup-customizer-integration-ui` | `db8a19a` | yes | **ACTIVE_AGENT** | Cup Customizer UI module | After feature convergence merge |
| `fix/cup-customizer-preview-layout` | `1529a9d` | yes | **INTEGRATED** | Merged into cup feature branch per docs | After feature convergence merge |
| `fix/table-density-and-action-overlays` | `7ac724d` | yes | **READY_FOR_INTEGRATION** | Table UI density fix | After cursor feature convergence |
| `fix/playwright-audit-remediation` | `5ef6630` | yes | **READY_FOR_INTEGRATION** | Playwright security/config fixes | After cursor feature convergence |
| `fix/xlsx-security-remediation` | `73a897b` | yes | **READY_FOR_INTEGRATION** | Spreadsheet parser hardening | After cursor feature convergence |
| `integration/dependency-security-cursor` | `bd3f477` | yes | **ACTIVE_AGENT** | Cursor dependency convergence | After merged to release |
| `integration/jh-gomes-feature-convergence-cursor` | `601b5b5` | yes | **ACTIVE_AGENT** | Feature convergence (table, xlsx, playwright, cup) | After merged to final convergence |
| `integration/jh-gomes-cursor-convergence` | `64a1ebd` | yes | **ACTIVE_AGENT** | Final convergence + auth overlap | After merged to release branch |
| `feat/email-outreach-mvp-integration` | `e6760f5` | yes | **INTEGRATED** | Import + send-job merge | After 7d2 base confirmed stable |
| `feat/jhgomes-product-data-staging` | `314f6fb` | yes | **ACTIVE_AGENT** | Product import staging | After feature convergence |
| `feat/inventory-product-foundation` | `f02471c` | yes | **ACTIVE_AGENT** | Inventory module foundation | After feature convergence |
| `feat/email-outreach-send-jobs` | `47af013` | yes | **ACTIVE_AGENT** | Send-job runtime | Absorbed into 7d2; retain until convergence |
| `feat/outreach-import-ops-hardening` | `60fa927` | yes | **INTEGRATED** | Import ops; merged into MVP integration | After release checkpoint |

---

## Additional local branches

| Branch | HEAD | Remote | Classification | Delete when |
|--------|------|--------|----------------|-------------|
| `release/jh-gomes-outreach-supabase` | `86d5bd2` | no | **ACTIVE_AGENT** | Primary release line; dirty WIP | Never until production deploy |
| `release/jh-gomes-outreach` | `de654e2` | no | **SUPERSEDED** | Pre-Supabase release | After `release/jh-gomes-outreach-supabase` tagged |
| `integration/jh-gomes-outreach-runtime` | `bf5f3fe` | tracks `feat/customer-pc-local-runtime` (ahead 2) | **SUPERSEDED** | Runtime test branch | After customer-PC docs archived |
| `feat/email-outreach-live-mvp` | `b9c41f1` | yes | **SUPERSEDED** | Early live MVP | 90 days after 7d2 release |
| `feat/email-outreach-provider` | `9cf9936` | yes | **INTEGRATED** | Provider foundation | After release checkpoint |
| `feat/email-outreach-send-jobs-7d2` | `ab5deaa` | yes | **INTEGRATED** | Step 7D2; merged into base | After 7d2 release |
| `feat/customer-pc-local-runtime` | `dadd43c` | yes | **HISTORICAL_BACKUP** | Customer PC experiment | Archive docs first |
| `feat/jh-gomes-mail-connector` | `0a60750` | yes | **HISTORICAL_BACKUP** | Mailbox connector spike | Owner confirms abandon |
| `feat/outlook-local-send-mvp` | `8d146ff` | yes | **HISTORICAL_BACKUP** | Outlook local send | Owner confirms abandon |
| `feat/marketing-studio-foundation` | `ecbb190` | yes | **HISTORICAL_BACKUP** | Marketing studio UI | After dashboard docs consolidated |
| `feat/cup-customizer-integration` | `e808af0` | yes | **SUPERSEDED** | Pre-UI integration | After `feat/cup-customizer-integration-ui` merged |
| `integration/dependency-security-remediation` | `a4610df` | yes | **READY_FOR_INTEGRATION** | Non-cursor dependency fix | After dependency convergence |
| `chore/dependency-audit-triage` | `24c7f3d` | yes | **HISTORICAL_BACKUP** | Audit docs only | After security findings archived |
| `chore/repository-hygiene` | `213dc3e` | tracks 7d2 base | **ACTIVE_AGENT** | This hygiene branch | Merge to integration after review |
| `codex/forgeos-foundation-app-shell` | `ce59543` | yes | **SUPERSEDED** | Early foundation | 90 days after release |
| `agent/codex-next-task` | `bd33f90` | no | **SAFE_TO_DELETE_LATER** | Abandoned agent task | After worktree removed |
| `agent/cursor-ui-review` | `bd33f90` | no | **SAFE_TO_DELETE_LATER** | Abandoned agent task | After worktree removed |
| `backup/jh-gomes-outreach-de654e2` | `de654e2` | no | **HISTORICAL_BACKUP** | Named backup | After release tagged |
| `backup/jh-gomes-outreach-runtime-bf5f3fe` | `bf5f3fe` | no | **HISTORICAL_BACKUP** | Named backup | After release tagged |
| `maintenance/light-scan-20260704-1357` | `4ed280e` | yes | **HISTORICAL_BACKUP** | Maintenance scan | 60 days |
| `review/xlsx-security-remediation` | `73a897b` | tracks fix branch | **SAFE_TO_DELETE_LATER** | Review mirror | After fix merged |
| `main` | `0e9cacf` | behind origin 2 | **UNKNOWN** | Stale initial commit | Repoint or archive after release |
| `origin/cursor/forgeos-foundation-4a5a` | — | remote only | **SUPERSEDED** | Old cursor branch | Remote delete after 90 days |
| `origin/integration/jh-gomes-outreach-runtime` | — | remote only | **SUPERSEDED** | Runtime integration | Remote delete with local |

---

## Remote-only branches (no local worktree)

- `origin/cursor/forgeos-foundation-4a5a`
- `origin/integration/jh-gomes-outreach-runtime`

---

## Recommended post-convergence deletion order

1. **SAFE_TO_DELETE_LATER** — `agent/*`, `review/xlsx-security-remediation` (after worktree removal)
2. **SUPERSEDED** — `feat/email-outreach-live-mvp`, `release/jh-gomes-outreach`, `feat/cup-customizer-integration`
3. **INTEGRATED feature branches** — after merge commit recorded in `docs/checkpoints/`
4. **HISTORICAL_BACKUP** — `backup/*`, `maintenance/*` after 60–90 day retention
5. **Remote mirrors** — `origin/integration/jh-gomes-outreach-runtime`, `origin/cursor/forgeos-foundation-4a5a`

**Never delete without:** verifying `git worktree list` has no entry, confirming no open PR, and documenting in release checkpoint.

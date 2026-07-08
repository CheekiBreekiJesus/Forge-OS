# ForgeOS Local Workspace Consolidation Audit

**Audit date:** 2026-07-08  
**Inspector:** Cursor (read-only consolidation pass)  
**Root scanned:** `C:\Users\J35U5\Desktop\VS Code`  
**Canonical directory:** `C:\Users\J35U5\Desktop\VS Code\Forge-OS`  
**Remote:** `https://github.com/CheekiBreekiJesus/Forge-OS.git`

---

## 1. Executive summary

ForgeOS exists as **one Git repository** with **35 linked worktrees**, plus **1 recovery backup folder** and **1 agent-locks directory** under the VS Code root. No unrelated non-ForgeOS application repositories were found at this level.

**Validated product head (2026-07-08):** A UI-regression agent pushed and validated **`release/jh-gomes-outreach-supabase` @ `0fa25ae`**. This branch is now the **latest known good candidate** for LeadOps workflow, campaign UI, portfolio email banner, protected Brevo test-send, hydration-safe dates, campaign Playwright tests, and the current cup customizer (including `efebdaf` PP scene previews).

**Do not assume PR #3 is the most complete source.** PR #3 (`integration/jh-gomes-release-candidate` → `integration/jh-gomes-outreach-supabase-7d2`) consolidates auth activation, cursor convergence, repository hygiene, and Node 22 CI — but it is **66 commits behind** the validated outreach release on product features (campaign workflow restore, portfolio banner, Brevo gates, cup PP assets, hydration fix). The branches have **diverged**: release is **20 commits ahead** of PR #3 head with outreach-specific work PR #3 does not contain.

**Critical uncommitted assets:** Two cup PNG files in the canonical worktree differ from commit `efebdaf` and must be treated as **DO NOT DELETE** until visual verification completes.

| Metric | Value |
|--------|-------|
| ForgeOS-related folders | **37** |
| Git repositories | **1** |
| Git worktrees | **35** |
| Dirty working trees | **11** |
| Local branches with commits not in `release/jh-gomes-outreach-supabase` | **28** |
| Folders provisionally safe to delete after merge | **~30+** (generated caches + stale sandboxes) |
| **Recommended canonical branch** | **`release/jh-gomes-outreach-supabase` @ `0fa25ae`** |

---

## 2. Critical risks

| Risk | Severity | Detail |
|------|----------|--------|
| Uncommitted cup PNG deltas | **HIGH** | `250ml.png` and `330ml.png` differ from `efebdaf`; may be intentional QA refinements or accidental overwrite |
| PR #3 mistaken as source of truth | **HIGH** | Would lose 20 validated outreach commits including campaign UI restore and hydration fix |
| `feat/email-outreach-send-jobs-7d2` not in release | **MEDIUM** | `ab5deaa` adds `prepare-campaign` routes absent from `0fa25ae` — hosted prep still needs cherry-pick |
| `Forge-OS-inventory` dirty WIP | **MEDIUM** | 9 uncommitted files — unique inventory persistence work at loss risk |
| 35 worktrees × `node_modules`/`.next` | **LOW (disk)** | Multi-GB duplicate generated artifacts |
| Local `main` behind `origin/main` | **LOW** | Local `main` @ `0e9cacf` vs `origin/main` @ `1b15d2a` (2 behind) — irrelevant to release track |
| `.env.local` + backups in canonical worktree | **PROTECTED** | Never delete; names only in this report |

---

## 3. Complete folder inventory

See machine-readable inventory: [`forgeos-local-repositories.csv`](./forgeos-local-repositories.csv)

### Summary table

| Path | Type | Branch | HEAD | Dirty | ~Source MB | node_modules | .next | .env* (names only) |
|------|------|--------|------|-------|------------|--------------|-------|---------------------|
| `Forge-OS` | **main worktree** | `release/jh-gomes-outreach-supabase` | `0fa25ae` | **yes** | 44.5 | yes | varies | `.env.example`, `.env.local`, `.env.test.example`, `.env.customer.local.example`, `.env.local.backup.*` |
| `Forge-OS-0.2.0-local-demo` | worktree | `release/forgeos-0.2.0-local-demo` | `ad67637` | yes | 7.5 | no | no | `.env.example`, `.env.test.example` |
| `Forge-OS-auth-activation` | worktree | `integration/jh-gomes-auth-activation` | `4b42cc7` | no | 12.7 | no | no | `.env.example`, `.env.test.example` |
| `Forge-OS-auth-membership` | worktree | `feat/supabase-auth-membership` | `ee821f9` | no | 6.6 | no | no | `.env.example` |
| `Forge-OS-codex` | worktree | `agent/codex-next-task` | `bd33f90` | no | 1.6 | no | no | `.env.example` |
| `Forge-OS-cup-customizer-integration` | worktree | `feat/cup-customizer-integration-ui` | `db8a19a` | yes | 6.2 | no | no | `.env.example` |
| `Forge-OS-cup-customizer-preview-ux` | worktree | `fix/cup-customizer-preview-layout` | `1529a9d` | yes | 6.2 | no | no | `.env.example` |
| `Forge-OS-cursor` | worktree | `agent/cursor-ui-review` | `bd33f90` | no | 1.6 | no | no | `.env.example` |
| `Forge-OS-cursor-dependency-convergence` | worktree | `integration/dependency-security-cursor` | `bd3f477` | no | 6.7 | no | no | `.env.example` |
| `Forge-OS-cursor-feature-convergence` | worktree | `integration/jh-gomes-feature-convergence-cursor` | `601b5b5` | no | 6.8 | no | no | `.env.example` |
| `Forge-OS-cursor-final-convergence` | worktree | `integration/jh-gomes-cursor-convergence` | `64a1ebd` | no | 7.0 | no | no | `.env.example` |
| `Forge-OS-dependency-audit` | worktree | `chore/dependency-audit-triage` | `24c7f3d` | no | 6.1 | no | no | `.env.example` |
| `Forge-OS-dependency-integration` | worktree | `integration/dependency-security-remediation` | `a4610df` | no | 55.7 | yes | no | `.env.example` |
| `Forge-OS-inventory` | worktree | `feat/inventory-product-foundation` | `f02471c` | **yes** | 5.3 | no | no | `.env.example` |
| `Forge-OS-inventory-mobile` | worktree | `feat/inventory-mobile-barcode-mvp` | `6a99030` | yes | 7.0 | no | no | `.env.example` |
| `Forge-OS-jh-gomes-mail` | worktree | `feat/jh-gomes-mail-connector` | `0a60750` | no | 6.1 | no | no | `.env.example` |
| `Forge-OS-local-runtime` | worktree | `feat/customer-pc-local-runtime` | `dadd43c` | no | 6.3 | no | no | `.env.example` |
| `Forge-OS-maintenance` | worktree | `maintenance/light-scan-20260704-1357` | `4ed280e` | yes | 5.9 | no | no | `.env.example` |
| `Forge-OS-marketing-studio` | worktree | `feat/marketing-studio-foundation` | `ecbb190` | no | 2.4 | no | no | `.env.example` |
| `Forge-OS-oauth-foundation` | worktree | `feat/supabase-oauth-foundation` | `cf97561` | no | 6.5 | no | no | `.env.example` |
| `Forge-OS-outlook-local` | worktree | `feat/outlook-local-send-mvp` | `8d146ff` | no | 6.3 | no | no | `.env.example` |
| `Forge-OS-outreach` | worktree | `feat/email-outreach-live-mvp` | `b9c41f1` | yes | 5.7 | no | no | `.env.example` |
| `Forge-OS-outreach-integration` | worktree | `feat/email-outreach-mvp-integration` | `e6760f5` | no | 6.1 | no | no | `.env.example` |
| `Forge-OS-outreach-ops` | worktree | `feat/outreach-import-ops-hardening` | `60fa927` | no | 5.9 | no | no | `.env.example` |
| `Forge-OS-outreach-provider` | worktree | `feat/email-outreach-provider` | `9cf9936` | no | 5.8 | no | no | `.env.example` |
| `Forge-OS-playwright-remediation` | worktree | `fix/playwright-audit-remediation` | `5ef6630` | no | 6.7 | no | no | `.env.example` |
| `Forge-OS-product-import` | worktree | `feat/jhgomes-product-data-staging` | `314f6fb` | no | 4.9 | no | no | `.env.example` |
| `Forge-OS-release-candidate` | worktree | `integration/jh-gomes-release-candidate` | `3507986` | **yes** | 13.3 | no | no | `.env.example` |
| `Forge-OS-repository-hygiene` | worktree | `chore/repository-hygiene` | `4e9a71d` | no | 6.1 | no | no | `.env.example` |
| `Forge-OS-send-jobs` | worktree | `feat/email-outreach-send-jobs` | `47af013` | no | 6.1 | no | no | `.env.example` |
| `Forge-OS-send-jobs-7d2` | worktree | `feat/email-outreach-send-jobs-7d2` | `ab5deaa` | yes | 6.1 | no | no | `.env.example` |
| `Forge-OS-spreadsheet-security-review` | worktree | `review/xlsx-security-remediation` | `73a897b` | no | 5.9 | no | no | `.env.example` |
| `Forge-OS-supabase-7d2-integration` | worktree | `integration/jh-gomes-outreach-supabase-7d2` | `213dc3e` | yes | 12.1 | no | no | `.env.example`, `.env.local` |
| `Forge-OS-table-ui` | worktree | `fix/table-density-and-action-overlays` | `7ac724d` | no | 6.1 | no | no | `.env.example` |
| `Forge-OS-xlsx-remediation` | worktree | `fix/xlsx-security-remediation` | `73a897b` | no | 6.6 | no | no | `.env.example` |
| `ForgeOS-7D2-Recovery-Backup` | archive (no git) | — | — | no | 0.1 | no | no | — |
| `.forgeos-agent-locks` | agent locks | — | — | no | 0 | no | no | — |

*Source MB excludes `node_modules`, `.next`, and other generated directories. Total disk per worktree can exceed 1 GB when caches exist.*

---

## 4. Git worktree inventory

```
git worktree list --porcelain  →  35 worktrees, all traced to Forge-OS canonical repo
```

| Role | Worktree | Branch |
|------|----------|--------|
| **Canonical active** | `Forge-OS` | `release/jh-gomes-outreach-supabase` |
| PR #3 release candidate | `Forge-OS-release-candidate` | `integration/jh-gomes-release-candidate` |
| PR #3 integration base | `Forge-OS-supabase-7d2-integration` | `integration/jh-gomes-outreach-supabase-7d2` |
| 0.2.0 demo (workflow origin) | `Forge-OS-0.2.0-local-demo` | `release/forgeos-0.2.0-local-demo` |
| 7D2 hosted prep | `Forge-OS-send-jobs-7d2` | `feat/email-outreach-send-jobs-7d2` |
| Auth activation | `Forge-OS-auth-activation` | `integration/jh-gomes-auth-activation` |
| Cursor convergence | `Forge-OS-cursor-final-convergence` | `integration/jh-gomes-cursor-convergence` |
| Stale agent sandboxes | `Forge-OS-codex`, `Forge-OS-cursor` | `agent/*` @ `bd33f90` |

**Stash:** `stash@{0}` on `codex/forgeos-foundation-app-shell` — "pre-inventory unrelated local changes"

**Tag:** `backup/jh-gomes-outreach-runtime-bf5f3fe`

---

## 5. Branch inventory

### 5.1 Key branches

| Branch | HEAD | vs `main` | vs `release/jh-gomes-outreach-supabase` | Notes |
|--------|------|-----------|----------------------------------------|-------|
| `main` (local) | `0e9cacf` | — | 124 behind | Local main stale; `origin/main` @ `1b15d2a` |
| **`release/jh-gomes-outreach-supabase`** | **`0fa25ae`** | **124 ahead** | — | **Validated product head** |
| `integration/jh-gomes-release-candidate` (PR #3) | `3507986` | 170 ahead | 66 behind release | Auth + CI convergence |
| `integration/jh-gomes-outreach-supabase-7d2` (PR #3 base) | `213dc3e` | — | 7 behind release | Supabase local config |
| `release/forgeos-0.2.0-local-demo` | `ad67637` | 190 ahead | 86 behind release | Original workflow @ `002c69c` |
| `integration/jh-gomes-cursor-convergence` | `64a1ebd` | 153 ahead | 49 behind release | Feature convergence |
| `codex/forgeos-foundation-app-shell` (PR #2) | `ce59543` | 28 ahead | not ancestor | Stale vs release |
| `feat/email-outreach-send-jobs-7d2` | `ab5deaa` | 64 ahead | 2 unique (7d2 prep) | Missing from release |

### 5.2 Merged into `release/jh-gomes-outreach-supabase`

Includes ancestry from: `release/jh-gomes-outreach`, `feat/email-outreach-live-mvp`, `feat/email-outreach-provider`, `feat/outreach-import-ops-hardening`, `feat/inventory-product-foundation`, `feat/customer-pc-local-runtime`, `agent/codex-next-task`, `agent/cursor-ui-review`, backup branches.

### 5.3 Not merged into `release/jh-gomes-outreach-supabase` (28 local branches with unique commits)

Notable: `integration/jh-gomes-release-candidate` (66 unique), `release/forgeos-0.2.0-local-demo` (86 unique), `integration/jh-gomes-cursor-convergence` (49), `feat/cup-customizer-integration-ui` (28), `fix/cup-customizer-preview-layout` (26), `feat/email-outreach-send-jobs-7d2` (2), `integration/jh-gomes-auth-activation` (11).

### 5.4 Validated commit sequence on release branch

| Commit | Message |
|--------|---------|
| `efebdaf` | feat(cup-customizer): add reusable PP scene previews |
| `7cb4028` | fix(leadops): restore campaign workflow UI from 0.2.0 demo branch |
| `1369f38` | feat(outreach): add custom cups portfolio banner |
| `0fa25ae` | fix(leadops): align campaign e2e with workflow UI and hydration-safe dates |

Campaign workflow regression root cause: improved workflow existed at `002c69c` on `release/forgeos-0.2.0-local-demo` and was reconciled into release while preserving newer protected Brevo test-send (`0aa91ed`).

---

## 6. Uncommitted work inventory

### 6.1 Canonical worktree (`Forge-OS`) — **PROTECT**

| Status | Path | Notes |
|--------|------|-------|
| Modified | `public/assets/cup-customizer/cups/reusable-pp/250ml.png` | **Differs from `efebdaf`** — 982,869 B vs 1,063,528 B |
| Modified | `public/assets/cup-customizer/cups/reusable-pp/330ml.png` | **Differs from `efebdaf`** — 1,033,202 B vs 966,876 B |
| Modified | `next-env.d.ts` | Auto-generated — safe to revert |
| Untracked | `.qa/cup-asset-check/` | QA screenshots for cup asset verification |
| Untracked | `scripts/data-preparation/fixtures/synthetic_products.csv` | Synthetic fixture |
| Untracked | `FORGEOS_RECOVERY_AUDIT.md` | Prior audit doc |
| Untracked | `.cursor/settings.json`, `.vscode/` | IDE config |

### 6.2 Cup PNG binary analysis

| File | Working tree SHA256 | efebdaf size | Working tree size | Verdict |
|------|---------------------|--------------|-------------------|---------|
| `250ml.png` | `60BEC85D…` | 1,063,528 B | 982,869 B (−78 KB) | **Different content — DO NOT DELETE** |
| `330ml.png` | `19E75DE7…` | 966,876 B | 1,033,202 B (+66 KB) | **Different content — DO NOT DELETE** |

Compare visually against `.qa/cup-asset-check/` before commit or revert.

### 6.3 Other dirty worktrees

| Worktree | Changes | Classification |
|----------|---------|----------------|
| `Forge-OS-inventory` | 7 modified + 2 untracked persistence files | **MERGE / DO NOT DELETE** |
| `Forge-OS-release-candidate` | CI workflow, README, Playwright prep script | Review — may overlap PR #3 |
| `Forge-OS-maintenance` | 3 leadops-related files | Archive patch |
| `Forge-OS-0.2.0-local-demo` | `public/demo/outreach/jh-gomes-showcase.svg` | Archive after reconcile confirmed |
| 6 worktrees | `next-env.d.ts` only | Generated — not unique |

---

## 7. Feature implementation matrix

See [`forgeos-feature-comparison.csv`](./forgeos-feature-comparison.csv).

### Priority features — explicit five-way comparison

| Feature | `main` | `release/jh-gomes-outreach-supabase` @ `0fa25ae` | PR #3 RC | `release/forgeos-0.2.0-local-demo` | Winner |
|---------|--------|--------------------------------------------------|----------|-------------------------------------|--------|
| LeadOps campaign workflow UI | ✗ | ✓ restored via `7cb4028` | ✗ (pre-restore) | ✓ original `002c69c` (superseded) | **release @ 0fa25ae** |
| Portfolio email banner | ✗ | ✓ `1369f38` | ✗ | partial older showcase | **release @ 0fa25ae** |
| Protected Brevo test-send | ✗ | ✓ `0aa91ed` + runbook | ✗ | ✗ | **release @ 0fa25ae** |
| Hydration-safe campaign dates | ✗ | ✓ `0fa25ae` | ✗ | ✗ | **release @ 0fa25ae** |
| Campaign Playwright (11/11) | ✗ | ✓ validated | specs exist; pre-fix | older test ids | **release @ 0fa25ae** |
| Cup customizer PP previews | ✗ | ✓ `efebdaf` + local PNG deltas | older package | older preview | **release @ 0fa25ae** (+ verify PNGs) |
| Supabase auth activation | ✗ | partial migrations | ✓ full activation | ✗ | **Cherry-pick from PR #3** |
| Node 22 CI / lockfile | ✗ | partial `8d03ba2` | ✓ full PR #3 validation | partial | **Cherry-pick from PR #3** |
| Hosted campaign prep (7D2) | ✗ | ✗ | partial ancestry | ✗ | **`feat/email-outreach-send-jobs-7d2` @ `ab5deaa`** |
| Inventory product WIP | ✗ | partial module | partial | partial | **`Forge-OS-inventory` dirty WIP** |

---

## 8. PR #2 vs PR #3 vs `main` comparison

### PR #2 — `codex/forgeos-foundation-app-shell` → `main`

| Field | Value |
|-------|-------|
| State | Open (not draft) |
| Head | `ce59543` |
| Base | `main` @ `1b15d2a` |
| Scope | Foundation app shell, product staging import |
| Relevance | **Stale** — superseded by 124+ commits on release branch |
| Action | Close or retarget after consolidation; do not merge to release |

### PR #3 — `integration/jh-gomes-release-candidate` → `integration/jh-gomes-outreach-supabase-7d2`

| Field | Value |
|-------|-------|
| State | Open (draft) |
| Head | `3507986` |
| Base | `213dc3e` |
| Validated on PR branch | lint, typecheck, 304 unit tests, e2e, acceptance, build, supabase db reset |
| **Missing vs `0fa25ae`** | Campaign workflow restore, portfolio banner, Brevo protected test-send, cup PP scene previews, hydration fix, 20 outreach commits |
| **Unique vs `0fa25ae`** | Auth activation merge, cursor convergence, repo hygiene docs, Node 22 CI, Playwright pretest wrapper fix |
| Action | **Cherry-pick unique commits into release** — do not replace release with PR #3 head |

### `main`

| Field | Value |
|-------|-------|
| `origin/main` | `1b15d2a` — merged PR #1 foundation only |
| Product features | None of outreach, cup customizer, LeadOps |
| Action | Merge release into `main` only after full validation post-consolidation |

---

## 9. Recommended canonical source branch

**`release/jh-gomes-outreach-supabase` @ `0fa25ae`**

Rationale:
- Latest validated candidate for outreach/campaign/cup customizer product surface
- Campaign Playwright 11/11; `npm run validate` passed
- Fast-forward pushed to `origin/release/jh-gomes-outreach-supabase`
- Preserves protected Brevo test-send while restoring 0.2.0 workflow UI

PR #3 remains valuable as a **secondary integration source** for auth, CI, and repository hygiene — not as the primary application branch.

---

## 10. Required unfinished tasks before merge

1. **Verify and resolve cup PNG deltas** — compare working tree vs `efebdaf` using `.qa/cup-asset-check/`; commit or revert explicitly.
2. **Commit or patch `Forge-OS-inventory` WIP** — 9 dirty files with unique persistence logic.
3. **Cherry-pick `ab5deaa`** (7D2 hosted campaign prep) onto release — `prepare-campaign` routes confirmed absent from `0fa25ae`.
4. **Cherry-pick auth activation** from `integration/jh-gomes-auth-activation` / PR #3 — re-run `npm run test:supabase:integration`.
5. **Cherry-pick CI/Node 22 fixes** from PR #3 — verify `npm ci` on clean Linux.
6. **Cherry-pick `fix/table-density-and-action-overlays`** if 271-lead import UI needed.
7. **Re-run full validation** on consolidated branch: lint, typecheck, unit, e2e (campaign 11/11), acceptance, build, validate.
8. **Resolve PR #3 direction** — update base to release branch or close after cherry-picks land.
9. **Push consolidated branch** when authorized.
10. **Merge to `main`** only after step 7 passes.

---

## 11. Safe merge sequence

*Do not execute during read-only audit. Proposed execution order:*

### Phase A — Preserve (no data loss)

```powershell
cd "C:\Users\J35U5\Desktop\VS Code\Forge-OS"
git stash push -u -m "audit-backup-cup-pngs-and-untracked" -- public/assets/cup-customizer/cups/reusable-pp/250ml.png public/assets/cup-customizer/cups/reusable-pp/330ml.png
git branch backup/audit-20260708-uncommitted-$(Get-Date -Format yyyyMMdd-HHmm) 
# In Forge-OS-inventory worktree:
git -C "..\Forge-OS-inventory" stash push -u -m "audit-backup-inventory-wip"
```

### Phase B — Establish integration branch from validated head

```powershell
git checkout release/jh-gomes-outreach-supabase
git pull origin release/jh-gomes-outreach-supabase
git checkout -b integration/consolidation-20260708
```

### Phase C — Feature-by-feature integration (not folder swap)

```powershell
# 1. Cup PNG resolution (after visual QA)
git stash pop  # or checkout -- if reverting to efebdaf

# 2. 7D2 hosted prep
git cherry-pick ab5deaae8324bd829cff42927598fc8096823d7c

# 3. Auth activation (from PR #3 ancestry)
git cherry-pick 4b42cc7224448f290334880bac34f6d1705d42b4
# Resolve conflicts feature-by-feature if any

# 4. CI / Node 22 (from PR #3)
git cherry-pick e0d6ec3 f7303ad a9cad06 3507986  # tooling commits only

# 5. Table UI density (optional)
git cherry-pick 7ac724de33639e00207e5933ed530ed6098398ca

# 6. Inventory WIP (after stash restore in inventory worktree)
# Manual merge from Forge-OS-inventory stash
```

### Phase D — Lightweight checks

```powershell
npm run lint
npm run typecheck
npm test
```

### Phase E — Full validation

```powershell
npm run test:e2e
npm run test:acceptance
npm run build
npm run validate
npx supabase db reset --local --yes
npm run test:supabase:integration
```

### Phase F — Merge to main (only if Phase E passes)

```powershell
git checkout main
git pull origin main
git merge --no-ff integration/consolidation-20260708
```

### Phase G — Cleanup (only after backup verification)

```powershell
# Remove stale worktrees (examples — verify list first)
git worktree remove "..\Forge-OS-codex"
git worktree remove "..\Forge-OS-cursor"
# Prune generated caches per worktree
# Remove worktrees listed in forgeos-cleanup-candidates.csv as SAFE TO DELETE
```

---

## 12. Cleanup candidates

See [`forgeos-cleanup-candidates.csv`](./forgeos-cleanup-candidates.csv).

| Classification | Count (approx) | Examples |
|----------------|----------------|----------|
| KEEP | 2 | `Forge-OS`, `.forgeos-agent-locks` |
| MERGE | 5+ | `Forge-OS-send-jobs-7d2`, `Forge-OS-inventory`, auth-activation |
| ARCHIVE TEMPORARILY | 3 | `Forge-OS-0.2.0-local-demo`, recovery backup, maintenance |
| SAFE TO DELETE AFTER MERGE | 30+ | `node_modules`, `.next`, stale sandboxes, `next-env.d.ts` |
| DO NOT DELETE | 4+ | Cup PNGs, `.env.local`, inventory WIP |
| REVIEW MANUALLY | 2 | PR #3 worktrees |

---

## 13. Explicit do-not-delete list

| Item | Reason |
|------|--------|
| `Forge-OS/public/assets/cup-customizer/cups/reusable-pp/250ml.png` (uncommitted) | Binary differs from `efebdaf`; visual verification pending |
| `Forge-OS/public/assets/cup-customizer/cups/reusable-pp/330ml.png` (uncommitted) | Binary differs from `efebdaf`; visual verification pending |
| `Forge-OS/.env.local` | Local secrets (names only reported) |
| `Forge-OS/.env.local.backup.*` | Timestamped env backups |
| `Forge-OS-inventory/` dirty files | Unique inventory persistence WIP |
| `Forge-OS/.qa/cup-asset-check/` | QA evidence for cup asset decision |
| `Forge-OS-send-jobs-7d2` @ `ab5deaa` | Unique 7D2 hosted prep not yet on release |
| `ForgeOS-7D2-Recovery-Backup/` | Recovery snapshot until 7d2 merge verified |
| All uncommitted work across 11 dirty worktrees | Preserve until patched or committed |

---

## 14. Commands proposed for later execution phase

```powershell
# Status checkpoint
git -C "C:\Users\J35U5\Desktop\VS Code\Forge-OS" status --short --branch
git -C "C:\Users\J35U5\Desktop\VS Code\Forge-OS" worktree list
git -C "C:\Users\J35U5\Desktop\VS Code\Forge-OS" log --oneline -5 release/jh-gomes-outreach-supabase

# Cup PNG comparison
git -C "C:\Users\J35U5\Desktop\VS Code\Forge-OS" diff --stat efebdaf -- public/assets/cup-customizer/cups/reusable-pp/

# Branch divergence
git -C "C:\Users\J35U5\Desktop\VS Code\Forge-OS" log --oneline release/jh-gomes-outreach-supabase..integration/jh-gomes-release-candidate
git -C "C:\Users\J35U5\Desktop\VS Code\Forge-OS" log --oneline integration/jh-gomes-release-candidate..release/jh-gomes-outreach-supabase

# 7D2 presence check
git -C "C:\Users\J35U5\Desktop\VS Code\Forge-OS" cat-file -e release/jh-gomes-outreach-supabase:src/app/api/outreach/send-jobs/prepare-campaign/route.ts

# Full validation (post-merge only)
cd "C:\Users\J35U5\Desktop\VS Code\Forge-OS"
npm run validate
```

---

## 15. Final recommendation

1. **Treat `release/jh-gomes-outreach-supabase` @ `0fa25ae` as the canonical product branch** for all outreach, campaign, cup customizer, and Brevo test-send work validated today.
2. **Do not merge PR #3 wholesale** — it lacks 20 commits of validated outreach product work and would regress campaign UI, portfolio banner, hydration fix, and cup PP previews.
3. **Cherry-pick from PR #3** only for auth activation, Supabase membership, Node 22 CI, and repository hygiene — validating after each pick.
4. **Cherry-pick `ab5deaa`** from `feat/email-outreach-send-jobs-7d2` for hosted campaign preparation still missing from release.
5. **Protect and verify the two uncommitted cup PNGs** before any cleanup or `git checkout` that could discard them.
6. **Backup and integrate `Forge-OS-inventory` WIP** as a separate feature merge.
7. **After consolidation passes full validation**, merge to `main`, prune stale worktrees, and delete generated caches — leaving **`C:\Users\J35U5\Desktop\VS Code\Forge-OS`** as the single canonical directory.

---

## Machine-readable outputs

| File | Description |
|------|-------------|
| [`forgeos-local-repositories.csv`](./forgeos-local-repositories.csv) | Full folder inventory (37 rows) |
| [`forgeos-feature-comparison.csv`](./forgeos-feature-comparison.csv) | Feature matrix across branches |
| [`forgeos-cleanup-candidates.csv`](./forgeos-cleanup-candidates.csv) | Cleanup classification |

---

*End of audit. No source code, git state, or secrets were modified during this read-only pass.*

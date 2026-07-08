# ForgeOS Unique Commit Disposition Ledger

**Generated:** 2026-07-08  
**Canonical base:** `release/jh-gomes-outreach-supabase` @ `0fa25ae`  
**Disposition key:** A=INTEGRATE, B=SUPERSEDED, C=INFRASTRUCTURE ONLY, D=EXPERIMENTAL, E=GENERATED/DOC ONLY, F=UNKNOWN

---

## Integrated in Phase A

| Source | Commit / branch | Disposition | Action taken |
|--------|-----------------|-------------|--------------|
| `feat/email-outreach-send-jobs-7d2` | `ab5deaa` | **A** | File-level integration: hosted send-job repositories, prepare-campaign routes, tenant-memberships API, migrations `202607030001` + `202607030002`, migration check script, docs |
| `integration/jh-gomes-auth-activation` | `4b42cc7` ancestry | **A + C** | Auth lib, login/access pages, OAuth callback routes, `202607040001` migration, tenant module upgrades |
| `integration/jh-gomes-release-candidate` (PR #3) | CI/tooling commits | **C** | Node 22 CI, `.nvmrc`, `.node-version`, `prepare-playwright-tests.mjs` |
| PR #3 | auth/membership overlap | **B** | Partial overlap with 7D2 `202607030001`; reconciled via sequential migrations |

---

## Superseded by canonical release

| Branch | Disposition | Rationale |
|--------|-------------|-----------|
| `release/forgeos-0.2.0-local-demo` | **B** | Campaign workflow restored via `7cb4028`; demo branch is ancestry source only |
| `feat/email-outreach-live-mvp` | **B** | Merged into release ancestry |
| `feat/email-outreach-provider` | **B** | Merged into release ancestry |
| `feat/outreach-import-ops-hardening` | **B** | Merged into release ancestry |
| `feat/cup-customizer-integration-ui` | **B** | Cup customizer on release @ `efebdaf` |
| `fix/cup-customizer-preview-layout` | **B** | Preview UX in release ancestry |
| `agent/codex-next-task`, `agent/cursor-ui-review` | **B** | Stale sandboxes @ `bd33f90` |
| `codex/forgeos-foundation-app-shell` (PR #2) | **B** | 124+ commits behind release |

---

## Infrastructure only (selective extract)

| Branch | Disposition | Extracted | Rejected |
|--------|-------------|-----------|----------|
| `integration/jh-gomes-release-candidate` | **C** | Node 22 CI, Playwright prep JS, auth activation files | Wholesale merge (would lose 20 outreach commits) |
| `integration/jh-gomes-cursor-convergence` | **C** | Docs overlap only | Product UI replacements |
| `chore/repository-hygiene` | **E** | — | Hygiene docs deferred to Phase B |
| `integration/dependency-security-remediation` | **C** | — | xlsx already on release; ExcelJS lazy-load deferred |
| `fix/playwright-audit-remediation` | **E** | — | Docs only |

---

## Experimental / defer

| Branch | Disposition | Notes |
|--------|-------------|-------|
| `feat/outlook-local-send-mvp` | **D** | Parallel email provider; not in validated release |
| `feat/jh-gomes-mail-connector` | **D** | Mailbox connector track |
| `feat/marketing-studio-foundation` | **D** | Foundation only |
| `feat/inventory-mobile-barcode-mvp` | **D** | Mobile barcode MVP separate from inventory WIP |
| `feat/customer-pc-local-runtime` | **D** | Deployment track; partial ancestry on release |

---

## Preserve for manual merge (Phase B)

| Branch / worktree | Disposition | Notes |
|-------------------|-------------|-------|
| `feat/inventory-product-foundation` + dirty WIP | **A (deferred)** | 9 files; patch archived |
| `fix/table-density-and-action-overlays` | **A (deferred)** | 271-lead import UI density |
| `feat/jhgomes-product-data-staging` | **A (deferred)** | Product import staging |
| `maintenance/light-scan-20260704-1357` | **F** | 3 leadops file edits |
| `stash@{0}` on `codex/forgeos-foundation-app-shell` | **F** | Not applied |

---

## Cup asset decision

| Item | Disposition |
|------|-------------|
| Uncommitted `250ml.png` / `330ml.png` deltas | **B** — reverted to committed `efebdaf` versions; working copies lacked genuine alpha and showed baked checkerboard |

---

## PR #3 commits inspected (sample)

| Commit | Disposition |
|--------|-------------|
| `3507986` Playwright pretest JS fix | **C** — integrated |
| `a9cad06` Node 22 CI | **C** — integrated |
| `4b42cc7` auth activation tests | **A** — integrated via auth branch checkout |
| `6ab2a22` cup customizer merge | **B** — release newer |
| `c8beba6` table density merge | **A deferred** |
| `ee654e9` repo audit docs | **E** |

---

*End of disposition ledger.*

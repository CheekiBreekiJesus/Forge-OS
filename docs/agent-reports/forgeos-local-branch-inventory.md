# ForgeOS Local Branch Inventory — 2026-07-08

Parent directory: `C:\Users\J35U5\Desktop\VS Code`  
Git repository root: `Forge-OS` (single repo, multiple worktrees)  
Remote: `https://github.com/CheekiBreekiJesus/Forge-OS.git`

---

## Directory classification

| Directory | ~Size MB | Type | Branch | Commit | Status |
|-----------|----------|------|--------|--------|--------|
| `Forge-OS` | 1448 | **Main worktree** | `release/jh-gomes-outreach-supabase` | `86d5bd2` | **dirty** — active development |
| `.forgeos-agent-locks` | 0 | Agent coordination locks | — | — | Safe to keep |
| `ForgeOS-7D2-Recovery-Backup` | 0.1 | Recovery backup snapshot | — | — | Archive candidate after verification |
| All other `Forge-OS-*` | 545–1839 | **Git worktrees** | various | see below | Mostly clean |

**No unrelated non-ForgeOS projects** found at this level.

---

## Worktree detail

| Worktree | Branch | Commit | Dirty | Purpose | In main? |
|----------|--------|--------|-------|---------|----------|
| `Forge-OS-0.2.0-local-demo` | `release/forgeos-0.2.0-local-demo` | `ad67637` | clean | 0.2.0 local demo release | Partial — demo branch |
| `Forge-OS-auth-activation` | `integration/jh-gomes-auth-activation` | `4b42cc7` | clean | Auth activation integration | Partial |
| `Forge-OS-auth-membership` | `feat/supabase-auth-membership` | `ee821f9` | clean | Supabase membership | Merged into supabase release ancestry |
| `Forge-OS-codex` | `agent/codex-next-task` | `bd33f90` | clean | Stale agent sandbox | No — stale |
| `Forge-OS-cursor` | `agent/cursor-ui-review` | `bd33f90` | clean | Stale agent sandbox | No — stale |
| `Forge-OS-cup-customizer-integration` | `feat/cup-customizer-integration-ui` | `db8a19a` | dirty | Cup customizer UI | **Overlaps main WIP** |
| `Forge-OS-cup-customizer-preview-ux` | `fix/cup-customizer-preview-layout` | `1529a9d` | dirty | Preview layout fix | **Overlaps main WIP** |
| `Forge-OS-cursor-dependency-convergence` | `integration/dependency-security-cursor` | `bd3f477` | clean | Dependency security | Partial |
| `Forge-OS-cursor-feature-convergence` | `integration/jh-gomes-feature-convergence-cursor` | `601b5b5` | clean | Feature convergence | Partial |
| `Forge-OS-cursor-final-convergence` | `integration/jh-gomes-cursor-convergence` | `64a1ebd` | clean | Cursor convergence | Partial |
| `Forge-OS-dependency-audit` | `chore/dependency-audit-triage` | `24c7f3d` | clean | Dependency audit | Partial |
| `Forge-OS-dependency-integration` | `integration/dependency-security-remediation` | `a4610df` | clean | Security remediation | Partial |
| `Forge-OS-inventory` | `feat/inventory-product-foundation` | `f02471c` | dirty | Inventory foundation | Not in release branch |
| `Forge-OS-inventory-mobile` | `feat/inventory-mobile-barcode-mvp` | `6a99030` | dirty | Mobile barcode MVP | Not in release branch |
| `Forge-OS-jh-gomes-mail` | `feat/jh-gomes-mail-connector` | `0a60750` | clean | Mailbox connector | Not merged |
| `Forge-OS-local-runtime` | `feat/customer-pc-local-runtime` | `dadd43c` | clean | Customer PC deployment | Ancestry in release |
| `Forge-OS-maintenance` | `maintenance/light-scan-20260704-1357` | `4ed280e` | dirty | Maintenance scan | N/A |
| `Forge-OS-marketing-studio` | `feat/marketing-studio-foundation` | `ecbb190` | clean | Marketing studio | Not merged |
| `Forge-OS-oauth-foundation` | `feat/supabase-oauth-foundation` | `cf97561` | clean | OAuth foundation | Not merged |
| `Forge-OS-outlook-local` | `feat/outlook-local-send-mvp` | `8d146ff` | clean | Outlook local send | Not merged |
| `Forge-OS-outreach` | `feat/email-outreach-live-mvp` | `b9c41f1` | dirty | Early live MVP | Superseded |
| `Forge-OS-outreach-integration` | `feat/email-outreach-mvp-integration` | `e6760f5` | clean | Import + send-job integration | Partial ancestry |
| `Forge-OS-outreach-ops` | `feat/outreach-import-ops-hardening` | `60fa927` | clean | Import hardening | In ancestry |
| `Forge-OS-outreach-provider` | `feat/email-outreach-provider` | `9cf9936` | clean | Brevo foundation | In ancestry |
| `Forge-OS-playwright-remediation` | `fix/playwright-audit-remediation` | `5ef6630` | clean | Playwright fixes | Partial |
| `Forge-OS-product-import` | `feat/jhgomes-product-data-staging` | `314f6fb` | clean | Product data staging | Not merged |
| `Forge-OS-release-candidate` | `integration/jh-gomes-release-candidate` | `3507986` | dirty | Release candidate integration | Partial |
| `Forge-OS-repository-hygiene` | `chore/repository-hygiene` | `4e9a71d` | clean | Repo hygiene | Partial |
| `Forge-OS-send-jobs` | `feat/email-outreach-send-jobs` | `47af013` | clean | Send jobs 7D1 | Partial |
| `Forge-OS-send-jobs-7d2` | `feat/email-outreach-send-jobs-7d2` | `ab5deaa` | dirty (`next-env.d.ts`) | **Step 7D2 hosted prep** | **Not in main release branch** |
| `Forge-OS-spreadsheet-security-review` | `review/xlsx-security-remediation` | `73a897b` | clean | XLSX security review | Partial |
| `Forge-OS-supabase-7d2-integration` | `integration/jh-gomes-outreach-supabase-7d2` | `213dc3e` | dirty | Supabase + 7D2 integration attempt | Not merged |
| `Forge-OS-table-ui` | `fix/table-density-and-action-overlays` | `7ac724d` | clean | Table UI density | Not merged |
| `Forge-OS-xlsx-remediation` | `fix/xlsx-security-remediation` | `73a897b` | clean | XLSX remediation | Partial |

---

## Unique features not in main worktree (committed)

| Source worktree | Unique capability |
|-----------------|-------------------|
| `Forge-OS-send-jobs-7d2` | Hosted campaign preparation, tenant membership API extensions (commit `ab5deaa`) |
| `Forge-OS-inventory` | Product/inventory foundation CRUD beyond current release |
| `Forge-OS-jh-gomes-mail` | SMTP/IMAP mailbox connector |
| `Forge-OS-marketing-studio` | Marketing studio UI shell |
| `Forge-OS-oauth-foundation` | Supabase OAuth wiring |
| `Forge-OS-outlook-local` | Local Outlook send MVP |

## Overlap with main uncommitted WIP

Cup customizer preview repair appears in **main worktree uncommitted files** and partially in:

- `Forge-OS-cup-customizer-integration` (dirty)
- `Forge-OS-cup-customizer-preview-ux` (dirty)

**Recommendation:** Treat main worktree as canonical for cup customizer; archive or reset dirty cup worktrees after commit.

---

## Safe to archive later (not delete in this session)

| Path | Rationale |
|------|-----------|
| `Forge-OS-codex`, `Forge-OS-cursor` | Stale agent sandboxes at `bd33f90` |
| `Forge-OS-outreach` | Superseded by release branch outreach stack |
| `ForgeOS-7D2-Recovery-Backup` | Point-in-time backup; verify `ab5deaa` commit first |
| Duplicate cup-customizer worktrees | After main WIP committed |

## Do not archive

| Path | Rationale |
|------|-----------|
| `Forge-OS` (main) | Active release development |
| `Forge-OS-send-jobs-7d2` | Contains 7D2 not yet merged into release |
| `Forge-OS-local-runtime` | Customer PC deployment reference |
| `Forge-OS-supabase-7d2-integration` | Active integration attempt (dirty) |

---

## Size notes

Sizes include `node_modules` and `.next` build caches (500 MB–1.8 GB per worktree). This is expected for parallel Next.js worktrees on Windows.

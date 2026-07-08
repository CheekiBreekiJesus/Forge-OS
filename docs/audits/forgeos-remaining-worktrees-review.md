# ForgeOS Remaining Worktrees Review

**Date:** 2026-07-08  
**Canonical repository:** `C:\Users\J35U5\Desktop\VS Code\Forge-OS`  
**Main HEAD:** `d7a38ca` (`main` == `origin/main`)

---

## 1. Starting worktree count

**9** registered worktrees (1 canonical + 8 non-canonical):

| Path | Branch |
|------|--------|
| `Forge-OS` | `main` |
| `Forge-OS-maintenance` | `maintenance/light-scan-20260704-1357` |
| `Forge-OS-inventory` | `feat/inventory-product-foundation` |
| `Forge-OS-inventory-mobile` | `feat/inventory-mobile-barcode-mvp` |
| `Forge-OS-table-ui` | `fix/table-density-and-action-overlays` |
| `Forge-OS-product-import` | `feat/jhgomes-product-data-staging` |
| `Forge-OS-jh-gomes-mail` | `feat/jh-gomes-mail-connector` |
| `Forge-OS-marketing-studio` | `feat/marketing-studio-foundation` |
| `Forge-OS-outlook-local` | `feat/outlook-local-send-mvp` |

---

## 2. Maintenance worktree decision

**REMOVE_SUPERSEDED** — worktree deregistered; local branch deleted.

The maintenance worktree had three dirty LeadOps files. Each was compared against `main` at `d7a38ca`:

| File | Classification | Evidence |
|------|----------------|----------|
| `scripts/data-preparation/profile-lead-files.mjs` | **Already integrated** | `countEmails()` helper present on `main` |
| `src/application/campaign-draft-service.ts` | **Already integrated** | `const updated = await repos.campaignRecipients.updateDraft(...)` present on `main` with additional draft/render improvements |
| `src/features/leadops/providers.ts` | **Obsolete / superseded** | Smartlead delivery moved to `src/features/leadops/server-delivery.ts` on `main`; maintenance dirty edit targeted removed `providers.ts` delivery surface |

Branch tip `4ed280e` (`fix(leadops): repair Smartlead delivery typecheck`) predates the outreach release merge and is superseded by `main`. Uncommitted edits were restored to branch HEAD before removal. No checkpoint commit was needed.

---

## 3. Maintenance files reviewed

1. `scripts/data-preparation/profile-lead-files.mjs` — integrated  
2. `src/application/campaign-draft-service.ts` — integrated  
3. `src/features/leadops/providers.ts` — superseded by `server-delivery.ts` refactor on `main`

---

## 4. Stash decision

**DROP** — `stash@{0}` dropped as `8832f703`.

| Stash content | Classification | Evidence |
|---------------|----------------|----------|
| `AGENTS.md` (~940-line rewrite) | **Obsolete foundation code** | Stash base `codex/forgeos-foundation-app-shell`; current `main` retains the concise project `AGENTS.md` |
| `config/ai/catalogs/abacus.generated.json` | **Generated** | Catalog timestamp drift only |
| `next-env.d.ts` | **Generated** | Next.js type reference |
| `qa/ui/latest/report.md` | **Generated QA artifact** | Superseded by later QA passes on `main` |
| `src/components/leadops-dashboard-shell.tsx` | **Obsolete** | Foundation-era layout/i18n tweaks; `main` uses refactored LeadOps shell (`leadops-import-wizard`, operational summary panels, etc.) |

No archive branch created — no unique source worth preserving.

---

## 5. Deferred worktree classifications

| Worktree | Branch | Commits ahead of `main` | Dirty state | Classification | Rationale |
|----------|--------|-------------------------|-------------|----------------|-----------|
| `Forge-OS-inventory` | `feat/inventory-product-foundation` | 1 (after checkpoint) | Was dirty (9 files) | **ARCHIVE_BRANCH_AND_REMOVE** | Useful unfinished IndexedDB inventory persistence; checkpoint committed; branch retained |
| `Forge-OS-inventory-mobile` | `feat/inventory-mobile-barcode-mvp` | 87 | `next-env.d.ts` only (generated) | **ARCHIVE_BRANCH_AND_REMOVE** | Mobile barcode MVP; branch on `origin`; worktree removed |
| `Forge-OS-table-ui` | `fix/table-density-and-action-overlays` | 7 | Clean | **ARCHIVE_BRANCH_AND_REMOVE** | Table density/overlay fixes; not active on `main` |
| `Forge-OS-product-import` | `feat/jhgomes-product-data-staging` | 7 | Clean | **ARCHIVE_BRANCH_AND_REMOVE** | Product staging/import workflow; docs mention private acceptance review, not committed secrets |
| `Forge-OS-jh-gomes-mail` | `feat/jh-gomes-mail-connector` | 4 | Clean | **ARCHIVE_BRANCH_AND_REMOVE** | SMTP/IMAP connector foundation; tenant-neutral API boundary |
| `Forge-OS-marketing-studio` | `feat/marketing-studio-foundation` | 2 | Clean | **ARCHIVE_BRANCH_AND_REMOVE** | Marketing studio UI foundation |
| `Forge-OS-outlook-local` | `feat/outlook-local-send-mvp` | 13 | Clean | **ARCHIVE_BRANCH_AND_REMOVE** | Local Outlook send MVP with idempotency tests |

No worktree classified **KEEP_ACTIVE** — none are under active development; archive branches preferred per cleanup policy.

---

## 6. Worktrees removed

| Path | Method | Notes |
|------|--------|-------|
| `Forge-OS-maintenance` | `git worktree remove` (partial) | Git registration removed; folder deletion blocked (Permission denied) |
| `Forge-OS-inventory` | `git worktree remove` | Success |
| `Forge-OS-inventory-mobile` | `git worktree remove` (partial) | Git registration removed; folder deletion blocked (Permission denied) |
| `Forge-OS-table-ui` | `git worktree remove` | Success |
| `Forge-OS-product-import` | `git worktree remove` | Success |
| `Forge-OS-jh-gomes-mail` | `git worktree remove` | Success |
| `Forge-OS-marketing-studio` | `git worktree remove` | Success |
| `Forge-OS-outlook-local` | `git worktree remove` | Success |

`git worktree prune` run after removals.

---

## 7. Worktrees retained

| Path | Branch | Reason |
|------|--------|--------|
| `Forge-OS` | `main` | **Canonical repository** |

---

## 8. Checkpoint commits or patches created

| Branch | SHA | Message |
|--------|-----|---------|
| `feat/inventory-product-foundation` | `6a2798d` | `wip(inventory): checkpoint IndexedDB persistence and workspace shell` |

Files preserved (9): inventory workspace shell, persistence layer (`db.ts`, interfaces, IndexedDB repositories), backup service hooks, demo data, and `inventory-product-persistence.test.ts`.

Prior Phase A patch reference (`forge-OS-inventory-wip.patch`) may still exist under a local preservation folder if created earlier; the checkpoint commit is the authoritative preservation on the branch.

---

## 9. Local branches deleted

| Branch | Method | Reason |
|--------|--------|--------|
| `maintenance/light-scan-20260704-1357` | `git branch -d` | Superseded maintenance scan; remote branch retained on `origin` |

---

## 10. Local branches retained

| Branch | Tip | Notes |
|--------|-----|-------|
| `main` | `d7a38ca` | Canonical |
| `feat/inventory-product-foundation` | `6a2798d` | Ahead of `origin` by 1 (checkpoint) |
| `feat/inventory-mobile-barcode-mvp` | `6a99030` | Tracks `origin` |
| `fix/table-density-and-action-overlays` | `7ac724d` | Tracks `origin` |
| `feat/jhgomes-product-data-staging` | `314f6fb` | Tracks `origin` |
| `feat/jh-gomes-mail-connector` | `0a60750` | Tracks `origin` |
| `feat/marketing-studio-foundation` | `ecbb190` | Tracks `origin` |
| `feat/outlook-local-send-mvp` | `8d146ff` | Tracks `origin` |
| `archive/pre-main-merge-20260708` | `8059973` | Pre-merge archive |
| `backup/*`, `release/*`, `integration/*`, `codex/*`, `feat/cup-customizer-integration` | various | Existing archives / backups unchanged |

---

## 11. Remaining stash entries

**None** — `stash@{0}` dropped.

---

## 12. Final worktree list

```
C:/Users/J35U5/Desktop/VS Code/Forge-OS  d7a38ca [main]
```

**1** registered worktree (canonical only).

---

## 13. Remaining folders requiring manual review

These directories are **no longer Git worktrees** but could not be deleted from disk (Windows permission denied — likely IDE or indexer file locks):

| Folder | Former branch | Action |
|--------|---------------|--------|
| `C:\Users\J35U5\Desktop\VS Code\Forge-OS-maintenance` | `maintenance/light-scan-20260704-1357` | Safe to delete manually after closing editors/terminals using the folder |
| `C:\Users\J35U5\Desktop\VS Code\Forge-OS-inventory-mobile` | `feat/inventory-mobile-barcode-mvp` | Safe to delete manually; branch preserved on `origin` |

Do not delete `.env.local` or other private files if present — review contents first. These folders should contain only a stale checkout with no unique uncommitted work (maintenance was restored clean; inventory-mobile had only generated `next-env.d.ts` drift).

---

## 14. Recommended next feature branch to continue

**`feat/inventory-product-foundation`** at `6a2798d`

Rationale: fresh checkpoint commit preserves the largest near-term ForgeOS deferred feature (inventory product persistence + workspace shell). Checkout with:

```bash
git checkout feat/inventory-product-foundation
```

Push the checkpoint when ready:

```bash
git push origin feat/inventory-product-foundation
```

Secondary candidates (archive branches, no local worktree):

- `fix/table-density-and-action-overlays` — UI polish, 7 commits  
- `feat/outlook-local-send-mvp` — local send hardening, 13 commits

---

## 15. Confirmation: `main` was not modified

**Confirmed.** No product source changes on `main`. Only this audit document was added/committed.

`npm run typecheck` passed on canonical `main` at `d7a38ca`.

---

## 16. Confirmation: no remote branch was deleted

**Confirmed.** No `git push --delete` or remote branch mutations.

---

## 17. Confirmation: no force push occurred

**Confirmed.**

---

## 18. Confirmation: no email was sent

**Confirmed.**

---

*End of remaining worktrees review.*

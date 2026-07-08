# ForgeOS Dirty Worktree Preservation Manifest

**Generated:** 2026-07-08  
**Consolidation phase:** A  
**Archive root:** `C:\Users\J35U5\Desktop\VS Code\ForgeOS-Consolidation-Preservation-20260708`

---

## Summary

| Worktrees scanned | Dirty | Preserved | Method |
|-------------------|-------|-----------|--------|
| 11 | 11 | 11 | patch archive + classification record |

No worktree was cleaned, reset, or deleted during this phase.

---

## 1. Forge-OS (canonical)

| Field | Value |
|-------|-------|
| Path | `C:\Users\J35U5\Desktop\VS Code\Forge-OS` |
| Branch | `release/jh-gomes-outreach-supabase` |
| HEAD | `0fa25ae` |

| File | Classification | Action |
|------|----------------|--------|
| `public/assets/cup-customizer/cups/reusable-pp/250ml.png` | temporary QA artifact (inferior to committed) | **Reverted** to `efebdaf` committed version; working copy archived at `$env:TEMP\cup-working-250ml.png` |
| `public/assets/cup-customizer/cups/reusable-pp/330ml.png` | temporary QA artifact (inferior to committed) | **Reverted** to `efebdaf` committed version; working copy archived at `$env:TEMP\cup-working-330ml.png` |
| `next-env.d.ts` | generated output | Left unstaged; not committed |
| `.qa/cup-asset-check/` | temporary QA artifact | Retained in place (untracked) |
| `docs/audits/` | consolidation documentation | Committed in consolidation docs commit |
| `.cursor/settings.json`, `.vscode/` | IDE config | Not committed |
| `scripts/data-preparation/fixtures/synthetic_products.csv` | valid synthetic fixture | Not committed (optional future fixture commit) |

**Cup asset hashes (working tree before revert):**

| File | SHA256 | Size |
|------|--------|------|
| `250ml.png` (working) | `60BEC85D5598907164B171287006F628C1EA7FF0515058F35AF7BE0E585FF4D9` | 982,869 B |
| `330ml.png` (working) | `19E75DE7E6A6943D8A1B202326DB5AD5EEF9253074CDE43822F02EEFF0EB5E24` | 1,033,202 B |

**Committed (`efebdaf`) hashes retained:**

| File | Git blob | Size |
|------|----------|------|
| `250ml.png` | `6144c3c2ab49babcd0dad1cb1ece1b08be6a019a` | 1,063,528 B |
| `330ml.png` | (committed HEAD) | 966,876 B |

---

## 2. Forge-OS-inventory

| Field | Value |
|-------|-------|
| Path | `C:\Users\J35U5\Desktop\VS Code\Forge-OS-inventory` |
| Branch | `feat/inventory-product-foundation` |
| HEAD | `f02471c` |

| File | Classification |
|------|----------------|
| `src/components/inventory-product-workspace-shell.tsx` | valid source implementation |
| `src/domain/constants.ts` | valid source implementation |
| `src/features/backup/service.ts` | valid source implementation |
| `src/features/inventory-product/demo.ts` | valid source implementation |
| `src/persistence/db.ts` | valid source implementation |
| `src/persistence/indexeddb/repositories.ts` | valid source implementation |
| `src/persistence/interfaces.ts` | valid source implementation |
| `src/persistence/indexeddb/inventory-product-repositories.ts` | valid source implementation (untracked) |
| `src/persistence/inventory-product-persistence.test.ts` | valid source implementation (untracked) |

**Preservation:** `forge-OS-inventory-wip.patch` (67,574 bytes) at archive root.

---

## 3. Forge-OS-release-candidate

| Field | Value |
|-------|-------|
| Branch | `integration/jh-gomes-release-candidate` |
| HEAD | `3507986` |

| File | Classification | Integration |
|------|----------------|-------------|
| `.github/workflows/supabase-integration.yml` | infrastructure | Reviewed; partial CI changes integrated via canonical worktree |
| `README.md` | documentation | Not integrated (release README unchanged) |
| `scripts/qa/prepare-playwright-tests.mjs` | infrastructure | **Integrated** into canonical branch |

---

## 4. Forge-OS-maintenance

| File | Classification |
|------|----------------|
| `scripts/data-preparation/profile-lead-files.mjs` | unknown / maintenance scan |
| `src/application/campaign-draft-service.ts` | unknown |
| `src/features/leadops/providers.ts` | unknown |

**Preservation:** Record only; no commit on maintenance branch.

---

## 5. Forge-OS-0.2.0-local-demo

| File | Classification |
|------|----------------|
| `public/demo/outreach/jh-gomes-showcase.svg` | temporary QA artifact |

**Preservation:** Record only; workflow reconciled into release @ `7cb4028`.

---

## 6. Generated-only dirty worktrees (next-env.d.ts)

| Worktree | Branch |
|----------|--------|
| Forge-OS-cup-customizer-integration | `feat/cup-customizer-integration-ui` |
| Forge-OS-cup-customizer-preview-ux | `fix/cup-customizer-preview-layout` |
| Forge-OS-inventory-mobile | `feat/inventory-mobile-barcode-mvp` |
| Forge-OS-outreach | `feat/email-outreach-live-mvp` |
| Forge-OS-send-jobs-7d2 | `feat/email-outreach-send-jobs-7d2` |
| Forge-OS-supabase-7d2-integration | `integration/jh-gomes-outreach-supabase-7d2` |

**Classification:** generated output — not unique implementation.

---

## Stash inventory

| Stash | Branch context | Classification |
|-------|----------------|----------------|
| `stash@{0}` | `codex/forgeos-foundation-app-shell` | unknown — preserved, not applied |

---

## Agent locks

`.forgeos-agent-locks` — empty / coordination only; no active locks observed.

---

*End of preservation manifest.*

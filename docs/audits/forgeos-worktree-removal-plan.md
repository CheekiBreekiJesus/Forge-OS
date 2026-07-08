# ForgeOS Worktree Removal Plan — Workspace Cleanup

**Generated:** 2026-07-08 (continued cleanup)  
**Canonical repository:** `C:\Users\J35U5\Desktop\VS Code\Forge-OS`  
**Main HEAD:** `98ecc08` (`main` == `origin/main`)  
**Archive checkpoint:** `archive/pre-main-merge-20260708` @ `8059973`  
**Preservation root:** `C:\Users\J35U5\Desktop\VS Code\ForgeOS-Consolidation-Preservation-20260708`

---

## Summary

| Metric | Value |
|--------|-------|
| Registered worktrees (start) | 30 |
| Target removals | 21 |
| Retained intentionally | 9 (incl. canonical) |

---

## Inventory

| Path | Branch | HEAD | Clean | Unique vs main | Preserved | Action |
|------|--------|------|-------|----------------|-----------|--------|
| `Forge-OS` | `main` | `98ecc08` | dirty (QA untracked) | 0 | canonical | **KEEP_CANONICAL** |
| `Forge-OS-inventory` | `feat/inventory-product-foundation` | `f02471c` | dirty (7M+2U) | 0 (behind) | patch @ preservation root | **KEEP_DEFERRED_FEATURE** |
| `Forge-OS-inventory-mobile` | `feat/inventory-mobile-barcode-mvp` | `6a99030` | dirty (`next-env.d.ts`) | 87 | origin | **KEEP_DEFERRED_FEATURE** |
| `Forge-OS-table-ui` | `fix/table-density-and-action-overlays` | `7ac724d` | clean | 7 | origin | **KEEP_DEFERRED_FEATURE** |
| `Forge-OS-product-import` | `feat/jhgomes-product-data-staging` | `314f6fb` | clean | 7 | origin | **KEEP_DEFERRED_FEATURE** |
| `Forge-OS-jh-gomes-mail` | `feat/jh-gomes-mail-connector` | `0a60750` | clean | 4 | origin | **KEEP_DEFERRED_FEATURE** |
| `Forge-OS-marketing-studio` | `feat/marketing-studio-foundation` | `ecbb190` | clean | 2 | origin | **KEEP_DEFERRED_FEATURE** |
| `Forge-OS-outlook-local` | `feat/outlook-local-send-mvp` | `8d146ff` | clean | 13 | origin | **KEEP_DEFERRED_FEATURE** |
| `Forge-OS-maintenance` | `maintenance/light-scan-20260704-1357` | `4ed280e` | dirty (3 leadops) | 1 | record only | **MANUAL_REVIEW** |
| `Forge-OS-auth-activation` | `integration/jh-gomes-auth-activation` | `4b42cc7` | clean | 11 | origin; integrated | **REMOVE_SAFE** |
| `Forge-OS-auth-membership` | `feat/supabase-auth-membership` | `ee821f9` | clean | 9 | origin; integrated | **REMOVE_SAFE** |
| `Forge-OS-oauth-foundation` | `feat/supabase-oauth-foundation` | `cf97561` | clean | 8 | origin; integrated | **REMOVE_SAFE** |
| `Forge-OS-send-jobs` | `feat/email-outreach-send-jobs` | `47af013` | clean | 1 | origin; integrated | **REMOVE_SAFE** |
| `Forge-OS-outreach-integration` | `feat/email-outreach-mvp-integration` | `e6760f5` | clean | 2 | origin; superseded | **REMOVE_SAFE** |
| `Forge-OS-outreach` | `feat/email-outreach-live-mvp` | `b9c41f1` | dirty (`next-env.d.ts`) | 0 | merged in main | **PRESERVE_THEN_REMOVE** |
| `Forge-OS-dependency-audit` | `chore/dependency-audit-triage` | `24c7f3d` | clean | 9 | origin (docs) | **REMOVE_SAFE** |
| `Forge-OS-repository-hygiene` | `chore/repository-hygiene` | `4e9a71d` | clean | 11 | origin (docs) | **REMOVE_SAFE** |
| `Forge-OS-playwright-remediation` | `fix/playwright-audit-remediation` | `5ef6630` | clean | 11 | origin (docs) | **REMOVE_SAFE** |
| `Forge-OS-dependency-integration` | `integration/dependency-security-remediation` | `a4610df` | clean | 18 | origin | **REMOVE_SAFE** |
| `Forge-OS-spreadsheet-security-review` | `review/xlsx-security-remediation` | `73a897b` | clean | 14 | local only | **REMOVE_SAFE** |
| `Forge-OS-xlsx-remediation` | `fix/xlsx-security-remediation` | `73a897b` | clean | 14 | origin | **REMOVE_SAFE** |
| `Forge-OS-cursor-dependency-convergence` | `integration/dependency-security-cursor` | `bd3f477` | clean | 13 | origin | **REMOVE_SAFE** |
| `Forge-OS-cursor-feature-convergence` | `integration/jh-gomes-feature-convergence-cursor` | `601b5b5` | clean | 41 | origin | **REMOVE_SAFE** |
| `Forge-OS-cursor-final-convergence` | `integration/jh-gomes-cursor-convergence` | `64a1ebd` | clean | 49 | origin | **REMOVE_SAFE** |
| `Forge-OS-cup-customizer-integration` | `feat/cup-customizer-integration-ui` | `db8a19a` | dirty (`next-env.d.ts`) | 28 | origin; superseded | **PRESERVE_THEN_REMOVE** |
| `Forge-OS-cup-customizer-preview-ux` | `fix/cup-customizer-preview-layout` | `1529a9d` | dirty (`next-env.d.ts`) | 26 | origin; superseded | **PRESERVE_THEN_REMOVE** |
| `Forge-OS-send-jobs-7d2` | `feat/email-outreach-send-jobs-7d2` | `ab5deaa` | dirty (`next-env.d.ts`) | 2 | origin; integrated | **PRESERVE_THEN_REMOVE** |
| `Forge-OS-supabase-7d2-integration` | `integration/jh-gomes-outreach-supabase-7d2` | `213dc3e` | dirty (`next-env.d.ts`) | 7 | origin; superseded | **PRESERVE_THEN_REMOVE** |
| `Forge-OS-0.2.0-local-demo` | `release/forgeos-0.2.0-local-demo` | `ad67637` | dirty (showcase SVG) | 86 | origin; superseded | **PRESERVE_THEN_REMOVE** |
| `Forge-OS-release-candidate` | `integration/jh-gomes-release-candidate` | `3507986` | dirty (README docs) | 66 | origin; superseded | **PRESERVE_THEN_REMOVE** |

---

## Preservation verified before removal

| Item | Location | SHA / size |
|------|----------|------------|
| Inventory WIP patch | `ForgeOS-Consolidation-Preservation-20260708/forge-OS-inventory-wip.patch` | 67,574 B |
| Inventory untracked files | `.../inventory/` | copied |
| Release archive | `archive/pre-main-merge-20260708` | `8059973` |
| All removal-candidate branches | `origin/*` | remote heads verified |
| Canonical `.env.local` | `Forge-OS/.env.local` | superset of 7d2 worktree keys |

---

## Non-worktree folders (KEEP)

| Folder | Classification |
|--------|----------------|
| `ForgeOS-Consolidation-Preservation-20260708` | **KEEP_RECOVERY** |
| `ForgeOS-7D2-Recovery-Backup` | **KEEP_RECOVERY** |
| `.forgeos-agent-locks` | coordination |

---

*End of removal plan.*

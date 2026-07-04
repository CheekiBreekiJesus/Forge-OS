# Cursor Feature Convergence — Baseline

**Date:** 2026-07-04  
**Worktree:** `Forge-OS-cursor-feature-convergence`  
**Branch:** `integration/jh-gomes-feature-convergence-cursor`  
**Base:** `213dc3e` — `chore(supabase): add local development configuration`

## Remote source heads

| Source | Remote ref | Head |
|--------|------------|------|
| Cup Customizer | `origin/feat/cup-customizer-integration-ui` | `db8a19a` |
| Table UI | `origin/fix/table-density-and-action-overlays` | `7ac724d` |
| Outreach (optional) | `origin/feat/email-outreach-mvp-integration` | `e6760f5` |
| Auth (overlap report only) | `origin/feat/supabase-auth-membership` | `ee821f9` |

## Preflight confirmation

- Correct worktree and branch checked out
- HEAD matches expected base `213dc3e`
- Working tree clean (no staged/unstaged/untracked files)
- No credentials or private data observed in working tree
- `git diff --check` clean

## Branch divergence

### Cup Customizer (`db8a19a`)

- **Merge base with HEAD:** `213dc3e` (identical to current base — direct descendant path)
- **Commits ahead of base:** ~20+ commits (customizer module, preview UX, docs, tests)
- **Likely overlapping files:** `src/i18n/dictionaries.ts`, `src/i18n/locales/en.ts`, `src/i18n/locales/pt-PT.ts`, `src/persistence/*` (customizer repos only on cup side), `vitest.config.ts`, `.gitignore`

### Table UI (`7ac724d`)

- **Merge base with HEAD:** `160675a` (older integration checkpoint)
- **Integration base commits since merge-base:** supabase outreach, send jobs, tenant keys, auth wiring, migrations
- **Table branch commits since merge-base:** 7 commits (collapsible viewport, overlay fixes, compact tables, E2E, synthetic fixture)
- **Likely overlapping files:** `src/components/leadops-*`, `src/features/leadops/lead-management.ts`, all `*-shell.tsx` table consumers, CRUD components

### Outreach MVP (`e6760f5`)

- Behind current integration base; inspect only for cherry-pick candidates (tests/QA docs)

## Exclusions (must not modify)

- Supabase OAuth, tenant membership, `proxy.ts`, auth callbacks, auth migrations
- Dependency versions, `package-lock.json` (unless merged feature genuinely requires)
- Spreadsheet parser, Brevo, send jobs, provider webhooks
- Production database configuration, product-import architecture, inventory ledger
- No email sends, migrations, or paid API calls

## Validation plan

1. **Cup merge:** `npm ci`, `typecheck`, `npm test`, `e2e/cup-customizer.spec.ts`, `build`; viewport checks at 1366×768, 1440×900, 1920×1080, 768×1024, 390×844
2. **Table trial merge:** conflict inspection; preserve LeadOps logic + table UI behavior; `e2e/table-density-overlay.spec.ts`, `e2e/lead-import-wizard.spec.ts`
3. **Outreach:** cherry-pick only verification commits; document accept/reject
4. **Auth overlap:** compare with `origin/feat/supabase-auth-membership`; do not pre-resolve auth conflicts
5. **Full validation:** `lint`, `typecheck`, `test`, `test:e2e`, `test:acceptance`, `build`, `validate`

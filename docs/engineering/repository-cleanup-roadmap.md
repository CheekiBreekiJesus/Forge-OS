# Repository Cleanup Roadmap

**Created:** 2026-07-05  
**Base:** `integration/jh-gomes-outreach-supabase-7d2` @ `213dc3e`  
**Owner:** Repository hygiene + integration leads

---

## NOW (this branch — `chore/repository-hygiene`)

| Task | Status | Output |
|------|--------|--------|
| Worktree inventory | Done | `qa/repository/worktree-inventory.md` |
| Branch inventory | Done | `qa/repository/branch-inventory.md` |
| Documentation truth audit | Done | `qa/repository/documentation-truth-audit.md` |
| Update AGENTS.md | Done | Verified stack, reduced reading list |
| Update README.md | Done | Accurate MVP state |
| Rewrite CURRENT_STATE.md | Done | Base vs branch honesty |
| Documentation index | Done | `docs/README.md`, `DOCUMENT_STATUS.md` |
| Duplicate document map | Done | `qa/repository/document-duplicates.md` |
| QA retention policy | Done | `docs/engineering/qa-artifact-retention.md` |
| Environment variable audit | Done | `qa/repository/environment-variable-audit.md` |
| Root file audit | Done | `qa/repository/root-file-cleanup.md` |
| Code hygiene audit | Done | `qa/repository/code-hygiene-audit.md` |
| CI/script audit | Done | `qa/repository/ci-script-audit.md` |

**Dependencies:** None  
**Risks:** None — documentation only

---

## AFTER CURSOR CONVERGENCE

Prerequisites: `integration/jh-gomes-cursor-convergence` merged to release branch.

| Task | Depends on | Risk |
|------|------------|------|
| Archive superseded QA baselines (`qa/outreach/step-1..6`) | Release checkpoint written | Low |
| Adopt shared spreadsheet adapter from xlsx remediation | Feature convergence merge | Medium — import regressions |
| Fix 11 lint warnings (mechanical) | No active agent on same files | Low |
| Split `.env.example` into core/auth/outreach/ai/test | Env audit | Medium — doc drift |
| Gitignore `next-env.d.ts` | Team agreement | Low |
| Delete `CODEX_START_NOW_PROMPT.md` | AGENTS.md adopted | Low |
| Archive `docs/ai-context/02`, `09`, `10` | DOCUMENT_STATUS updated | Low |
| Merge duplicate provider docs | Feature owner review | Low |
| Remove Smartlead code paths | Brevo confirmed; tests updated | Medium |
| Cross-platform Playwright prepare script | CI owner | Medium |

---

## AFTER AUTH INTEGRATION

Prerequisites: `integration/jh-gomes-auth-activation` merged; OAuth configured in Supabase.

| Task | Depends on | Risk |
|------|------------|------|
| Final CURRENT_STATE.md update | Auth merge | Low |
| CI: add supabase integration job | PostgreSQL service in GHA | Medium |
| CI: concurrency + security audit job | Workflow approval | Low |
| CI: migration validation script | Migrations stable | Low |
| Prune agent worktrees (`Forge-OS-codex`, `Forge-OS-cursor`) | No open tasks | Low |
| Prune superseded worktrees (preview-ux, send-jobs-7d2, spreadsheet-review) | Convergence complete | Low |
| Branch deletion phase 1 (SAFE_TO_DELETE_LATER) | 30-day retention | Low |
| Release checkpoint document | Tagged release | Low |
| Consolidate auth docs (outreach vs platform tenant-membership) | Auth docs owner | Medium |

---

## LATER

| Task | Depends on | Risk |
|------|------------|------|
| Archive customer-PC experimental docs + qa/deployment | SaaS path confirmed | Low |
| Consolidate `docs/ai-context/*` into single historical archive | No active references | Low |
| Historical branch deletion (`feat/email-outreach-live-mvp`, `backup/*`) | 90-day retention + owner sign-off | Medium |
| Remote branch cleanup (`origin/cursor/*`, `origin/integration/jh-gomes-outreach-runtime`) | Local deleted first | Low |
| Repoint or retire `main` branch | Release branch strategy | High — coordinate with repo owner |
| Remove demo API routes if dashboard migrated | Product decision | Medium |

---

## Exact safe cleanup steps after final convergence

1. **Verify** `integration/jh-gomes-cursor-convergence` merged to `release/jh-gomes-outreach-supabase` with green CI.
2. **Write** release checkpoint under `docs/checkpoints/` with merge commit SHA.
3. **Update** `docs/CURRENT_STATE.md` to new base branch/commit.
4. **Remove worktrees** (one at a time, no `-f` unless clean):
   - `Forge-OS-codex`, `Forge-OS-cursor`
   - `Forge-OS-cup-customizer-preview-ux`, `Forge-OS-send-jobs-7d2`
   - `Forge-OS-spreadsheet-security-review`
5. **Delete branches** per `qa/repository/branch-inventory.md` SAFE_TO_DELETE_LATER section.
6. **Archive** QA step baselines to `docs/archive/qa/`.
7. **Gitignore** `next-env.d.ts`; discard existing dirty copies in worktrees.
8. **Run** `npm run validate` + full Playwright acceptance on release branch.
9. **Split** env templates per `environment-variable-audit.md`.
10. **Open** focused PR for lint fixes + Smartlead removal.

**Do not:** delete branches with open PRs, drop shared stash without inspection, apply migrations as part of cleanup, or modify `package-lock.json` without dependency convergence owner.

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Dirty worktree data loss (`Forge-OS-inventory`, `Forge-OS`) | Owner commit or patch before worktree removal |
| Shared stash `pre-inventory unrelated local changes` | `git stash show -p` before drop |
| Doc link rot after archive | Redirect headers in old paths |
| CI drift Windows vs Linux | Cross-platform prepare script |

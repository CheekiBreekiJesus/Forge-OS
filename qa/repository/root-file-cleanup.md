# Root and Generated File Audit

**Audit date:** 2026-07-05  
**Worktree:** `Forge-OS-repository-hygiene` @ `213dc3e`

---

## Root-level tracked files

| File | Type | Recommendation |
|------|------|----------------|
| `AGENTS.md` | Canonical | Keep |
| `README.md` | Canonical | Keep |
| `CODEX_START_NOW_PROMPT.md` | Temporary prompt | **Archive/delete later** — superseded by AGENTS.md |
| `package.json` | Manifest | Keep |
| `package-lock.json` | Lockfile | Keep (do not modify in hygiene branch) |
| `next.config.ts` | Config | Keep |
| `tsconfig.json` | Config | Keep |
| `tailwind.config.ts` | Config | Keep |
| `vitest.config.ts` | Config | Keep |
| `playwright.config.ts` | Config | Keep |
| `playwright.acceptance.config.ts` | Config | Keep |
| `postcss.config.mjs` | Config | Keep |
| `eslint.config.mjs` | Config | Keep |
| `next-env.d.ts` | **Generated** | Add to `.gitignore` or stop tracking; auto-modified in 5 worktrees |
| `.env.example` | Template | Keep |
| `.env.test.example` | Template | Keep |
| `.env.customer.local.example` | Template | Keep |
| `.gitignore` | Config | Keep; verify `next-env.d.ts` entry |

---

## Root-level untracked / local (other worktrees)

| File | Worktree | Recommendation |
|------|----------|----------------|
| `.cursor/settings.json` | `Forge-OS` | Gitignore; personal IDE config |
| `FORGEOS_RECOVERY_AUDIT.md` | `Forge-OS` | Merge into checkpoint or delete if duplicate |
| `scripts/data-preparation/fixtures/synthetic_products.csv` | `Forge-OS` | Commit if synthetic; verify no real SKUs |

---

## Generated artifacts (should not be tracked)

| Pattern | Location | Status |
|---------|----------|--------|
| `next-env.d.ts` | root | Tracked; frequently auto-modified |
| `.next/` | root | Gitignored ✓ |
| `node_modules/` | root | Gitignored ✓ |
| `qa/reports/latest-health.json` | qa | Gitignored ✓ |
| `qa/acceptance/results/` | qa | Should be gitignored |
| Playwright traces | `test-results/` | Gitignored ✓ |
| `.customer-pc/logs/` | local | Gitignored ✓ |

---

## Cursor project files

| Path | Recommendation |
|------|----------------|
| `.cursor/rules/*.mdc` | Keep tracked — team rules |
| `.cursor/settings.json` | **Do not commit** — personal |
| `.qa/` (if present) | QA observer findings — keep gitignored or tracked per policy |

---

## Temporary prompt files

| File | Action |
|------|--------|
| `CODEX_START_NOW_PROMPT.md` | Delete after AGENTS.md adoption confirmed |
| `docs/ai-context/09-codex-startup-prompt.md` | Archive |

---

## Local databases

| Name | Source | Recommendation |
|------|--------|----------------|
| IndexedDB `forgeos:*` | Browser | Never in git |
| `forgeos:jhgomes:local` | Customer PC template | Documented only |
| `forgeos:e2e:*` | Playwright | Ephemeral |

---

## Build output

| Path | Recommendation |
|------|----------------|
| `.next/` | Gitignored; CI rebuilds |
| `dist/`, `build/`, `coverage/` | Not present; keep gitignored |

---

## Backup files

No `*.bak`, `*~`, or `*.orig` files found at repository root in hygiene worktree.

---

## Recommendations summary

1. **Gitignore `next-env.d.ts`** or accept churn — prefer gitignore (Next.js regenerates).
2. **Delete `CODEX_START_NOW_PROMPT.md`** after convergence.
3. **Never commit** `.cursor/settings.json`.
4. **Verify** `FORGEOS_RECOVERY_AUDIT.md` in primary worktree before discard.
5. **No root-level** screenshots, downloads, or local DB files observed in hygiene worktree.

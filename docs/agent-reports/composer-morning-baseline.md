# Composer Morning Baseline — 2026-07-08

Inspector: Cursor Composer  
Repository: `C:\Users\J35U5\Desktop\VS Code\Forge-OS`  
Session start: 2026-07-08 ~08:17 UTC+1

---

## Verified facts

| Item | Value |
|------|-------|
| Branch | `release/jh-gomes-outreach-supabase` |
| HEAD commit | `86d5bd2` — `test(supabase): add integration coverage, CI job, and docs update` |
| Remote tracking | No upstream on release branch; local is ahead of `origin/main` |
| App version | `0.1.0` in `package.json` (release target 0.2.0 documented in product docs) |
| Framework | Next.js 16.2.9, React 19, TypeScript 5.8.3 |
| Persistence modes | `local` (IndexedDB/Dexie) default; `supabase` when env configured |
| Entry route | `src/app/[locale]/page.tsx` → `DashboardClientShell` |
| LeadOps route | `src/app/[locale]/leadops/page.tsx` |
| Cup customizer route | `src/app/[locale]/quotations/customizer/page.tsx` |
| Brevo gates | `OUTREACH_REAL_SEND_ENABLED=false`, `OUTREACH_TEST_SEND_ENABLED=false` in `.env.example` |
| CI workflow | `.github/workflows/ci.yml` — lint, typecheck, test, build, selective Playwright |

### Validation executed (pre-implementation)

| Command | Result |
|---------|--------|
| `npm run typecheck` | **Pass** |
| `npm run lint` | **Pass** (12 pre-existing warnings, 0 errors) |
| `npm test` | **Pass** — 57 files, 265 tests (3 skipped) |
| `npm run build` | **Pass** — 110 static/dynamic routes |
| `npx vitest run packages/cup-customizer` | **Pass** — 17/17 |

### Uncommitted work in main worktree (at session start)

~24 modified + ~15 untracked files spanning:

- Cup customizer preview repair (`packages/cup-customizer/*`, `public/assets/cup-customizer/*`, shell UI)
- LeadOps template personalization (`outreach-template-derived-content`, `default-templates`, `template-rendering`)
- Server-only delivery extraction (`server-delivery.ts`, `providers.ts` slimmed)
- Send-job actor type split (`send-job-actor-types.ts`)
- Protected test-send client (`protected-test-send-client.ts`)
- App-frame hydration fix for preview role
- Docs and i18n updates

**Assumption:** This WIP is intentional in-progress integration work from prior agent sessions (cup customizer report dated 2026-07-07). Not discarded.

### Worktree inventory (parent `VS Code/`)

36 ForgeOS-related directories; all share one Git repo with worktrees. See `docs/agent-reports/forgeos-local-branch-inventory.md`.

Notable since recovery audit (2026-07-04):

- `Forge-OS-send-jobs-7d2` now has commit `ab5deaa` (Step 7D2 committed); only `next-env.d.ts` dirty
- Main worktree accumulated substantial new WIP (cup customizer + outreach templates)

---

## Inferred unfinished work

| Area | Gap |
|------|-----|
| Supabase hosted path | Migrations not verified locally; browser still IndexedDB for campaign UI reads |
| Send-job 7D2 merge | Hosted campaign preparation exists in `Forge-OS-send-jobs-7d2` worktree, not merged into `release/jh-gomes-outreach-supabase` |
| Brevo manual test | Francisco manual verification deferred today — no live sends in this session |
| Cup portfolio in email | `portfolioImageUrl` placeholder; customizer export → public URL bridge not wired |
| Dashboard one-screen | Default layout showed all panels + duplicate activity section + outreach CTA on home |
| Playwright E2E | Not run at baseline; scheduled during implementation |
| `release/jh-gomes-outreach-supabase` | Not pushed to remote |

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Large uncommitted diff loss | Medium | Commit in focused chunks this session |
| Parallel worktrees diverging | Medium | Treat main worktree as source of truth; inventory before merging |
| Accidental Brevo send | High | Keep `simulation` provider; `server-delivery.ts` blocks direct Brevo on leadops send path |
| Hydration mismatch (preview role) | Low | Fixed via post-hydration `useEffect` sync in `app-frame-client.tsx` |
| CRLF noise in git status | Low | Ignore; no content changes on several flagged files |

---

## Tasks selected for implementation

1. **Dashboard compaction** — default compact density, hide non-essential panels, remove home outreach CTA and duplicate activity block
2. **Preserve WIP via commits** — cup customizer, outreach templates, server delivery refactor
3. **Run outreach E2E smoke** — `e2e/outreach-workflow.spec.ts`
4. **Agent reports** — baseline, inventory, progress

## Tasks intentionally deferred

- Merging `feat/email-outreach-send-jobs-7d2` into release branch (large integration; needs dedicated merge pass)
- Live Brevo test-send with Francisco credentials
- `supabase start` / Docker stack verification
- Full Playwright acceptance suite
- Push to GitHub (not authorized)
- New manufacturing modules (maintenance, molds, etc.)

---

## Build / test commands (canonical)

```bash
npm run dev              # local dev server
npm run lint
npm run typecheck
npm test                 # vitest src/
npm run build
npm run test:e2e         # Playwright (port 3012 prep)
npm run test:acceptance  # acceptance config (port 3001)
npm run test:supabase:integration  # needs FORGEOS_TEST_DATABASE_URL
npm run agent:health     # lightweight maintenance
```

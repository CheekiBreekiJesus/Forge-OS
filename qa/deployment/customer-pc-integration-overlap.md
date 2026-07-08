# Customer PC integration overlap analysis

**Branch:** `feat/customer-pc-local-runtime`  
**Base:** `origin/feat/email-outreach-mvp-integration` @ `83209dd`  
**Date:** 2026-07-03 (runtime correction update)

## Files changed on this branch

| Path | Category |
|------|----------|
| `.env.customer.local.example` | Customer environment template (Outlook flags, update branch) |
| `.gitignore` | Ignore `.customer-pc/` runtime artifacts |
| `package.json` | `test:customer-pc` scripts |
| `scripts/customer-pc/*` | Windows setup/start/stop/diagnostics/runtime module |
| `e2e/global-setup.ts` | E2E port 3012 pretest isolation |
| `scripts/qa/resolve-e2e-port.ps1` | E2E port pretest script |
| `playwright.config.ts` | E2E global setup hook |
| `src/app/api/health/local/*` | Local health endpoint |
| `docs/deployment/*` | Installation, architecture, PT runbooks |
| `qa/deployment/*` | Baseline, security review, correction summary |

## Overlap with active feature branches

### `origin/feat/email-outreach-mvp-integration` (base)

- **Overlap:** None on application source beyond new health route.
- **Personalization / sender / campaign:** Not modified.
- **Recommendation:** Merge customer PC branch after base is stable; no conflict expected on outreach application files.

### `origin/fix/table-density-and-action-overlays`

- **Overlap:** None. Table primitives and density components untouched.
- **Recommendation:** Either branch can merge independently relative to customer PC work.

### `origin/feat/outlook-local-send-mvp` (if present on remote)

- Remote branch not listed at analysis time.
- **Overlap:** None by design. Customer template disables Outlook Graph and live send (`OUTLOOK_GRAPH_ENABLED=false`, `OUTLOOK_LIVE_SEND_ENABLED=false`). Deprecated `OUTLOOK_LOCAL_SEND_ENABLED` removed from template.
- **Recommendation:** Keep Outlook work separate; align customer template flags with Outlook implementation env names at integration time.

## Touch risk matrix

| Area | Touched | Risk |
|------|---------|------|
| Email provider files | No | None |
| Campaign templates / shells | No | None |
| Table density components | No | None |
| Settings sender profile UI | No | None |
| Authentication | No | None |
| IndexedDB schema / migrations | No | None |
| Outreach API routes | No | None |
| Outlook send implementation | No | None (flags only in customer template) |

## Recommended merge order

1. `feat/email-outreach-mvp-integration` (base) — already ancestor
2. `fix/table-density-and-action-overlays` — UI fixes, independent
3. `feat/customer-pc-local-runtime` — deployment tooling only
4. Create `deploy/jh-gomes-local` branch for customer updates
5. Outlook / Brevo live branches — last, after customer local runtime validated

## Notes

- Do not merge active feature branches into each other as part of this task.
- Customer PC scripts bind to `localhost:3000` only; no conflict with email send networking.
- Database name for customer template is `forgeos:jhgomes:local` (explicit in `.env.customer.local.example`); distinct from E2E acceptance DB name.
- Customer updates target `deploy/jh-gomes-local`, not the feature branch used during development.

# Customer PC integration overlap analysis

**Branch:** `feat/customer-pc-local-runtime`  
**Base:** `origin/feat/email-outreach-mvp-integration` @ `83209dd`  
**Date:** 2026-07-03

## Files changed on this branch

| Path | Category |
|------|----------|
| `.env.customer.local.example` | Customer environment template |
| `.gitignore` | Ignore `.customer-pc/` runtime artifacts |
| `package.json` | `test:customer-pc` scripts |
| `scripts/customer-pc/*` | Windows setup/start/stop/diagnostics |
| `src/app/api/health/local/*` | Local health endpoint |
| `docs/deployment/*` | Installation, architecture, PT runbooks |
| `qa/deployment/*` | Baseline, security review, this file |

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
- **Overlap:** None by design. Customer template disables Outlook local send (`OUTLOOK_LOCAL_SEND_ENABLED=false`).
- **Recommendation:** Keep Outlook work separate; do not merge Outlook branch into customer PC scripts.

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

## Recommended merge order

1. `feat/email-outreach-mvp-integration` (base) — already ancestor
2. `fix/table-density-and-action-overlays` — UI fixes, independent
3. `feat/customer-pc-local-runtime` — deployment tooling only
4. Outlook / Brevo live branches — last, after customer local runtime validated

## Notes

- Do not merge active feature branches into each other as part of this task.
- Customer PC scripts bind to `localhost:3000` only; no conflict with email send networking.
- Database name for customer template is `forgeos:jhgomes:local` (explicit in `.env.customer.local.example`); distinct from E2E acceptance DB name.

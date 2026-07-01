# ForgeOS Acceptance Suite — Latest Summary

## Dashboard Refresh Addendum - 2026-07-01

- Added dark/light/system theme foundation with local persistence.
- Added complete industrial navigation map with preview shells for missing modules.
- Rebuilt the localized dashboard around local repository metrics, Outreach visibility, Marketing Studio summary, OEE preview, inventory risk, production orders, revenue estimate, alerts, and Copilot preview.
- Live provider publishing, paid image generation, auth, RLS, and production deployment remain out of scope.

| Field | Value |
| --- | --- |
| **Date** | 2026-06-30 |
| **Branch** | `codex/forgeos-foundation-app-shell` |
| **Base commit (start)** | `75bb7dd` |
| **Browser** | Chromium (Desktop Chrome) |
| **Live AI tested** | No (`live-ai.spec.ts` skipped unless `FORGEOS_LIVE_AI=1`) |

## Test counts

| Suite | Result |
| --- | --- |
| Acceptance (`npm run test:acceptance`) | **45 passed**, 1 skipped, 0 failed |
| Existing E2E (`npm run test:e2e`) | **78 passed**, 1 skipped |
| Unit (`npm test`) | **104 passed** (20 files) |
| Lint | Pass |
| Typecheck | Pass |
| Build | Pass |
| Validate | Pass |
| AI doctor (`abacus`) | Config present; diagnostic OK (no live generation call) |

## Routes covered

Dashboard, Demo, Outreach (LeadOps), Customers, Products, Quotations, Cup Customizer, Production, Inventory, Machines, Maintenance (hosted shell), Settings, Login placeholders, Job cards (via demo flow), EN/PT locales, responsive viewports (390×844, 768×1024, 1440×900).

## Architecture

- **Config:** `playwright.acceptance.config.ts` — port 3001, isolated DB `forgeos:e2e:acceptance`, deterministic AI, simulation delivery.
- **Helpers:** `e2e/helpers/` — persistence reset, console audit, paid-call guard, mail URL checks, downloads.
- **Fixtures:** `e2e/fixtures/` — PNG assets, CSV import files (valid/duplicate/invalid/mixed).
- **Specs:** `e2e/acceptance/00`–`08` + optional `live-ai.spec.ts`.
- **Plan:** `qa/acceptance/forgeos-acceptance-plan.md`
- **Dead-control audit:** `qa/acceptance/dead-control-audit.md`

## Isolation / reset strategy

Each test calls `resetAcceptanceState`: clear IndexedDB + session/local storage, fresh navigation, wait for persistence. Demo/customizer tests additionally call `waitForOperationsSeed` (machines list) to ensure operations defaults exist before workflow steps.

## Paid-call prevention

- `FORGEOS_E2E=true`, `AI_*_PROVIDER=deterministic`, `OUTREACH_DELIVERY_PROVIDER=simulation` in acceptance webServer env.
- `attachPaidCallGuard` blocks Abacus/OpenAI HTTP patterns during tests.
- Live Abacus smoke is opt-in via `npm run test:acceptance:live-ai` with `FORGEOS_LIVE_AI=1`.

## Defects fixed (in scope)

| Area | Fix |
| --- | --- |
| URL validation | `normalizeUrl` no longer prefixes `https://` onto existing schemes |
| Settings backup import | `refresh()` after import; expanded `importBackupToDb` stores |
| Demo workflow | Session persistence for ctx/step; navigation steps advance index |
| Demo quotation | Resolve DB product by SKU; require catalog before quote |
| Production orders | Resolve demo product IDs to DB IDs; ensure machine seed on early-return path |
| Cup customizer | Wait for products loading state before empty-catalog UI |
| Command palette | Removed duplicate `nav-settings` React key |
| Seed reliability | `seedOperationsDefaults` when profiles exist but machines missing |

## Unresolved defects

| ID | Severity | Description |
| --- | --- | --- |
| FORGE-ACC-001 | **Resolved in current working tree** | “Repor dados demo” now uses scoped demo reset and preserves operational leads plus outreach drafts; acceptance coverage was updated from known-gap documentation to preservation assertion. |
| FORGE-ACC-002 | **Medium** | `DatabaseClosedError` console noise during backup clear/restore (tests pass; no user-facing failure) |
| FORGE-ACC-003 | **Low** | Some acceptance flows use focused smoke assertions rather than exhaustive CRUD (archive/restore, full inventory movements) — expand in follow-up |

## Artifacts

| Artifact | Location |
| --- | --- |
| HTML report | `qa/acceptance/results/html-report/` |
| Failure screenshots/traces/videos | `qa/acceptance/results/test-results/` (gitignored) |
| Env template | `.env.test.example` |

View report: `npm run test:acceptance:report`

## Production-readiness conclusion

The local IndexedDB MVP passes the automated acceptance suite with deterministic AI and simulated delivery. **Suitable for a controlled pilot** with these constraints: no real auth, no Supabase sync, and live Abacus/email/Smartlead require separate manual verification before production outreach. Demo reset is expected to preserve operational data.

## Commands

```bash
npm run test:acceptance          # full suite (starts dev server on :3001)
npm run test:acceptance:headed   # headed browser
npm run test:acceptance:ui       # Playwright UI mode
npm run test:acceptance:report   # open HTML report
npm run test:acceptance:live-ai  # optional; requires FORGEOS_LIVE_AI=1
```

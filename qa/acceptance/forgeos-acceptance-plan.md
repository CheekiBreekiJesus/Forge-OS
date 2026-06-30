# ForgeOS Acceptance Automation Plan

Generated for branch `codex/forgeos-foundation-app-shell` at repository HEAD.

## Objective

Automate the local MVP acceptance workflow with Playwright under isolated IndexedDB (`forgeos:e2e:acceptance`), deterministic AI, and Smartlead simulation—without paid API calls, real email, or Supabase.

## Existing E2E coverage (pre-acceptance)

| Spec | Coverage |
|------|----------|
| `e2e/local-mvp-workflow.spec.ts` | Demo lead creation, outreach persistence |
| `e2e/outreach-workflow.spec.ts` | Generate/approve/queue/simulate, reapproval, suppression |
| `e2e/module-crud.spec.ts` | Module render smoke, command palette, quick create |
| `e2e/profile-email-branding.spec.ts` | Settings company, locale, login dialogs, copy actions |
| `e2e/cup-customizer.spec.ts` | Customizer navigation, save simulation, onboarding, notifications |

**Gaps addressed by acceptance suite:** consolidated reset helpers, isolated DB, backup/restore, full demo CRM→production chain, CSV import classifications, products/machines/inventory CRUD, responsive layouts, console audit, dead-control audit, npm scripts, HTML report artifacts.

## Test suites

| File | Scope |
|------|-------|
| `00-smoke-and-navigation.spec.ts` | Startup, locale switch, all primary routes, hosted-feature states |
| `01-settings-and-profiles.spec.ts` | Company, user, senders, team, auth placeholders |
| `02-products-machines-inventory.spec.ts` | CRUD, archive/restore, validation |
| `03-leads-import-outreach.spec.ts` | Manual lead, CSV import, outreach, copy, mail links, suppression |
| `04-demo-commercial-flow.spec.ts` | Full demo workflow with mid-run reload |
| `05-customizer-quotation-production.spec.ts` | Customizer, quotation from simulation, production |
| `06-backup-reset-localization.spec.ts` | Backup export/import, demo reset behavior, EN/PT |
| `07-responsive-and-accessibility.spec.ts` | 390/768/1440 viewports on key pages |
| `08-controls-and-console-audit.spec.ts` | Primary control smoke + console error gate |
| `live-ai.spec.ts` | Optional single Abacus call (`FORGEOS_LIVE_AI=1` only) |

## Test data

- Synthetic emails: `*@example.invalid`, `*@example.com`, `*@demo.local`
- CSV fixtures: `e2e/fixtures/leads-*.csv`
- Images: `e2e/fixtures/logo.png`, `product-image.png`, `artwork.png` (1×1 PNG)
- Seed lead `leadops_001` (Rita Ferreira), `leadops_006` (unsubscribed)

## Reset strategy

1. `beforeEach`: `resetAcceptanceState()` — clear localStorage/sessionStorage, delete IndexedDB `forgeos:e2e:acceptance`, reload.
2. Playwright `webServer` sets deterministic AI + simulation delivery + isolated DB name.
3. Single worker (`workers: 1`) — no parallel acceptance runs.

## Mocks / provider policy

- `AI_*_PROVIDER=deterministic` via `playwright.acceptance.config.ts`
- `OUTREACH_DELIVERY_PROVIDER=simulation`
- Request guard blocks `abacus.ai`, OpenAI, Anthropic hosts during acceptance
- No mock of `/api/leadops/generate` — uses real route with deterministic provider

## Expected artifacts

- HTML report: `qa/acceptance/results/html-report/`
- Traces/screenshots/video on failure: `qa/acceptance/results/test-results/`
- Summary: `qa/acceptance/latest-summary.md`
- Dead-control audit: `qa/acceptance/dead-control-audit.md`

## Known limitations

- **Demo reset isolation:** `Repor dados demo` currently calls `repos.reset()` + full reseed, removing all operational records—not selective demo reset. Acceptance documents this as unresolved **High** until product implements scoped reset.
- **Clear All Local Data:** No dedicated Settings button; full clear occurs via backup import (`repos.reset()` before restore) or demo reset.
- **Clipboard assertions:** Best-effort in Chromium; some copy actions verify button visibility only.
- **Live Abacus:** Separate command; never part of CI or `npm run validate`.
- **Cup customizer artwork upload:** Depends on file input in customizer shell; covered where UI exposes controls.

## Optional live-provider test

```bash
FORGEOS_LIVE_AI=1 npm run test:acceptance:live-ai
```

Requires valid `ABACUS_API_KEY` in `.env.local`; makes exactly one generation call via dedicated spec.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run test:acceptance` | Full acceptance suite (starts dev server) |
| `npm run test:acceptance:headed` | Headed browser |
| `npm run test:acceptance:ui` | Playwright UI mode |
| `npm run test:acceptance:report` | Open HTML report |
| `npm run test:acceptance:live-ai` | Optional Abacus smoke |

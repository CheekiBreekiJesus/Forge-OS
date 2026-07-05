# Changelog

All notable changes to ForgeOS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-07-05

### Added

- Local-demo runtime contract (`scripts/demo/`) with dedicated IndexedDB `forgeos:jhgomes:0.2.0-demo`.
- Deterministic demo dataset lifecycle (seed version 5, schema version 13) with reset, backup, and restore.
- Integrated demo walkthrough Playwright suite (`e2e/forgeos-0.2.0-demo.spec.ts`).
- Release validation scripts: `validate:security`, `validate:full`, `validate:release`.
- Settings **About ForgeOS** panel with application, schema, seed, and database metadata.
- Production order creation from approved quotations in the quotations module.

### Changed

- Mobile navigation drawer portals to `document.body` for reliable touch/click on small viewports.
- LeadOps dashboard reloads campaigns when demo data version changes after reset.
- Footer environment label shows **Demo local** in local persistence mode.
- Application footer version reads from `APP_VERSION` constant (synced with `package.json`).

### Fixed

- Stale LeadOps campaign list after demo reset/reseed.
- Integrated workflow B: UI path from approved quote to production order.
- Responsive layout regressions on critical demo routes (0.2.0 audit).

### Security

- Local demo contract clears hosted Supabase, Brevo, and paid AI keys at runtime.
- Email delivery and outreach use simulation providers only in demo mode.

### Excluded from 0.2.0

- Hosted Supabase persistence and OAuth login providers.
- Real email send (Brevo, Outlook Graph).
- Paid AI providers (Abacus, OpenAI).
- Maintenance CMMS operational module (placeholder shell).
- Preview modules: sales orders, molds, quality (navigation shells only).

[0.2.0]: docs/releases/0.2.0.md

# Email Outreach Integration — QA Summary

Updated after MVP integration merge (2026-07-03).

## Operational import (from import-ops)

- Semicolon CSV + XLSX multi-sheet import
- Reusable mapping profiles with sheet-switch fix
- Duplicate review queue and import history
- Lead sendability filter aligned with suppression table
- Private acceptance runner (local, gitignored)

## Send-job foundation (preserved from send-jobs)

- Local simulation queue with bounded batches
- Pause, resume, cancel, retry limits
- Suppression blocks post-queue recipients
- Trusted server routes compile; production auth not wired
- Brevo campaign batches remain disabled

## Combined integration test

`src/application/outreach-import-send-job.integration.test.ts` — synthetic multi-sheet import through campaign approval to simulation send job with suppression check.

## Latest validation counts

- Unit/integration: 235 passed
- E2E: 93 passed, 1 skipped (live AI)
- Acceptance: 50 passed, 1 skipped (live AI)

See `qa/outreach/integration-summary.md` for merge details.

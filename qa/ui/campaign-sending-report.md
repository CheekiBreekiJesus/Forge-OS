# Campaign Sending UI Report

Date: 2026-07-02

## Scope

Campaign detail send-job panel — **local simulation only**.

## Verified Controls

| Control | Status |
|---------|--------|
| Queue simulation job | Working |
| Process next batch | Working |
| Pause (with confirm) | Working |
| Resume | Working |
| Cancel unsent (with confirm) | Working |
| Job counters (status, batch, processed, sent, failed, retry, skipped, remaining) | Working |
| Recipient status table (sanitized email, status, provider, timestamp) | Working |
| Simulation banner | Visible |
| Production incomplete notice | Visible |
| Brevo production button | Absent (correct) |

## Localization

- PT-PT and EN strings present under `leadops.sendJobs`.
- Hardcoded English result strings removed in Composer stabilization.

## Responsive Review

| Viewport | Result |
|----------|--------|
| 390×844 | Panel and controls visible (Playwright) |
| 768×1024 | Not separately audited in this pass |
| 1440×900 | Default dev layout |

## Themes

- Dark: default
- Light: verified in Playwright EN test

## Findings

| Severity | Finding | Status |
|----------|---------|--------|
| Blocker | None | — |
| High | None | — |
| Medium | Tablet-specific layout not manually screenshot-audited | Documented |

## Playwright

`e2e/campaign-send-job-simulation.spec.ts`

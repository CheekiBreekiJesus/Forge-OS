# MAINT-NPM-AUDIT

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Confidence** | Confirmed |
| **Status** | deferred |
| **First seen** | 2026-07-09T08:00Z |
| **Last updated** | 2026-07-09T10:04Z |

## Summary

`npm audit` reports 4 vulnerabilities (2 moderate, 2 high) in transitive dependencies (Playwright SSL cert, uuid via exceljs). Classified as non-blocking in hardening merge report.

## Repair decision

Deferred — dependency audit triage tracked separately; no broad upgrades during maintenance.

# Dependency Cursor Convergence — Baseline

**Branch:** `integration/dependency-security-cursor`  
**Base commit:** `213dc3e` (`chore(supabase): add local development configuration`)  
**Base ref:** `origin/integration/jh-gomes-outreach-supabase-7d2`  
**Worktree:** `Forge-OS-cursor-dependency-convergence`  
**Recorded:** 2026-07-05

## Scope

Dependency-only remediation. No OAuth, login UI, auth callback, tenant membership, or proxy changes.

## Pre-remediation dependency state

| Package | Version | Notes |
|---------|---------|-------|
| `@playwright/test` | 1.53.1 | Transitive `playwright` below GHSA-7mvr-c777-76hp threshold |
| `xlsx` | ^0.18.5 | Direct dependency; high-severity advisories, no fix |

## npm audit (baseline)

```
xlsx *
Severity: high
  Prototype Pollution in sheetJS - GHSA-4r6h-8v6p-xvw6
  SheetJS Regular Expression Denial of Service (ReDoS) - GHSA-5pgg-2g8v-p4x9
No fix available
```

**Summary:** 1 high severity vulnerability (xlsx).

## Source commits for selective port

| Commit | Purpose | Auth/OAuth files |
|--------|---------|------------------|
| `ca12ac3` | Playwright upgrade | None |
| `5ef6630` | Playwright docs | None (skipped — uses missing triage files) |
| `9b06528` | Spreadsheet adapter | None |
| `5925f78` | Remove xlsx, add exceljs | None |
| `d0fd63e` | Parser security tests | None |
| `ee2cc2f` | Parser decision docs | None (reference only) |
| `73a897b` | xlsx remediation docs | None (reference only) |

## Protected areas (must not change)

OAuth, login UI, auth callback, signout, safe redirect, tenant membership, `proxy.ts`, auth migrations, Brevo, sending, cup customizer, inventory, product-import business logic.

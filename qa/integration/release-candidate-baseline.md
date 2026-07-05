# JH Gomes Release Candidate — Baseline

**Date:** 2026-07-05  
**Worktree:** `Forge-OS-release-candidate`  
**Branch:** `integration/jh-gomes-release-candidate`  
**Base:** `origin/integration/jh-gomes-cursor-convergence` @ `64a1ebd`  
**Auth source:** `origin/integration/jh-gomes-auth-activation` @ `4b42cc7`

## Preflight

| Check | Result |
|-------|--------|
| Base HEAD | `64a1ebd` — docs(qa): record cursor final convergence results and auth overlap |
| Auth HEAD | `4b42cc7` — test(auth): validate Supabase activation path |
| Working tree | Clean before merge |
| Credentials in tree | None observed |
| Private customer data | None observed |

## Local runtime (pre-standardization)

| Tool | Version |
|------|---------|
| Node | v25.1.0 |
| npm | 11.6.2 |

Target runtime for CI and lockfile: **Node 22** with npm from `node:22-bookworm` (verified `10.9.8`).

## Known CI failures (pre-repair)

1. **Node engine mismatch:** Supabase packages require Node `>=22`; workflows used Node 20.
2. **Lockfile gap:** `npm ci` on Linux reports missing `@emnapi/runtime@1.11.2` and `@emnapi/core@1.11.2` (independent of engine warning).

## Branch contents at baseline

- Cursor convergence: cup customizer, table density/overlays, ExcelJS spreadsheet adapter, Playwright 1.61.1, xlsx removed.
- Auth activation: not yet merged at baseline capture; merge planned as first integration step.

## Protected worktrees (do not edit)

`Forge-OS-auth-activation`, `Forge-OS-auth-membership`, `Forge-OS-cursor-final-convergence`, `Forge-OS-cursor-feature-convergence`, `Forge-OS-cursor-dependency-convergence`, `Forge-OS-supabase-7d2-integration`, `Forge-OS-product-import`, `Forge-OS-inventory`.

## Policy

- Do not apply migrations to hosted Supabase.
- Do not add credentials or send email.
- Do not make paid API calls.

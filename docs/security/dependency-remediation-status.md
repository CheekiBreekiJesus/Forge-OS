# Dependency Remediation Status

**Last updated:** 2026-07-05  
**Active branch:** `integration/jh-gomes-cursor-convergence` (merged from `integration/dependency-security-cursor` @ `bd3f477`)

## Resolved

| Advisory | Package | Remediation | Branch commit |
|----------|---------|-------------|---------------|
| GHSA-7mvr-c777-76hp (Playwright SSL) | `@playwright/test` → `playwright@1.61.1` | Upgrade to 1.61.1 | `fcc5e85` |
| GHSA-4r6h-8v6p-xvw6 (xlsx prototype pollution) | `xlsx@0.18.5` | Removed; ExcelJS adapter | `516487b` |
| GHSA-5pgg-2g8v-p4x9 (xlsx ReDoS) | `xlsx@0.18.5` | Removed; ExcelJS adapter | `516487b` |

## Accepted residual

| Advisory | Package | Path | Decision |
|----------|---------|------|----------|
| GHSA-w5hq-g745-h8pq | `uuid@8.3.2` | `exceljs@4.4.0` → `uuid` | Documented accepted risk; no override |

## Current audit snapshot

```
0 high, 2 moderate (uuid/exceljs transitive)
```

## Related documents

- `qa/security/dependency-cursor-convergence-baseline.md`  
- `qa/security/dependency-cursor-convergence-result.md`  
- `qa/security/dependency-cursor-convergence-audit.md`  
- `docs/security/spreadsheet-parser-decision.md`  
- `qa/performance/exceljs-bundle-review.md`

## Out of scope (this branch)

OAuth foundation, login UI, auth callback, tenant membership, Supabase browser client, `proxy.ts`, auth migrations.

## Merge status

Merged into `integration/jh-gomes-cursor-convergence` @ `c09c124` (2026-07-05). Pending auth activation merge before production integration — **not** into OAuth remediation branches directly.

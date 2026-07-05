# Dependency Remediation Status

**Last updated:** 2026-07-05  
**Active branch:** `integration/jh-gomes-release-candidate` (includes `integration/jh-gomes-cursor-convergence` and auth activation)

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

## Out of scope (external deployment)

Hosted Supabase migration application, OAuth provider secrets, and production Brevo delivery remain external operator actions.

## Merge status

Merged into `integration/jh-gomes-release-candidate` through Cursor convergence and auth activation (`18b1480`). Node 22 + npm 10.9.8 standardized; lockfile regenerated for Linux CI.

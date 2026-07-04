# Dependency Cursor Convergence — Audit

**Branch:** `integration/dependency-security-cursor`  
**Base:** `213dc3e`  
**Recorded:** 2026-07-05

## Audit before remediation

```
xlsx * — HIGH (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9) — no fix available
@playwright/test 1.53.1 — transitive playwright below GHSA-7mvr-c777-76hp threshold
Total: 1 high, 0 moderate
```

## Audit after remediation

```
uuid <11.1.1 — MODERATE (GHSA-w5hq-g745-h8pq) via exceljs@4.4.0 → uuid@8.3.2
Total: 0 high, 2 moderate (exceljs + uuid entries)
```

Verified:

```bash
npm ls xlsx          # (empty)
npm ls exceljs       # exceljs@4.4.0
npm ls @playwright/test playwright playwright-core  # all 1.61.1
```

## UUID moderate advisory triage

| Field | Value |
|-------|-------|
| Installed version | `uuid@8.3.2` |
| Dependency path | `exceljs@4.4.0` → `uuid@8.3.2` |
| Advisory | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) — missing buffer bounds check in v3/v5/v6 when `buf` is provided |
| CWE | CWE-787, CWE-1285 |
| CVSS | 7.5 (moderate classification in npm audit) |
| Runtime reachability | **Not browser-reachable.** uuid is used internally by ExcelJS for workbook/stream identifiers during server-side or deferred client parse. ForgeOS does not call uuid APIs directly and does not pass attacker-controlled buffers to uuid v3/v5/v6 functions. |
| Workbook input influence | **No.** User XLSX content does not flow into uuid buffer APIs. |
| Safe fixed version | `uuid@11.1.1+` |
| Override compatibility | `npm overrides` to `uuid@11.x` is **not** applied — ExcelJS 4.4.0 pins uuid ^8.3.0; forcing uuid 11 without upstream ExcelJS release risks runtime breakage. `npm audit fix --force` would downgrade exceljs to 3.4.0 (breaking, removes security adapter target). |

### UUID decision

**Documented accepted residual risk.** No override added merely for a cleaner audit report. Revisit when ExcelJS publishes a uuid 11-compatible release or ForgeOS migrates to an alternative adapter backend.

## Playwright advisory

GHSA-7mvr-c777-76hp (SSL certificate verification) — **resolved** at `playwright@1.61.1`.

## xlsx advisory

GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9 — **resolved** by removing `xlsx@0.18.5`.

## Protected areas

No changes to OAuth, login UI, auth callback, signout, safe redirect, tenant membership, `proxy.ts`, auth migrations, Brevo, sending, cup customizer, inventory, or product-import business logic.

## Approval decision

**APPROVED WITH CONDITIONS**

### Conditions

1. **Residual uuid moderate** — accepted with documented triage; monitor ExcelJS releases.  
2. **E2E campaign 401 failures** — four tests on integration base (`campaign-release-checkpoint`, `campaign-review-manual-send`, `campaign-templates-drafts`, `lead-segmentation`) fail with unauthorized API responses; pre-existing on `213dc3e`, not introduced by this branch. Resolve in Supabase auth integration work before production merge.  
3. **Merge order** — merge into integration base only after dependency review; do not merge OAuth remediation branches into this branch.

### Merge readiness (dependency scope)

- Zero high-severity Playwright or xlsx findings  
- LeadOps import preserved  
- ExcelJS lazy-loaded (separate ~909 KiB async chunk)  
- `npm run validate` passes

# Spreadsheet Parser Integration Benchmark

Date: 2026-07-04  
Branch: `integration/dependency-security-remediation`  
Environment: Windows dev machine, Vitest 4.1.8, synthetic workbooks only

## Method

Benchmarks run via `spreadsheet-parser.test.ts` (`parses representative row counts within practical bounds`) and security-boundary tests. No customer spreadsheets used.

## Parse duration (adapter + ExcelJS)

| Workbook profile | Rows | Result | Bound |
|------------------|------|--------|-------|
| Representative import | 271 | Pass | < 5 s |
| Maximum allowed | 5,000 | Pass | < 20 s |

## Security boundary cases

| Case | Behavior |
|------|----------|
| Malformed archive | `malformed_archive` error |
| Excessive rows (>5,000) | `too_many_rows` error |
| Excessive columns (>256) | Truncated + warning |
| Hidden sheets | Parsed; warning emitted |
| Formula cells | Display value only; warning |
| Long strings (5,000 chars) | Parsed without HTML output |
| Prototype-pollution headers | Keys filtered in `safeObjectFromRow` |
| Encrypted workbook | Rejected |

## UI responsiveness

E2E lead import wizard completes CSV and XLSX flows without timeout at default Playwright 60 s spec limit. No browser lockup observed in synthetic tests.

## Memory

Formal heap profiling not run. ExcelJS parse of 5,000-row synthetic workbook completes within test bounds without OOM in Vitest Node environment.

## Conclusion

Performance meets existing ForgeOS import thresholds. No regression vs documented xlsx-remediation branch bounds.

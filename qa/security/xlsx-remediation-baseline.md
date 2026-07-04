# xlsx Remediation Baseline

Date: 2026-07-04  
Branch: `fix/xlsx-security-remediation`  
Base commit: `24c7f3d` (`docs(security): triage dependency audit findings`)

## Preflight

| Check | Result |
|-------|--------|
| Worktree | `Forge-OS-xlsx-remediation` |
| Branch | `fix/xlsx-security-remediation` |
| Working tree | Clean |
| Base commit | `24c7f3d` |

## Production dependency (before)

```
xlsx@0.18.5
```

## npm audit (before)

3 high-severity findings:

| Package | Advisory |
|---------|----------|
| `xlsx@0.18.5` | GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9 |
| `playwright@1.53.1` | GHSA-7mvr-c777-76hp |
| `@playwright/test@1.53.1` | GHSA-7mvr-c777-76hp (via `playwright`) |

Playwright remediation is tracked on separate branch `fix/playwright-audit-remediation` (not merged here).

## Repository `xlsx` import inventory

| File | Usage |
|------|-------|
| `src/features/leadops/import-file-parser.ts` | `XLSX.read`, `workbook.SheetNames`, `XLSX.utils.sheet_to_json` — **production client path** |
| `src/features/leadops/import-file-parser.test.ts` | `XLSX.utils.book_new`, `aoa_to_sheet`, `book_append_sheet`, `XLSX.write` — test fixtures |
| `src/application/lead-import.integration.test.ts` | Synthetic workbook generation |
| `src/application/outreach-import-send-job.integration.test.ts` | Synthetic workbook generation |
| `scripts/data-preparation/profile-lead-files.mjs` | `XLSX.read`, `sheet_to_json` — dev profiling script |

## Production import chain

```
leadops-import-wizard.tsx ("use client")
  → lead-import-service.ts
    → import-file-parser.ts
      → xlsx (direct)
```

## Product import

No separate product spreadsheet parser shares `xlsx` in this repository. Product catalog import UI is not wired to `xlsx`.

## Supported behavior to preserve

- XLSX import (client-side)
- Multi-sheet listing and selection
- Displayed cell values (`raw: false` semantics)
- Leading zeros when stored as text
- Portuguese characters
- CSV semicolon/comma detection (unchanged — not xlsx)
- Formulas not executed; HTML disabled
- 5 MB / 5,000 row limits
- Legacy `.xls` only in dev profiler (not production wizard `accept` list)

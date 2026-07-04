# Dependency Integration Audit

Date: 2026-07-04  
Branch: `integration/dependency-security-remediation`

## Before integration (Playwright-only base @ `5ef6630`)

| Severity | Count | Packages |
|----------|-------|----------|
| High | 1 | `xlsx@0.18.5` |
| Moderate | 0 | — |

Playwright GHSA-7mvr-c777-76hp: **absent** (`@playwright/test@1.61.1`).

## After integration (trial merge + lazy load)

| Severity | Count | Packages |
|----------|-------|----------|
| High | 0 | — |
| Moderate | 2 | `uuid@8.3.2` (via `exceljs@4.4.0`) |

### Resolved advisories

| Advisory | Package | Status |
|----------|---------|--------|
| GHSA-7mvr-c777-76hp | `playwright` / `@playwright/test` | Cleared (1.61.1) |
| GHSA-4r6h-8v6p-xvw6 | `xlsx` | Cleared (package removed) |
| GHSA-5pgg-2g8v-p4x9 | `xlsx` | Cleared (package removed) |

### Residual findings

| Advisory | Package | Path | Decision |
|----------|---------|------|----------|
| GHSA-w5hq-g745-h8pq | `uuid@8.3.2` | `exceljs@4.4.0` → `uuid` | **Accepted residual risk** (see integration result) |

## Dependency graph (final)

```
forge-os
├── exceljs@4.4.0 (dependencies)
│   └── uuid@8.3.2
└── @playwright/test@1.61.1 (devDependencies)
    └── playwright@1.61.1
        └── playwright-core@1.61.1

xlsx: (empty — not installed)
```

## Risk classification

| Finding | Runtime production | Browser bundled | Untrusted input reachability |
|---------|-------------------|-----------------|------------------------------|
| Playwright SSL | No | No | No |
| xlsx advisories | No (removed) | No | N/A |
| uuid moderate | Indirect (ExcelJS internal) | Yes, in async ExcelJS chunk | **No** — ExcelJS uses `uuid.v4()` only; advisory targets v3/v5/v6 with user-supplied buffer |

## Development vs production risk

| Area | Assessment |
|------|------------|
| Production runtime | **Low** — no high findings; uuid path not attacker-controlled |
| Development / CI | **Low** — Playwright remediated |

## npm audit commands

```bash
npm ci
npm audit          # 2 moderate
npm ls xlsx        # empty
npm ls exceljs     # 4.4.0
npm ls uuid        # 8.3.2 via exceljs
```

Do **not** run `npm audit fix --force` (proposes downgrading exceljs to 3.4.0).

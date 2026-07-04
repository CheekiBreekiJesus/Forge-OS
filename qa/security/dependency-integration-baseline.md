# Dependency Integration Baseline

Date: 2026-07-04  
Worktree: `Forge-OS-dependency-integration`  
Branch: `integration/dependency-security-remediation`  
Starting commit: `5ef6630` (`docs(security): record Playwright remediation`)

## Preflight

| Check | Result |
|-------|--------|
| Worktree | `C:\Users\J35U5\Desktop\VS Code\Forge-OS-dependency-integration` (created from `origin/fix/playwright-audit-remediation`) |
| Branch | `integration/dependency-security-remediation` |
| Base contains Playwright remediation (`5ef6630`) | Yes |
| Spreadsheet source branch exists (`origin/fix/xlsx-security-remediation` @ `73a897b`) | Yes |
| Working tree at baseline | Clean |
| Credentials / private data in tree | None observed |

## Dependency graph (pre-spreadsheet merge)

| Package | Version | Role |
|---------|---------|------|
| `@playwright/test` | `1.61.1` | dev — E2E |
| `playwright` | `1.61.1` | transitive |
| `playwright-core` | `1.61.1` | transitive |
| `xlsx` | `0.18.5` | production — lead import (vulnerable) |

## npm audit (pre-spreadsheet merge)

| Severity | Count | Packages |
|----------|-------|----------|
| High | 1 | `xlsx@0.18.5` (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9) |
| Moderate | 0 | — |

Playwright GHSA-7mvr-c777-76hp already cleared on this branch.

## Expected merge risks

| Risk | Mitigation |
|------|------------|
| `package.json` Playwright version downgrade from spreadsheet branch | Preserve `^1.61.1` from integration base |
| Documentation conflict (`dependency-remediation-plan.md`, `npm-audit-triage.md`) | Merge both remediation histories |
| ExcelJS client bundle weight on `/leadops` | Dynamic import + bundle analysis |
| Transitive `uuid` moderate via ExcelJS | Classify; do not override without evidence |
| Parser parity / LeadOps regression | Unit, integration, targeted E2E, acceptance import spec |

## Related branches

| Branch | Head | Role |
|--------|------|------|
| `origin/fix/playwright-audit-remediation` | `5ef6630` | Integration base |
| `origin/fix/xlsx-security-remediation` | `73a897b` | Spreadsheet merge source |
| `origin/chore/dependency-audit-triage` | `24c7f3d` | Original triage |

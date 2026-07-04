# Playwright Remediation Baseline

Date: 2026-07-04  
Branch: `fix/playwright-audit-remediation`  
Base commit: `24c7f3d` (`docs(security): triage dependency audit findings`)

## Preflight

| Check | Result |
|-------|--------|
| Worktree | `Forge-OS-playwright-remediation` |
| Branch | `fix/playwright-audit-remediation` |
| Working tree | Clean |
| Credentials / private data | None observed |

## Playwright versions (before)

```
@playwright/test@1.53.1
└── playwright@1.53.1
```

(`next@16.2.9` also lists `@playwright/test@1.53.1` as optional peer — deduped.)

## npm audit (before)

3 high-severity findings:

| Package | Advisory | Severity |
|---------|----------|----------|
| `playwright@1.53.1` | GHSA-7mvr-c777-76hp | High |
| `@playwright/test@1.53.1` | GHSA-7mvr-c777-76hp (via `playwright`) | High |
| `xlsx@0.18.5` | GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9 | High |

## Baseline validation

| Command | Result |
|---------|--------|
| `npm ci` | Pass (468 packages) |
| `npm run typecheck` | Pass |
| `npm test` | Pass — 299 passed, 3 skipped |
| `npm run build` | Recorded at remediation start |

## Target upgrade

- `@playwright/test`: `1.53.1` → `1.61.1`
- Transitive `playwright`: must be ≥ `1.55.1`

Raw logs: `qa/security/tmp/` (gitignored)

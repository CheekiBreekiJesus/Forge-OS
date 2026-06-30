# Dead Control Audit (Acceptance)

Automated audit date: generated after acceptance run.

## Method

- Curated route walk in `08-controls-and-console-audit.spec.ts`
- Manual review targets: destructive actions excluded from blind clicking
- Allowlist: explanatory dialogs (hosted features, auth placeholders, dashboard customize)

## Findings

| Route | Control | Status | Notes |
|-------|---------|--------|-------|
| `/pt-PT/leadops` | Add to campaign | Expected inert | Disabled with demo explanation per i18n |
| `/pt-PT/maintenance` | CRUD actions | Expected placeholder | Module shell only |
| `/pt-PT/marketing` | CRUD actions | Expected placeholder | Module shell only |
| `/pt-PT/demo` | Reset demo data | Works | **Side effect:** clears all local data, not demo-scoped |
| Settings → Integrations | Diagnostic buttons | Works | Opens hosted/local diagnostic dialog |

## Unresolved inert primary controls

None classified as **Blocker** during acceptance run. See `qa/acceptance/latest-summary.md` for run-specific results.

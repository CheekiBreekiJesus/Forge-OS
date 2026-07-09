# CI release gates (ForgeOS 0.2.0 hardening)

## Summary

CI is split into two jobs so `main` gets fast, deterministic gating while longer Playwright coverage stays on integration and release branches.

## Workflow: `.github/workflows/ci.yml`

### Triggers

| Event | Branches |
| --- | --- |
| `pull_request` | All branches |
| `push` | `main`, `release/**`, `integration/**` |

Concurrency uses `cancel-in-progress: true` per workflow ref.

### `validate-core`

Runs on every workflow trigger.

Steps:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run build`

This job gates merges and pushes to `main` (configure as a required status check in branch protection).

### `validate-e2e`

Runs only when:

- Push to `release/**` or `integration/**`, or
- Pull request whose **base** branch is `release/**` or `integration/**`

Depends on `validate-core`. Runs a Playwright subset:

- `e2e/outreach-workflow.spec.ts`
- `e2e/campaign-send-job-simulation.spec.ts`
- `e2e/acceptance/03-leads-import-outreach.spec.ts`

E2E env vars (`FORGEOS_E2E`, deterministic AI providers, simulation delivery) match the previous single-job workflow.

## Cross-platform Playwright prep

`package.json` `pretest:e2e` and `pretest:acceptance` call:

```bash
node scripts/qa/prepare-playwright-tests.mjs --port <port>
```

Ports: `3012` (e2e), `3001` (acceptance). On Windows the script delegates to the existing PowerShell helper; on Linux/macOS it checks the port is free.

## Branch expectations

| Branch pattern | `validate-core` | `validate-e2e` |
| --- | --- | --- |
| `main` (PR / push) | Yes | No |
| `integration/**` | Yes | Yes |
| `release/**` | Yes | Yes |
| Feature PR → `main` | Yes | No |
| Feature PR → `integration/**` | Yes | Yes |

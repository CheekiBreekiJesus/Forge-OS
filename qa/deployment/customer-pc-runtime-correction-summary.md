# Customer PC runtime correction summary

**Date:** 2026-07-03  
**Branch:** `feat/customer-pc-local-runtime`  
**Starting commit:** `6e0c69f` — docs(deployment): add JH Gomes Portuguese runbook

## Objective

Correct PID safety, deployment-branch handling, environment flag compatibility, daily build performance, and complete blocked E2E validation before integration.

## Corrections delivered

### 1. Process identity (PID safety)

**Defect:** `Stop-ForgeOS.ps1` trusted only a numeric PID file. Windows PID reuse could terminate an unrelated Node process.

**Fix:** Replaced bare PID files with structured runtime metadata (`.customer-pc/runtime/forgeos-{mode}.runtime.json`) containing PID, mode, repository root, Node executable, Next.js CLI signature, expected port, process start time, ForgeOS commit, and metadata creation time.

Stop now verifies process existence, start time, executable, command line, repository path (via Next.js CLI under repo), and port 3000 listener ownership. On mismatch, ForgeOS refuses to terminate and prints port-conflict diagnostics.

### 2. Deployment branch

**Defect:** `Update-ForgeOS.ps1` defaulted to `feat/customer-pc-local-runtime`.

**Fix:** Added `FORGEOS_UPDATE_BRANCH=deploy/jh-gomes-local` to the customer template. Update script reads configured branch, displays it, rejects blank names, requires confirmation on branch changes, supports `-Branch` override for development, and records last successful branch.

### 3. Environment flags

**Defect:** Customer template used deprecated `OUTLOOK_LOCAL_SEND_ENABLED` and lacked Outlook Graph alignment.

**Fix:** Template now includes `OUTLOOK_GRAPH_ENABLED=false`, `OUTLOOK_LIVE_SEND_ENABLED=false`, `OUTLOOK_TEST_RECIPIENTS=`, Microsoft OAuth placeholders, and `FORGEOS_LOCAL_ENCRYPTION_KEY=`. Removed deprecated flag.

### 4. Daily start performance

**Defect:** `Start-ForgeOS-Local.ps1` ran `npm run build` on every start.

**Fix:** Setup and update run builds. Daily start reuses `.next` when `production-build.json` matches the current commit. `-Rebuild` forces rebuild. Development mode unchanged.

### 5. E2E port conflict

**Defect:** E2E blocked when port 3002 was occupied.

**Fix:** Added `pretest:e2e` (`scripts/qa/resolve-e2e-port.ps1`) and isolated port `3012` (avoids conflict with other local worktrees on `3002`). Stops only a prior ForgeOS E2E server from this repository. Unrelated processes are never terminated automatically.

## Validation

| Check | Result |
|-------|--------|
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm test` | Pass |
| `npm run test:customer-pc` | Pass |
| `npm run test:customer-pc:smoke` | Pass |
| `npm run test:e2e` | Pass |
| `npm run test:acceptance` | Pass |
| `npm run build` | Pass |
| `npm run validate` | Pass |

## Commits

1. `fix(deployment): verify ForgeOS process identity before stop`
2. `fix(deployment): configure stable customer update branch`
3. `fix(deployment): align local Outlook feature flags`
4. `perf(deployment): reuse valid local production build`
5. `test(deployment): complete Windows runtime validation`

## Remaining limitations

- `deploy/jh-gomes-local` branch does not exist on remote until post-integration cutover; use `-Branch` override for pre-integration testing.
- Outlook Graph send is not implemented on this branch; flags are disabled placeholders only.
- Process identity verification depends on Windows WMI/CIM (`Win32_Process`); behaviour on non-Windows platforms is out of scope.
- Build freshness uses a local manifest file, not Next.js internal build IDs.
- Operator must still resolve true port conflicts manually when metadata is unsafe.

## Related documents

- [Installation](../docs/deployment/customer-pc-installation.md)
- [Architecture](../docs/deployment/customer-pc-local-architecture.md)
- [Security review](customer-pc-security-review.md)

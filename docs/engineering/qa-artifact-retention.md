# QA Artifact Retention Policy

**Effective:** 2026-07-05  
**Scope:** `qa/**`, `docs/checkpoints/**`, generated local output

No files are moved or deleted in this branch. This policy guides post-convergence cleanup.

---

## KEEP TRACKED (git)

| Category | Examples | Reason |
|----------|----------|--------|
| Security findings | `qa/security/outreach-send-jobs.md`, `qa/security/outreach-public-endpoints.md` | Audit trail |
| Release checkpoints | `docs/checkpoints/email-outreach-status.md` | Integration evidence |
| Migration evidence | `qa/outreach/step-7d1-baseline.md` | Hosted runtime proof |
| Acceptance summaries | `qa/acceptance/forgeos-acceptance-plan.md` | Test strategy |
| Current integration result | `qa/outreach/integration-summary.md` | Merge record |
| Repository hygiene audits | `qa/repository/*.md` | Canonical inventories |
| Deployment security | `qa/deployment/customer-pc-security-review.md` | Risk record |

---

## GENERATE / GITIGNORE (local only)

| Category | Path pattern | Reason |
|----------|--------------|--------|
| Screenshots | `qa/**/screenshots/`, `*.png` in qa | Large, ephemeral |
| Raw logs | `qa/reports/*.log`, Playwright traces | Transient |
| Repeated local baselines | Re-runs of same baseline name | Noise |
| Temporary agent reports | `qa/reports/latest-health.json`, `qa/reports/next-codex-task.md` | Already gitignored |
| Transient performance output | Profiler captures | Not reproducible |
| Playwright HTML reports | `qa/acceptance/results/html-report/` | Regenerated |

**Verify `.gitignore` includes:** `qa/reports/latest-health.json`, `qa/acceptance/results/`, `.customer-pc/logs/`

---

## ARCHIVE (move to `docs/archive/qa/` post-convergence)

| Category | Examples | When |
|----------|----------|------|
| Superseded integration reports | `qa/outreach/step-1-baseline.md` through `step-6-baseline.md` | After final release checkpoint |
| Old recovery checkpoints | `qa/outreach/step-7-recovery-baseline.md` | After 7d2 stable |
| Prior-agent intermediate summaries | `qa/outreach/latest-summary.md` (superseded copies) | After new summary written |
| UI exploration reports | `qa/ui/email-outreach-report.md` (if duplicated) | After module stable |
| Customer-PC runtime baselines | `qa/deployment/customer-pc-runtime-baseline.md` | If SaaS path chosen |

---

## Retention durations (recommended)

| Type | Duration |
|------|----------|
| Security findings | Permanent (tracked) |
| Release checkpoint | Permanent until superseded by new checkpoint |
| Step baselines | Archive 90 days after release tag |
| UI exploration reports | Archive 60 days after feature merge |
| Local generated output | Delete on next `npm run agent:health` |

---

## `docs/checkpoints/` policy

- One checkpoint file per major integration merge.
- Do not update old checkpoints — create new dated file.
- Link from `docs/CURRENT_STATE.md` when checkpoint supersedes narrative.

---

## Audit inventory (2026-07-05)

**Tracked baseline/summary/report files:** 40 under `qa/`

| Directory | Files | Recommendation |
|-----------|------:|----------------|
| `qa/outreach/` | 18 | Keep integration-summary; archive step-N baselines later |
| `qa/ui/` | 8 | Archive after UI convergence |
| `qa/security/` | 2 | Keep |
| `qa/deployment/` | 4 | Archive customer-PC if experiment ends |
| `qa/inventory/` | 3 | Keep until inventory merges |
| `qa/acceptance/` | 3 | Keep plan; gitignore HTML report |
| `qa/customizer/` | 1 | Keep until cup merge |
| `qa/pilot/` | 1 | Archive after pilot ends |
| `qa/repository/` | 8 | Keep (canonical) |

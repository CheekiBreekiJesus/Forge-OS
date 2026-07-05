# Duplicate Document Map

**Audit date:** 2026-07-05  
**Action:** Recommendations only — no deletions in this branch.

---

## Group 1: Manual send documentation

| File | Content focus |
|------|---------------|
| `docs/email-outreach/manual-send.md` | MVP sender identity, approval, snapshots |
| `docs/email-outreach/manual-sending.md` | Gmail/Outlook handoff, external compose, duplicate protection |

**Canonical:** Keep **both** — they cover different layers (sender setup vs external compose workflow).

| Action | File |
|--------|------|
| Canonical | `manual-send.md` + `manual-sending.md` (cross-link each other) |
| Merge | None — complementary |
| Archive later | None |
| Delete later | None |
| Link updates | Add reciprocal links in both headers (post-convergence) |

---

## Group 2: Provider architecture / foundation / setup

| File | Era |
|------|-----|
| `docs/email-outreach/provider-architecture.md` | Current abstraction design |
| `docs/email-outreach/provider-foundation-plan.md` | Step-by-step implementation plan |
| `docs/email-outreach/provider-setup.md` | Operator setup guide |
| `docs/email-outreach/brevo-setup.md` | Brevo-specific setup |
| `docs/email-outreach/brevo-webhooks.md` | Brevo webhooks |

**Canonical:** `provider-architecture.md` (design) + `brevo-setup.md` (operations)

| Action | File |
|--------|------|
| Canonical | `provider-architecture.md`, `brevo-setup.md`, `provider-setup.md` |
| Merge | Fold `provider-foundation-plan.md` checklist into `provider-setup.md` |
| Archive | `provider-foundation-plan.md` |
| Delete later | After merge confirmed |
| Link updates | `integration-status.md`, `CURRENT_STATE.md` |

---

## Group 3: Tenant membership (auth vs outreach)

| File | Scope |
|------|-------|
| `docs/email-outreach/tenant-membership.md` | Outreach-specific membership rules |
| `docs/auth/` (if present) | Platform auth |
| `docs/email-outreach/production-authentication.md` | Production auth adapter |

**Canonical:** `docs/email-outreach/production-authentication.md` for outreach path; future `docs/auth/tenant-membership.md` for platform.

| Action | File |
|--------|------|
| Canonical | `production-authentication.md` |
| Merge | Outreach tenant rules into auth doc after auth branch merges |
| Archive | None yet |
| Link updates | `AGENTS.md`, auth activation docs |

---

## Group 4: Lead import plan vs implementation

| File | Type |
|------|------|
| `docs/email-outreach/lead-import-plan.md` | Plan |
| `docs/email-outreach/lead-import.md` | Implementation |
| `docs/email-outreach/import-mapping-profiles.md` | Feature detail |

**Canonical:** `lead-import.md`

| Action | File |
|--------|------|
| Archive | `lead-import-plan.md` |
| Keep active | `lead-import.md`, `import-mapping-profiles.md` |

---

## Group 5: Current state vs checkpoints

| File | Scope |
|------|-------|
| `docs/CURRENT_STATE.md` | Base branch checkpoint |
| `docs/checkpoints/email-outreach-status.md` | Branch merge snapshot |
| `docs/email-outreach/integration-status.md` | MVP integration merge |
| `qa/outreach/integration-summary.md` | QA evidence |

**Canonical:** `docs/CURRENT_STATE.md` only for "what is on base now"

| Action | File |
|--------|------|
| Canonical | `CURRENT_STATE.md` |
| Historical | `checkpoints/*`, `integration-status.md`, `qa/outreach/*-summary.md` |
| Link updates | README, AGENTS |

---

## Group 6: Customer-PC deployment variants

| File |
|------|
| `docs/deployment/customer-pc-installation.md` |
| `docs/deployment/customer-pc-local-architecture.md` |
| `docs/deployment/customer-pc-update-and-rollback.md` |
| `docs/deployment/jh-gomes-local-quick-start-pt.md` |
| `docs/deployment/jh-gomes-local-troubleshooting-pt.md` |
| `.env.customer.local.example` |

**Canonical:** `customer-pc-installation.md` + `jh-gomes-local-quick-start-pt.md`

| Action | File |
|--------|------|
| Archive (later) | Entire customer-PC experimental set after SaaS path confirmed |
| Merge | Troubleshooting into quick-start appendix |
| Keep | `.env.customer.local.example` until archive |

---

## Group 7: AI startup prompts

| File |
|------|
| `docs/ai-context/09-codex-startup-prompt.md` |
| `CODEX_START_NOW_PROMPT.md` |
| `docs/ai-context/10-cleanup-checklist.md` |

**Canonical:** `AGENTS.md` §9 reading list

| Action | File |
|--------|------|
| Archive | All three |
| Delete later | `CODEX_START_NOW_PROMPT.md` (root clutter) |

---

## Group 8: Send-job documentation cluster

| File |
|------|
| `docs/email-outreach/send-job-persistence.md` |
| `docs/email-outreach/send-job-server-mutations.md` |
| `docs/email-outreach/send-job-server-mutations-plan.md` |
| `docs/email-outreach/send-job-recovery-plan.md` |
| `docs/email-outreach/step-7d1-runtime-plan.md` |

**Canonical:** `send-job-server-mutations.md` + `send-job-persistence.md`

| Action | File |
|--------|------|
| Archive | `*-plan.md`, `*-recovery-plan.md`, `step-7d1-runtime-plan.md` |
| Keep active | Implementation docs |

---

## Group 9: Recovery / audit root files

| File | Location |
|------|----------|
| `FORGEOS_RECOVERY_AUDIT.md` | Untracked in `Forge-OS` worktree |
| `qa/outreach/step-7-recovery-baseline.md` | Tracked |

**Canonical:** `docs/CURRENT_STATE.md` + release checkpoint (future)

| Action | File |
|--------|------|
| Archive | `FORGEOS_RECOVERY_AUDIT.md` content into `docs/checkpoints/` or delete if duplicate |
| Keep | `qa/outreach/step-7-recovery-baseline.md` as evidence |

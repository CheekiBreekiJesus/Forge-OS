# Document Status Registry

**Last updated:** 2026-07-05

## Status definitions

| Status | Meaning |
|--------|---------|
| **CANONICAL** | Authoritative; keep current with code |
| **ACTIVE** | Living module doc; update when module changes |
| **HISTORICAL_CHECKPOINT** | Point-in-time snapshot; do not update unless archiving |
| **SUPERSEDED** | Replaced by another doc; archive later |
| **GENERATED_EVIDENCE** | QA/output; retention policy applies |
| **PLANNED** | Reserved or not yet populated |

---

## Root and top-level

| File | Status |
|------|--------|
| `AGENTS.md` | CANONICAL |
| `README.md` | CANONICAL |
| `CODEX_START_NOW_PROMPT.md` | SUPERSEDED |
| `docs/CURRENT_STATE.md` | CANONICAL |
| `docs/README.md` | CANONICAL |
| `docs/DOCUMENT_STATUS.md` | CANONICAL |

## Engineering

| File | Status |
|------|--------|
| `docs/engineering/agent-privacy-policy.md` | ACTIVE |
| `docs/engineering/qa-artifact-retention.md` | CANONICAL |
| `docs/engineering/repository-cleanup-roadmap.md` | CANONICAL |

## AI context (historical pack)

| File | Status |
|------|--------|
| `docs/ai-context/00-project-brief.md` | HISTORICAL_CHECKPOINT |
| `docs/ai-context/01-product-vision.md` | HISTORICAL_CHECKPOINT |
| `docs/ai-context/02-current-architecture.md` | SUPERSEDED |
| `docs/ai-context/03-domain-knowledge.md` | HISTORICAL_CHECKPOINT |
| `docs/ai-context/04-decisions-log.md` | HISTORICAL_CHECKPOINT |
| `docs/ai-context/05-roadmap.md` | HISTORICAL_CHECKPOINT |
| `docs/ai-context/06-data-model-draft.md` | HISTORICAL_CHECKPOINT |
| `docs/ai-context/07-ui-ux-direction.md` | ACTIVE |
| `docs/ai-context/08-open-questions.md` | HISTORICAL_CHECKPOINT |
| `docs/ai-context/09-codex-startup-prompt.md` | SUPERSEDED |
| `docs/ai-context/10-cleanup-checklist.md` | SUPERSEDED |
| `docs/ai-context/11-operational-foundation.md` | HISTORICAL_CHECKPOINT |

## Architecture

| File | Status |
|------|--------|
| `docs/architecture/local-mvp-persistence.md` | SUPERSEDED |

## Checkpoints

| File | Status |
|------|--------|
| `docs/checkpoints/email-outreach-status.md` | HISTORICAL_CHECKPOINT |

## Email outreach (selected)

| File | Status |
|------|--------|
| `docs/email-outreach/README.md` | ACTIVE |
| `docs/email-outreach/integration-status.md` | HISTORICAL_CHECKPOINT |
| `docs/email-outreach/manual-send.md` | ACTIVE |
| `docs/email-outreach/manual-sending.md` | ACTIVE |
| `docs/email-outreach/provider-architecture.md` | ACTIVE |
| `docs/email-outreach/provider-foundation-plan.md` | SUPERSEDED |
| `docs/email-outreach/provider-setup.md` | ACTIVE |
| `docs/email-outreach/tenant-membership.md` | ACTIVE |
| `docs/email-outreach/lead-import-plan.md` | SUPERSEDED |
| `docs/email-outreach/lead-import.md` | ACTIVE |
| `docs/email-outreach/production-authentication.md` | ACTIVE |

## Deployment

| File | Status |
|------|--------|
| `docs/deployment/customer-pc-*.md` | HISTORICAL_CHECKPOINT (experimental) |
| `docs/deployment/mvp-live-readiness.md` | HISTORICAL_CHECKPOINT |
| `docs/deployment/auth-and-mailbox-roadmap.md` | ACTIVE |

## QA (tracked)

| Pattern | Status |
|---------|--------|
| `qa/security/*` | GENERATED_EVIDENCE (keep security findings) |
| `qa/outreach/*-baseline.md` | GENERATED_EVIDENCE |
| `qa/outreach/*-summary.md` | GENERATED_EVIDENCE |
| `qa/repository/*` | CANONICAL (this hygiene pass) |

## Repository audits (this branch)

| File | Status |
|------|--------|
| `qa/repository/worktree-inventory.md` | CANONICAL |
| `qa/repository/branch-inventory.md` | CANONICAL |
| `qa/repository/documentation-truth-audit.md` | CANONICAL |
| `qa/repository/document-duplicates.md` | CANONICAL |
| `qa/repository/environment-variable-audit.md` | CANONICAL |
| `qa/repository/root-file-cleanup.md` | CANONICAL |
| `qa/repository/code-hygiene-audit.md` | CANONICAL |
| `qa/repository/ci-script-audit.md` | CANONICAL |

# ForgeOS Recovery Audit

**Audit date:** 2026-07-04  
**Inspector:** Cursor (read-only recovery pass)  
**Scope:** `C:\Users\J35U5\Desktop\VS Code` — all ForgeOS repositories and worktrees

---

## 1. Executive summary

ForgeOS is a **single Git repository** with **16 worktrees** under `C:\Users\J35U5\Desktop\VS Code`. There are no other non-ForgeOS project directories at that root.

**Where the project stands:** Active development converged on two parallel release tracks:

1. **`release/jh-gomes-outreach-supabase`** (`86d5bd2`) — the most advanced **committed** branch. Adds Supabase cookie auth, tenant-key resolution, atomic delivery-claim RPC, partial Supabase repository bundle, server-owned message send route, SQL integration tests, and updated `docs/CURRENT_STATE.md`. This branch is **6 commits ahead** of `release/jh-gomes-outreach` (`de654e2`) and is **entirely local** (no matching remote branch observed).

2. **`feat/email-outreach-send-jobs-7d2`** worktree — the most advanced **implementation** overall, but **Step 7D2 work is almost entirely uncommitted** (~1,130 lines across 21 modified files + 4 untracked files). The branch pointer is still at `47af013` (same as `feat/email-outreach-send-jobs`), meaning 7D2 exists only on disk and is **at immediate loss risk**.

**What likely completed before the laptop shut down (verified by commits on 2026-07-03):**

| Time (UTC+1) | Commit | Branch | Work |
|---|---|---|---|
| ~14:38 | `47af013` | `feat/email-outreach-send-jobs` | Hosted send-job runtime boundary (7D1 committed) |
| ~14:44–14:57 | `8d146ff`, `dadd43c` | outlook-local, customer-pc | Outlook MVP docs; Windows runtime validation |
| ~15:16 | `0a60750` | `feat/jh-gomes-mail-connector` | JH Gomes mailbox connector tests/docs |
| ~16:42 | `de654e2` | `release/jh-gomes-outreach` | Playwright centralization + CI workflow |
| ~17:12–17:13 | `645def1`→`86d5bd2` | `release/jh-gomes-outreach-supabase` | Full Supabase outreach persistence slice (6 commits) |

After `47af013`, agents continued 7D2 in the `Forge-OS-send-jobs-7d2` worktree but **did not commit** before the session ended.

**Most advanced branch/worktree:**

- **Committed:** `release/jh-gomes-outreach-supabase` @ `Forge-OS` main worktree
- **Overall (including WIP):** `Forge-OS-send-jobs-7d2` worktree on `feat/email-outreach-send-jobs-7d2`

**Uncommitted work at risk:**

| Risk level | Location | Description |
|---|---|---|
| **CRITICAL** | `Forge-OS-send-jobs-7d2` | Full Step 7D2: hosted campaign preparation, tenant membership API, actor-context upgrades, migration tooling, UI panel, E2E extensions |
| Low | `Forge-OS` (main) | CRLF-only dirty flags on 5 tracked files (no content diff); 2 untracked files |
| Low | `Forge-OS-inventory` | Inventory foundation WIP (unrelated to outreach urgency) |
| Low | `Forge-OS-outreach` | `next-env.d.ts` build artifact |

**Is the outreach workflow deployable today?**

| Deployment mode | Verdict |
|---|---|
| **Customer PC — IndexedDB local mode** | **Partially deployable.** Import → draft → approve → local simulation send jobs work on branches through `release/jh-gomes-outreach` ancestry. Customer-PC scripts validated on `dadd43c`. Real Brevo sending blocked by config gates. |
| **Hosted Supabase persistence** | **Not deployable.** Migrations not applied locally; Docker/Supabase stack unverified; `createSupabaseRepositoryBundle()` stubs most entities; send-job hosted repos not merged into supabase branch; production send-job auth not wired. |
| **Production Brevo campaign sending** | **Not deployable.** Simulation/test-send only; `realSendEnabled` gates block live sends. |

**Single most important next action:** **Preserve and commit the Step 7D2 uncommitted work** in `Forge-OS-send-jobs-7d2` before any merge or further development.

---

## 2. Repository and worktree inventory

All paths share repository root `C:\Users\J35U5\Desktop\VS Code\Forge-OS` (remote: `https://github.com/CheekiBreekiJesus/Forge-OS.git`).

| Path | Repository | Branch | HEAD | Upstream | Status | Purpose |
|---|---|---|---|---|---|---|
| `Forge-OS` | Main worktree | `release/jh-gomes-outreach-supabase` | `86d5bd2` | None (local only) | Dirty (CRLF flags + 2 untracked) | **Active Supabase release implementation** |
| `Forge-OS-codex` | Worktree | `agent/codex-next-task` | `bd33f90` | None | Clean | Stale agent sandbox (customizer) |
| `Forge-OS-cursor` | Worktree | `agent/cursor-ui-review` | `bd33f90` | None | Clean | Stale agent sandbox (customizer) |
| `Forge-OS-inventory` | Worktree | `feat/inventory-product-foundation` | `f02471c` | `origin/feat/inventory-product-foundation` | Dirty (9 files) | Inventory/product module WIP |
| `Forge-OS-jh-gomes-mail` | Worktree | `feat/jh-gomes-mail-connector` | `0a60750` | `origin/feat/jh-gomes-mail-connector` | Clean | SMTP/IMAP mailbox connector |
| `Forge-OS-local-runtime` | Worktree | `feat/customer-pc-local-runtime` | `dadd43c` | `origin/feat/customer-pc-local-runtime` | Clean | Customer PC Windows deployment |
| `Forge-OS-marketing-studio` | Worktree | `feat/marketing-studio-foundation` | `ecbb190` | `origin/feat/marketing-studio-foundation` | Clean | Marketing studio UI foundation |
| `Forge-OS-outlook-local` | Worktree | `feat/outlook-local-send-mvp` | `8d146ff` | `origin/feat/outlook-local-send-mvp` | Clean | Local Outlook send MVP |
| `Forge-OS-outreach` | Worktree | `feat/email-outreach-live-mvp` | `b9c41f1` | `origin/feat/email-outreach-live-mvp` | Dirty (`next-env.d.ts`) | Early outreach live MVP |
| `Forge-OS-outreach-integration` | Worktree | `feat/email-outreach-mvp-integration` | `e6760f5` | `origin/feat/email-outreach-mvp-integration` | Clean | Import-ops + send-job integration |
| `Forge-OS-outreach-ops` | Worktree | `feat/outreach-import-ops-hardening` | `60fa927` | `origin/feat/outreach-import-ops-hardening` | Clean | CSV/XLSX import hardening |
| `Forge-OS-outreach-provider` | Worktree | `feat/email-outreach-provider` | `9cf9936` | `origin/feat/email-outreach-provider` | Clean | Brevo foundation + webhooks |
| `Forge-OS-product-import` | Worktree | `feat/jhgomes-product-data-staging` | `314f6fb` | `origin/feat/jhgomes-product-data-staging` | Clean | JH Gomes product data staging |
| `Forge-OS-send-jobs` | Worktree | `feat/email-outreach-send-jobs` | `47af013` | `origin/feat/email-outreach-send-jobs` | Clean | Step 7D1 committed |
| `Forge-OS-send-jobs-7d2` | Worktree | `feat/email-outreach-send-jobs-7d2` | `47af013` | `origin/feat/email-outreach-send-jobs` | **Dirty (25 files)** | **Step 7D2 WIP — CRITICAL** |
| `Forge-OS-table-ui` | Worktree | `fix/table-density-and-action-overlays` | `7ac724d` | `origin/fix/table-density-and-action-overlays` | Clean | Table UI density fix |

**Backup branches (local):**

| Branch | HEAD | Notes |
|---|---|---|
| `backup/jh-gomes-outreach-de654e2` | `de654e2` | Matches `release/jh-gomes-outreach` |
| `backup/jh-gomes-outreach-runtime-bf5f3fe` | `bf5f3fe` | Tagged `backup/jh-gomes-outreach-runtime-bf5f3fe` |
| `integration/jh-gomes-outreach-runtime` | `bf5f3fe` | Ahead 2 of `origin/integration/jh-gomes-outreach-runtime` |

---

## 3. Latest Git state

### 3.1 Main worktree — `Forge-OS`

| Field | Value |
|---|---|
| Branch | `release/jh-gomes-outreach-supabase` |
| HEAD | `86d5bd2` — `test(supabase): add integration coverage, CI job, and docs update` |
| Date | 2026-07-03 17:13:01 +0100 |
| Upstream | **None** (branch not pushed) |
| Ahead/behind | 104 ahead of `origin/main`; 6 ahead of `release/jh-gomes-outreach` |
| Stash | `stash@{0}` on `codex/forgeos-foundation-app-shell` — unrelated AGENTS.md/UI changes |

**Recent commits (newest first):**

```
86d5bd2 test(supabase): add integration coverage, CI job, and docs update
90474bd feat(outreach): connect Supabase UI send path
a0244be feat(outreach): add atomic delivery claim and durable results
306c3a6 feat(auth): wire Supabase cookie session and tenant membership
f95598b feat(outreach): add atomic delivery claim RPC and RLS policies
645def1 feat(tenant): add stable tenant key and tenant-safe constraints
de654e2 chore(test): centralize Playwright runtime and add CI workflow  ← release/jh-gomes-outreach
```

**Dirty files:**

| Type | Files | Notes |
|---|---|---|
| Modified (no content diff) | `.github/workflows/ci.yml`, `docs/CURRENT_STATE.md`, `src/application/send-job-server-mutations.test.ts`, `src/features/email-delivery/send-job-actor-context.ts`, `src/features/leadops/providers.ts` | CRLF line-ending flags only; `git diff --numstat` empty |
| Untracked | `.cursor/settings.json`, `scripts/data-preparation/fixtures/synthetic_products.csv` | IDE config; synthetic fixture |

**Risks:** Supabase release branch exists only locally. Broken `supabase-integration.yml` committed at `86d5bd2` (see §8).

### 3.2 `Forge-OS-send-jobs-7d2` — CRITICAL WIP

| Field | Value |
|---|---|
| Branch | `feat/email-outreach-send-jobs-7d2` |
| HEAD (committed) | `47af013` — same as `feat/email-outreach-send-jobs` |
| Uncommitted | 21 modified (+1,130 / −36 lines), 4 untracked |

**Modified (high-signal):**

- `src/features/email-delivery/hosted-send-job-repositories.ts` (+184 lines)
- `src/features/email-delivery/send-job-actor-context.ts` (+94 lines) — tenant membership, permissions
- `src/components/leadops-campaign-detail-shell.tsx` (+328 lines) — hosted preparation UI
- `e2e/campaign-send-job-simulation.spec.ts` (+133 lines)
- Docs: `hosted-campaign-projection.md`, `operations-runbook.md`, `tenant-membership.md`, etc.

**Untracked:**

- `supabase/migrations/202607030002_outreach_hosted_preparation_status.sql`
- `src/app/api/outreach/send-jobs/prepare-campaign/status/route.ts`
- `src/app/api/outreach/send-jobs/tenant-memberships/route.ts`
- `scripts/outreach-hosted-runtime/check-migrations.ts`

**Note:** `202607030001_outreach_hosted_runtime_projection.sql` exists in this worktree (7 migrations total vs 9 on supabase branch) but was already present at `47af013` base — only `202607030002` is new/untracked.

### 3.3 Other notable worktrees

**`Forge-OS-send-jobs`** — Clean at `47af013`. Contains `hosted-send-job-repositories.ts` (not on supabase branch).

**`Forge-OS-local-runtime`** — Clean at `dadd43c`. Matches known commit. Pushed to `origin/feat/customer-pc-local-runtime`.

**`Forge-OS-inventory`** — Dirty inventory WIP; not on outreach critical path.

**`Forge-OS-outreach`** — `next-env.d.ts` modified (auto-generated build artifact).

### 3.4 Branch relationships to release

```
release/jh-gomes-outreach (de654e2)
  └── release/jh-gomes-outreach-supabase (+6 commits → 86d5bd2)

feat/email-outreach-send-jobs (47af013)
  └── diverged from common ancestor fb82211
  └── NOT merged into supabase branch
  └── 7d2 WIP extends this on separate worktree (uncommitted)

feat/customer-pc-local-runtime (dadd43c)
  └── ancestor of release/jh-gomes-outreach (merged in history)
```

**Verified prior context:**

| Claim | Verified? | Actual state |
|---|---|---|
| Main delivery branch `release/jh-gomes-outreach` @ `de654e2` | ✅ Yes | Exact match |
| Supabase branch @ `86d5bd2` | ✅ Yes | Exact match |
| Send-jobs @ `47af013` (7D1) | ✅ Yes | Exact match |
| Customer PC @ `dadd43c` | ✅ Yes | Exact match |
| 7D2 branch has new commits | ❌ No | Branch pointer still `47af013`; work is uncommitted only |

---

## 4. Recent agent work discovered

| Source | Timestamp | Claims | Code evidence |
|---|---|---|---|
| Commit `86d5bd2` | 2026-07-03 17:13 | Supabase integration tests, CI job, docs | ✅ `outreach-vertical.integration.test.ts`, `.github/workflows/supabase-integration.yml` (broken — missing workflow header), `.env.example` updates |
| Commits `645def1`–`90474bd` | 2026-07-03 17:12–17:13 | Tenant key, RLS, auth session, delivery claim, UI send path | ✅ Migration files, `session.ts`, `repository-bundle.ts`, send route |
| Commit `de654e2` | 2026-07-03 16:42 | Playwright centralization + CI | ✅ `.github/workflows/ci.yml`, `scripts/qa/prepare-playwright-tests.ps1` |
| Commit `47af013` | 2026-07-03 14:38 | Hosted send-job runtime boundary | ✅ `hosted-send-job-repositories.ts` on send-jobs worktree only |
| `qa/outreach/composer-step-7-stabilization.md` | 2026-07-02 | Local simulation send jobs validated (217 unit, 93 e2e) | ✅ Confirmed on send-jobs branch ancestry; superseded by later commits |
| `qa/outreach/step-7-recovery-baseline.md` | 2026-07-02 | Baseline validation on send-jobs worktree | ✅ Historical; branch has since advanced to `47af013` |
| `docs/checkpoints/email-outreach-status.md` (7d2 worktree) | 2026-07-03 | 7D2 features implemented but migrations not applied | ✅ Matches uncommitted file evidence |
| `qa/deployment/customer-pc-runtime-correction-summary.md` | 2026-07-03 | PID safety, branch config, E2E port isolation | ✅ Matches commits on `dadd43c` ancestry |
| `docs/CURRENT_STATE.md` | 2026-07-03 (committed + CRLF dirty) | Authoritative outreach state on supabase branch | ✅ Accurate for committed supabase slice |
| `qa/outreach/latest-summary.md` | 2026-07-03 | Draft personalization on integration branch | ✅ On `e6760f5`; separate from supabase track |
| Agent stash `stash@{0}` | Unknown | Pre-inventory unrelated changes | ⚠️ Old; on `codex/forgeos-foundation-app-shell` — not outreach-critical |
| `forgeos-send-jobs-interrupted-backup.patch` | Referenced in docs | Step 7 patch backup | ❌ **Not found on disk** |

---

## 5. Current outreach architecture

### 5.1 Layer map

```
UI (LeadOps pages)
  → src/app/[locale]/leadops/**
  → src/components/leadops-*-shell.tsx

API routes
  → src/app/api/leadops/generate/route.ts        (AI message generation)
  → src/app/api/leadops/send/route.ts            (legacy/manual send)
  → src/app/api/outreach/messages/[id]/send/     (server-owned Supabase send — supabase branch)
  → src/app/api/outreach/send-jobs/**            (queue/process/pause/resume/cancel/retry/status)
  → src/app/api/outreach/send-jobs/prepare-campaign/**  (7d2 WIP only)
  → src/app/api/outreach/brevo/webhook/route.ts
  → src/app/api/outreach/unsubscribe/route.ts

Application services
  → src/application/lead-import-service.ts
  → src/application/campaign-send-job-service.ts
  → src/application/send-job-server-mutations.ts
  → src/application/outreach-message-send-service.ts  (supabase branch)
  → src/application/campaign-approval-service.ts
  → src/features/leadops/workflow.ts

Repository interfaces
  → src/persistence/interfaces.ts
  → src/persistence/server-factory.ts

Implementations
  IndexedDB (default local mode):
    → src/persistence/db.ts
    → src/persistence/indexeddb/repositories.ts
    → src/persistence/indexeddb/send-job-repositories.ts

  Supabase partial (supabase branch — server send vertical slice):
    → src/persistence/supabase/repository-bundle.ts
    → src/persistence/supabase/outreach-repositories.ts
    → src/persistence/supabase/stubs.ts  (most entities throw "not implemented")

  Hosted REST (send-jobs branch + 7d2 WIP):
    → src/features/email-delivery/hosted-send-job-repositories.ts
    → src/features/email-delivery/durable-outreach-store.ts

Auth / tenant
  → src/lib/auth/session.ts                    (Supabase cookie + test/dev headers)
  → src/lib/supabase/tenant.ts                 (tenant_key → UUID)
  → src/features/email-delivery/send-job-actor-context.ts  (dev headers only on supabase branch; extended in 7d2 WIP)

Providers
  → src/features/email-delivery/simulation-provider.ts
  → src/features/email-delivery/brevo-provider.ts
  → src/features/leadops/providers.ts          (AI gateway)

Database
  → supabase/migrations/*.sql
```

### 5.2 Key UI entry points

| Page | Path |
|---|---|
| LeadOps dashboard | `src/app/[locale]/leadops/page.tsx` |
| Lead detail | `src/app/[locale]/leadops/[leadId]/page.tsx` |
| Campaigns list | `src/app/[locale]/leadops/campaigns/page.tsx` |
| Campaign detail (send jobs UI) | `src/app/[locale]/leadops/campaigns/[campaignId]/page.tsx` |
| Unsubscribe | `src/app/[locale]/unsubscribe/page.tsx` |
| Login | `src/app/[locale]/login/page.tsx` |

### 5.3 Environment variables (names only)

| Variable | Role | Status on supabase branch |
|---|---|---|
| `FORGEOS_PERSISTENCE_MODE` | `local` (default) or `supabase` | Documented |
| `NEXT_PUBLIC_FORGEOS_PERSISTENCE_MODE` | Browser-side mode hint | Documented |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL` | Supabase project URL | Required for supabase mode |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Supabase client | Required for auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server repository access | Required for supabase mode |
| `FORGEOS_ACTIVE_TENANT_KEY` | Multi-tenant selection (`tenant_jh_gomes`) | Optional |
| `FORGEOS_TEST_AUTH_ENABLED`, `FORGEOS_E2E` | Test auth bypass | CI only |
| `FORGEOS_ALLOW_DEV_AUTH_HEADERS` | Dev header auth | Dev only |
| `FORGEOS_TEST_DATABASE_URL` | SQL integration tests | Required for `test:supabase:integration` |
| `OUTREACH_DELIVERY_PROVIDER` | `simulation` (default) or `brevo` | Documented |
| `OUTREACH_REAL_SEND_ENABLED` | Gates live sends | Default false |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, etc. | Brevo provider | Optional until live send |
| `BREVO_WEBHOOK_SECRET` | Webhook verification | Optional |
| `AI_OUTREACH_PROVIDER` | AI generation provider | Documented |

---

## 6. Feature completion matrix

| Capability | Status | Branch/commit | Evidence | Missing validation or work |
|---|---|---|---|---|
| Lead import | **Complete and validated** (IndexedDB) | `e6760f5` ancestry / release | `lead-import-service.ts`, import wizard E2E, QA reports | Supabase lead persistence stubbed |
| Lead persistence | **Implemented but not validated** (Supabase) | `86d5bd2` | IndexedDB full; Supabase `leads` stub throws | No Supabase lead repo implementation |
| Campaign creation | **Complete and validated** (IndexedDB) | release ancestry | `campaign-send-job-service.ts`, E2E specs | Supabase campaigns partial (send slice only) |
| Message generation | **Complete and validated** | `e6760f5` | `/api/leadops/generate`, deterministic + AI providers | Live AI optional/skipped in tests |
| Draft/version persistence | **Complete and validated** (IndexedDB) | release ancestry | IndexedDB v12/v13, unit tests | Supabase `outreachMessages` stubbed |
| Approval workflow | **Complete and validated** (IndexedDB) | release ancestry | `campaign-approval-service.ts`, duplicate-send guards | — |
| Campaign preparation (hosted) | **Partially implemented** | 7d2 WIP (uncommitted) | `prepareHostedCampaignProjection`, UI panel, migration `202607030002` | **Uncommitted; not merged; migrations unapplied** |
| Send-job persistence | **Implemented but not validated** | `47af013` + 7d2 WIP | IndexedDB projections + hosted REST repos | Supabase send-job tables not wired in `createSupabaseRepositoryBundle()` |
| Brevo sending | **Placeholder or simulated** | all branches | `brevo-provider.ts` exists; `realSendEnabled` gate blocks | No validated live campaign batch send |
| Webhook persistence | **Implemented but not validated** | `9cf9936` ancestry | `/api/outreach/brevo/webhook`, `durable-outreach-store.ts` | Requires live Supabase + Brevo |
| Analytics | **Partially implemented** | release ancestry | KPIs in `leadops/kpis.ts`, campaign counters | No production analytics pipeline |
| Authentication | **Partially implemented** | `86d5bd2` | Supabase cookie session for message send route | Send-job routes use dev headers only; production throws |
| Tenant isolation | **Partially implemented** | `86d5bd2` | `tenant_key`, RLS policies, membership lookup | Demo tenant IDs need server-side validation everywhere |
| Supabase migrations | **Implemented but not validated** | `86d5bd2` (9 files) | SQL files present; integration test exists | **Not applied locally; Docker unavailable per docs** |
| Customer-PC runtime | **Complete and validated** | `dadd43c` | Windows scripts, smoke tests, QA baseline | Uses IndexedDB; not Supabase |
| CI | **Partially implemented** | `de654e2`, `86d5bd2` | `ci.yml` for lint/typecheck/test/build/e2e | `supabase-integration.yml` **broken** (invalid workflow file) |
| End-to-end tests | **Complete and validated** (IndexedDB path) | `de654e2` | 22 Playwright specs; ports 3001/3012 isolated | Supabase-mode E2E **unknown** |

### Critical checks

| Check | Result |
|---|---|
| `createSupabaseRepositoryBundle()` real implementations for all outreach paths | ❌ **No** — only campaigns, campaignRecipients, outreachSendAttempts, activities; all else stubbed |
| Drafts/versions/approvals durably persisted (Supabase) | ❌ **No** — IndexedDB only for full workflow |
| Browser demo tenant IDs → DB tenants safely | ⚠️ **Partial** — `session.ts` resolves `tenant_jh_gomes` → UUID when Supabase configured |
| Tenant membership validated server-side | ⚠️ **Partial** — message send route yes; send-job routes no (dev headers) |
| Server routes use authenticated actor context | ⚠️ **Partial** — `/api/outreach/messages/*/send` yes; `/api/outreach/send-jobs/*` dev headers only |
| Campaign preparation idempotent | ✅ **Yes** (7d2 WIP) — `snapshot_fingerprint`, `on_conflict` upsert; **uncommitted** |
| Sending idempotent | ✅ **Yes** — claim RPC, idempotency keys, unique constraints (committed on supabase branch) |
| Webhooks resolve tenants safely | ⚠️ **Implemented** — uses `tenant_public_id`; not validated live |
| Brevo event processing durable | ⚠️ **Implemented** — `durable-outreach-store.ts`; requires Supabase |
| Hosted path contains simulations | ✅ **Yes** — `SimulationEmailDeliveryProvider` forced in hosted deps |
| IndexedDB default where Supabase expected | ⚠️ **Yes** — `FORGEOS_PERSISTENCE_MODE` defaults to `local`; browser UI reads IndexedDB |
| Migrations applied and tested | ❌ **No** — SQL integration test uses raw PostgreSQL harness; `supabase start` not run |
| Fresh-database validation | ⚠️ **Partial** — `outreach-vertical.integration.test.ts` resets schema; requires `FORGEOS_TEST_DATABASE_URL` |
| CI validates migrations | ⚠️ **Broken** — workflow file incomplete |
| Customer-PC runtime stable | ✅ **Yes** — validated on `dadd43c` |
| Playwright isolated ports | ✅ **Yes** — ports 3001 (acceptance), 3012 (e2e) |

---

## 7. Database and Supabase state

### 7.1 Migration files on `release/jh-gomes-outreach-supabase`

| File | Purpose |
|---|---|
| `202606150001_demo_mvp_schema.sql` | Demo MVP base |
| `202606260001_operational_foundation.sql` | Operational foundation |
| `202606300001_leadops_outreach_schema.sql` | Campaigns, lead states, messages |
| `202607020001_outreach_public_events.sql` | Public suppressions, provider events |
| `202607020002_outreach_send_jobs.sql` | Send jobs, recipients, attempts, lock RPC |
| `202607031200_outreach_delivery_attempts.sql` | Delivery attempts |
| `202607031400_tenant_key_outreach_campaigns.sql` | Stable `tenant_key`, campaign recipients |
| `202607031500_outreach_send_attempts.sql` | Send attempt claim RPC |
| `202607031600_outreach_rls_policies.sql` | RLS read/write policies |

**Additional on 7d2 worktree (not on supabase branch):**

| File | Status |
|---|---|
| `202607030001_outreach_hosted_runtime_projection.sql` | On send-jobs @ `47af013`; not on supabase branch |
| `202607030002_outreach_hosted_preparation_status.sql` | **Untracked** in 7d2 worktree |

### 7.2 Key tables

`tenants`, `tenant_memberships`, `leads`, `outreach_campaigns`, `outreach_campaign_recipients`, `outreach_lead_states`, `outreach_messages`, `outreach_send_attempts`, `outreach_send_jobs`, `outreach_send_job_recipients`, `outreach_send_job_attempts`, `outreach_provider_events`, `outreach_public_suppressions`, `outreach_hosted_campaigns` (7d2), `outreach_hosted_campaign_recipients` (7d2)

### 7.3 Tenant-key strategy

- Platform tenants use UUID `id` + stable `tenant_key` (e.g. `tenant_jh_gomes`)
- JH Gomes resolves: `tenants.tenant_key = 'tenant_jh_gomes'` → UUID
- Send-job tables use `tenant_id text` (string refs); outreach tables use `tenant_id uuid`
- RLS uses `current_user_tenant_ids()` from `tenant_memberships`

### 7.4 Applied vs unapplied

| Environment | Status |
|---|---|
| Local Supabase (`supabase start`) | **Not applied** — Docker was unavailable per `CURRENT_STATE.md` |
| CI PostgreSQL service | **Unknown** — workflow file broken; never verified running |
| Hosted Supabase project | **Unknown** — no evidence of remote project configuration |
| Raw PostgreSQL integration test | **Implemented** — `npm run test:supabase:integration` applies migrations via `test-harness.ts` when `FORGEOS_TEST_DATABASE_URL` set |

### 7.5 Missing database checks

- Full migration apply on fresh Supabase local stack
- PostgREST vertical test through `@supabase/supabase-js` (not raw `pg`)
- Send-job hosted projection migrations (`030001`, `030002`) on supabase branch
- RLS policy validation with real authenticated users
- Tenant membership permission column behavior (`030001` adds `permissions text[]`)

---

## 8. Test and validation status

### Confirmed passing (documented evidence — not re-run in this audit)

| Check | Last evidence | Branch/context |
|---|---|---|
| `npm run lint` | Pass (warnings) | step-7-recovery-baseline, composer-step-7, customer-pc baseline |
| `npm run typecheck` | Pass | Same reports |
| `npm test` | Pass (208–244 tests depending on branch age) | step-7-recovery-baseline (208), integration summary (244) |
| `npm run build` | Pass | step-7-recovery-baseline |
| `npm run test:e2e` | Pass (90–93 tests, 1 live-AI skipped) | step-7-recovery-baseline |
| `npm run test:acceptance` | Pass (50 tests) | step-7-recovery-baseline |
| `npm run test:customer-pc:smoke` | Pass | customer-pc-runtime-correction-summary |
| Windows runtime validation | Pass | commit `dadd43c` |

### Confirmed failing

| Check | Evidence |
|---|---|
| `.github/workflows/supabase-integration.yml` | **Invalid workflow** — file contains only a job fragment (`supabase-integration:`) without `name:`, `on:`, or `jobs:` wrapper |

### Not run (this audit)

All test commands — per instructions, no infrastructure-dependent tests executed.

### Blocked by environment

| Check | Blocker |
|---|---|
| `supabase start` / local Supabase stack | Docker daemon unavailable (documented) |
| `npm run test:supabase:integration` (local) | Requires `FORGEOS_TEST_DATABASE_URL` or Docker PostgreSQL |
| Live Brevo send tests | `OUTREACH_REAL_SEND_ENABLED=false`, no API key |
| Live AI tests | Optional; skipped in CI and baselines |
| PostgREST repository bundle tests | Requires live Supabase API |

### Unknown

| Check | Reason |
|---|---|
| Tests on `release/jh-gomes-outreach-supabase` after 6 new commits | No QA report post-`86d5bd2` |
| 7d2 WIP validation | Uncommitted; no post-edit test run documented |
| CI run on supabase branch | Branch not pushed; workflow broken anyway |

---

## 9. Branch comparison and integration risk

### Most complete implementation (by concern)

| Concern | Branch/worktree | HEAD |
|---|---|---|
| Supabase auth + delivery claim + partial repos | `release/jh-gomes-outreach-supabase` | `86d5bd2` |
| Hosted send-job REST repositories | `feat/email-outreach-send-jobs` | `47af013` |
| Step 7D2 (preparation, tenant selector, migration tooling) | `feat/email-outreach-send-jobs-7d2` WIP | `47af013` + uncommitted |
| Customer PC deployment | `feat/customer-pc-local-runtime` | `dadd43c` (in release ancestry) |
| Import + personalization integration | `feat/email-outreach-mvp-integration` | `e6760f5` |
| IndexedDB local simulation (validated) | `release/jh-gomes-outreach` | `de654e2` |

### Integration base recommendation

**`release/jh-gomes-outreach-supabase`** should be the integration base for hosted persistence, because it contains auth, tenant keys, RLS, delivery claim RPC, and server send route. It must absorb:

1. `hosted-send-job-repositories.ts` and related files from `feat/email-outreach-send-jobs` (`47af013`)
2. All 7D2 uncommitted work from `Forge-OS-send-jobs-7d2`
3. Migrations `202607030001` and `202607030002`

### Branches that should eventually merge

```
feat/email-outreach-send-jobs-7d2 (after commit)
  → release/jh-gomes-outreach-supabase
    → release/jh-gomes-outreach (after validation)
      → integration/jh-gomes-outreach-runtime (customer PC + outreach)
```

### Competing / duplicated work

| Issue | Detail |
|---|---|
| Two send-job actor-context implementations | Supabase branch: dev-headers only, production throws. 7d2 WIP: tenant membership + permissions. **Conflict likely on merge.** |
| Two Supabase repository strategies | `repository-bundle.ts` (partial, service client) vs `hosted-send-job-repositories.ts` (REST PostgREST). Need unified approach. |
| `feat/email-outreach-send-jobs-7d2` vs `feat/email-outreach-send-jobs` | Same commit; 7d2 is uncommitted extension — not a divergent branch yet |
| Customer PC (IndexedDB) vs Supabase (hosted) | Parallel deployment modes; not duplicate but require clear env-driven switching |

### Do not delete

- `backup/jh-gomes-outreach-de654e2`
- `backup/jh-gomes-outreach-runtime-bf5f3fe` (tagged)
- `feat/email-outreach-send-jobs-7d2` worktree until WIP committed
- `release/jh-gomes-outreach-supabase` (only local copy of Supabase work)

### Uncommitted work needing immediate preservation

1. **All files in `Forge-OS-send-jobs-7d2`** (25 files) — commit to `feat/email-outreach-send-jobs-7d2` immediately
2. Optionally snapshot: `git diff > forgeos-7d2-emergency-backup.patch` before any other operations

### Release branch behind feature branches?

| Comparison | Result |
|---|---|
| `release/jh-gomes-outreach-supabase` vs `feat/email-outreach-send-jobs` | Supabase branch **lacks** `hosted-send-job-repositories.ts` and 7D2 work |
| `release/jh-gomes-outreach` vs `feat/email-outreach-send-jobs` | Release **ahead** on auth/deployment; send-jobs **ahead** on hosted repos |
| `release/jh-gomes-outreach-supabase` vs 7d2 WIP | Supabase **ahead** on auth/RLS/delivery; 7d2 **ahead** on hosted preparation + tenant selector |

---

## 10. Remaining blockers

### Critical

1. **Step 7D2 work uncommitted** — ~1,130 lines at risk in `Forge-OS-send-jobs-7d2`
2. **Branch integration not done** — hosted send repos + 7d2 not merged into supabase release
3. **Supabase migrations not applied** on any live environment
4. **`supabase-integration.yml` broken** — CI cannot run SQL integration tests

### High

5. **Send-job production auth not configured** — `resolveTrustedSendJobActorContext` throws in production on supabase branch
6. **`createSupabaseRepositoryBundle()` incomplete** — leads, messages, send jobs all stubbed
7. **Supabase release branch not pushed** — exists only locally; no remote backup
8. **Browser UI still reads IndexedDB** in supabase mode (only server send wired per `CURRENT_STATE.md`)

### Medium

9. **Docker unavailable** — blocks `supabase start` local validation
10. **Brevo live campaign sending disabled** — gates require explicit approval (Step 9)
11. **Two tenant ID types** — UUID in outreach tables vs `text` in send-job tables
12. **`forgeos-send-jobs-interrupted-backup.patch` missing** — referenced backup not on disk

### Low

13. **Inventory worktree dirty** — unrelated WIP
14. **Stash on old branch** — unrelated AGENTS.md changes
15. **`next-env.d.ts` artifacts** — should not be committed

---

## 11. Recommended next slice

### Slice: Preserve 7D2 and integrate hosted send jobs into Supabase release

| Field | Value |
|---|---|
| **Objective** | Save at-risk 7D2 work, merge hosted send-job path into `release/jh-gomes-outreach-supabase`, fix CI, validate migrations on PostgreSQL |
| **Exact scope** | (1) Commit 7d2 WIP. (2) Merge `feat/email-outreach-send-jobs-7d2` into `release/jh-gomes-outreach-supabase`. (3) Fix `supabase-integration.yml`. (4) Run `npm run test:supabase:integration` with local PostgreSQL. (5) Resolve send-job actor-context merge conflicts. |
| **Files/subsystems** | `Forge-OS-send-jobs-7d2/**`, `hosted-send-job-repositories.ts`, `send-job-actor-context.ts`, `supabase/migrations/202607030001*.sql`, `202607030002*.sql`, `.github/workflows/supabase-integration.yml`, `repository-bundle.ts` |
| **Acceptance criteria** | 7d2 committed; merge compiles; `npm run validate` passes; `test:supabase:integration` passes; no uncommitted outreach-critical files; CI workflow valid YAML |
| **Required tests** | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:supabase:integration`, `npm run test:e2e -- e2e/campaign-send-job-simulation.spec.ts` |
| **Explicit exclusions** | No Brevo live sending; no `supabase db push` to production; no auth/session architecture changes; no inventory merge; no customer PC script changes |
| **Risks** | Merge conflicts in actor-context and repository abstractions; broken CI may hide regressions until fixed |
| **Suggested branch** | Commit on `feat/email-outreach-send-jobs-7d2`, then merge into `release/jh-gomes-outreach-supabase` |

**Alternative (if customer PC deployment is more urgent than Supabase):** Deploy `release/jh-gomes-outreach` (`de654e2`) in `FORGEOS_PERSISTENCE_MODE=local` using customer-PC scripts from `dadd43c` ancestry. This delivers the full IndexedDB outreach workflow with simulation sending but not hosted persistence or Brevo live campaigns.

---

## 12. Copyable handover for ChatGPT

```
FORGEOS RECOVERY HANDOVER — 2026-07-04

REPOSITORY
- Path: C:\Users\J35U5\Desktop\VS Code\Forge-OS
- Remote: https://github.com/CheekiBreekiJesus/Forge-OS.git
- Architecture: Single repo, 16 worktrees under C:\Users\J35U5\Desktop\VS Code\Forge-OS*

CURRENT ACTIVE WORKTREE
- Path: C:\Users\J35U5\Desktop\VS Code\Forge-OS
- Branch: release/jh-gomes-outreach-supabase
- HEAD: 86d5bd2 (2026-07-03 17:13:01 +0100)
- State: Dirty — 5 files show CRLF-only modifications (no content diff); 2 untracked (.cursor/settings.json, scripts/data-preparation/fixtures/synthetic_products.csv)
- Upstream: NONE (branch not pushed to origin)

VERIFIED PRIOR CONTEXT
- release/jh-gomes-outreach @ de654e2 ✅
- release/jh-gomes-outreach-supabase @ 86d5bd2 ✅
- feat/email-outreach-send-jobs @ 47af013 ✅ (7D1)
- feat/customer-pc-local-runtime @ dadd43c ✅
- feat/email-outreach-send-jobs-7d2: branch pointer still 47af013; 7D2 is UNCOMMITTED only ❌

CRITICAL AT-RISK WORK
- Worktree: C:\Users\J35U5\Desktop\VS Code\Forge-OS-send-jobs-7d2
- Branch: feat/email-outreach-send-jobs-7d2 @ 47af013
- 21 modified files (+1130 lines), 4 untracked files
- Includes: hosted campaign preparation, tenant membership API, send-job-actor-context upgrades, migration 202607030002, UI panel, E2E tests, migration check script

MOST ADVANCED IMPLEMENTATION
- Committed: release/jh-gomes-outreach-supabase (Supabase auth, RLS, delivery claim, partial repos)
- Overall incl. WIP: Forge-OS-send-jobs-7d2 worktree (hosted send jobs + 7D2 preparation)

WORKTREE SUMMARY (branch @ HEAD)
- Forge-OS → release/jh-gomes-outreach-supabase @ 86d5bd2 [dirty CRLF]
- Forge-OS-send-jobs-7d2 → feat/email-outreach-send-jobs-7d2 @ 47af013 [CRITICAL dirty]
- Forge-OS-send-jobs → feat/email-outreach-send-jobs @ 47af013 [clean]
- Forge-OS-local-runtime → feat/customer-pc-local-runtime @ dadd43c [clean]
- Forge-OS-jh-gomes-mail → feat/jh-gomes-mail-connector @ 0a60750 [clean]
- Forge-OS-outreach-integration → feat/email-outreach-mvp-integration @ e6760f5 [clean]
- Forge-OS-outreach → feat/email-outreach-live-mvp @ b9c41f1 [next-env.d.ts dirty]
- Forge-OS-inventory → feat/inventory-product-foundation @ f02471c [dirty, unrelated]
- Others: clean on agent/customizer/outlook/provider/ops/product-import/table-ui branches

COMPLETED CAPABILITIES (IndexedDB local mode — validated)
- Lead CSV/XLSX import with mapping profiles
- Campaign creation, deterministic/AI draft generation, approval
- Local simulation send jobs (queue/process/pause/resume/cancel)
- Brevo test-send foundation (gated off)
- Webhook/unsubscribe foundation
- Customer PC Windows runtime scripts (validated dadd43c)

COMPLETED CAPABILITIES (Supabase branch — committed, limited validation)
- tenant_key resolution (tenant_jh_gomes → UUID)
- Supabase cookie session + tenant_memberships
- Server-owned POST /api/outreach/messages/{id}/send
- claim_outreach_send_attempt RPC + outreach_send_attempts table
- Partial createSupabaseRepositoryBundle (campaigns, recipients, send attempts only)
- SQL integration test file (outreach-vertical.integration.test.ts)

UNVALIDATED / INCOMPLETE
- Step 7D2 hosted campaign preparation (uncommitted)
- hosted-send-job-repositories.ts (on send-jobs branch, not on supabase branch)
- Full Supabase repository bundle (most entities stubbed)
- Send-job production auth (dev headers only; production throws)
- Supabase migrations applied to any live environment
- Brevo live campaign batch sending
- Browser UI Supabase read path (IndexedDB still default client-side)
- CI supabase-integration workflow (BROKEN — missing workflow header)

BLOCKERS (priority order)
1. CRITICAL: Commit 7D2 uncommitted work before anything else
2. CRITICAL: Merge send-jobs + 7d2 into supabase release branch
3. CRITICAL: Fix .github/workflows/supabase-integration.yml (invalid YAML)
4. HIGH: Apply/validate migrations (Docker was unavailable)
5. HIGH: Push release/jh-gomes-outreach-supabase to remote for backup
6. HIGH: Wire production auth into send-job routes

TEST STATUS
- Last documented full validate: PASS on send-jobs ancestry (2026-07-02/03 baselines)
- Supabase branch post-86d5bd2: NOT re-validated in reports
- 7D2 WIP: NOT validated after edits
- test:supabase:integration: implemented but CI workflow broken; local run needs FORGEOS_TEST_DATABASE_URL

DATABASE/MIGRATION STATUS
- 9 migrations on supabase branch (202606150001 through 202607031600)
- 2 additional on send-jobs/7d2 worktree (202607030001 hosted projection, 202607030002 preparation status)
- Applied locally: NO (Docker unavailable)
- CI validation: BROKEN workflow file

RECOMMENDED NEXT STEP
Slice: "Preserve 7D2 and integrate hosted send jobs into Supabase release"
1. Emergency backup: cd Forge-OS-send-jobs-7d2 && git diff > ../forgeos-7d2-emergency-backup.patch
2. Commit all 7d2 changes on feat/email-outreach-send-jobs-7d2
3. Checkout release/jh-gomes-outreach-supabase in main worktree
4. Merge feat/email-outreach-send-jobs-7d2 (resolve actor-context + repo conflicts)
5. Fix supabase-integration.yml (add name/on/jobs wrapper)
6. Run: npm run validate && npm run test:supabase:integration (with PostgreSQL)
7. Push release/jh-gomes-outreach-supabase to origin when validated

COMMANDS FOR LATER (DO NOT RUN BLINDLY — verify environment first)
cd "C:\Users\J35U5\Desktop\VS Code\Forge-OS-send-jobs-7d2"
git status
git add -A
git commit -m "feat(outreach): complete Step 7D2 hosted campaign preparation"

cd "C:\Users\J35U5\Desktop\VS Code\Forge-OS"
git merge feat/email-outreach-send-jobs-7d2

# Requires PostgreSQL (Docker or local):
$env:FORGEOS_TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
npm run test:supabase:integration

npm run validate
git push -u origin release/jh-gomes-outreach-supabase

ALTERNATIVE FAST PATH (customer PC, IndexedDB only, no Supabase):
Use release/jh-gomes-outreach @ de654e2 with FORGEOS_PERSISTENCE_MODE=local
and customer-PC scripts from feat/customer-pc-local-runtime ancestry.
```

---

*End of recovery audit. No source code, branches, commits, databases, dependencies, or configuration files were modified during this inspection. Only this report file was created.*

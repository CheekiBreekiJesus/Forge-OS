# ForgeOS Documentation Truth Audit

**Audit date:** 2026-07-05  
**Verified against:** `integration/jh-gomes-outreach-supabase-7d2` @ `213dc3e`  
**Method:** Compare canonical docs to `package.json`, route tree, persistence code, migrations, tests, and integration branches.

## Executive summary

| Document area | Verdict |
|---------------|---------|
| `AGENTS.md` | **Outdated** — claims DB/auth/framework/testing undefined |
| `README.md` | **Partially current** — understates Supabase, Playwright, persistence |
| `docs/CURRENT_STATE.md` | **Partially current** — wrong base branch; overstates auth on base |
| `docs/ai-context/*` | **Historical** — early planning; contradicts implementation |
| `docs/email-outreach/*` | **Mixed** — module detail mostly accurate; some pre-7d2 notes |
| `docs/checkpoints/*` | **Historical checkpoint** — branch-specific snapshots |
| `docs/deployment/*` | **Partially current** — customer-PC experimental; auth roadmap evolving |

---

## Claim verification matrix

### Tech stack

| Claim | Source | Verdict | Evidence |
|-------|--------|---------|----------|
| "Next.js or React" undecided | `AGENTS.md` §4 | **Outdated** | `package.json`: Next `^16.2.9`, React `19.0.0` |
| Database not defined | `AGENTS.md`, `ai-context/02` | **Outdated** | IndexedDB (Dexie) + Supabase PostgreSQL migrations |
| Auth provider not defined | `AGENTS.md` | **Outdated** | `src/lib/auth/session.ts`, `@supabase/ssr` dependency |
| Testing undefined | `AGENTS.md` | **Outdated** | Vitest 59 files, Playwright configs present |
| Playwright planned | `README.md` | **Outdated** | `playwright.config.ts`, CI runs 3 e2e specs |
| Supabase planned only | `README.md` badge | **Outdated** | `src/persistence/supabase/`, 10+ migrations |
| Persistent CRUD absent | `README.md` | **Partially outdated** | IndexedDB CRUD full; Supabase outreach slice on base |
| Supabase Auth absent | `README.md` | **Partially outdated** | Session helpers on base; OAuth/membership on unmerged branches |

### Persistence

| Claim | Source | Verdict | Evidence |
|-------|--------|---------|----------|
| Local IndexedDB default | `CURRENT_STATE.md` | **Current** | `FORGEOS_PERSISTENCE_MODE=local` default |
| Supabase mode for outreach send | `CURRENT_STATE.md` | **Current** | `server-send.ts`, migration `202607031500` |
| Browser UI still IndexedDB in supabase mode | `CURRENT_STATE.md` | **Current** | `provider.tsx` client path |
| RLS policies applied | `CURRENT_STATE.md` | **Partially current** | Migration exists; production validation pending |
| Membership enforcement production-ready | `CURRENT_STATE.md` | **Partially outdated on base** | Full enforcement on `feat/supabase-auth-membership`, not base |

### Outreach

| Claim | Source | Verdict | Evidence |
|-------|--------|---------|----------|
| Leadops route active | `README.md` | **Current** | `/[locale]/leadops/*` routes in build |
| Brevo provider boundary | `email-outreach/brevo-setup.md` | **Current** | `campaign-send-job-service.ts` gates |
| Smartlead live delivery | Various old docs | **Outdated** | Deprecated in `.env.example`; simulation default |
| Send jobs hosted | `integration-status.md` | **Partially outdated** | API routes exist; Supabase projection on base |

### Auth (unmerged branch work — do not claim on base)

| Claim | Branch | Verdict |
|-------|--------|---------|
| OAuth Google/Microsoft login | `feat/supabase-oauth-foundation` | **On branch only** |
| `tenant_memberships` enforcement | `feat/supabase-auth-membership` | **On branch only** |
| Auth activation E2E | `integration/jh-gomes-auth-activation` | **On branch only** |

### Cup Customizer (unmerged)

| Claim | Branch | Verdict |
|-------|--------|---------|
| Customizer route | `feat/cup-customizer-integration-ui` | **On branch** — base has route stub at `/quotations/customizer` |
| Preview layout fix | `fix/cup-customizer-preview-layout` | **Merged into feature branch** |

---

## Document-by-document status

### `README.md`

| Section | Status |
|---------|--------|
| Vision / principles | **Current** |
| "Not yet production-connected" list | **Partially outdated** — several items implemented |
| Architecture table | **Partially outdated** — "Playwright planned" |
| Data/persistence | **Partially outdated** — implies no persistence |
| Getting started | **Current** |

### `AGENTS.md`

| Section | Status |
|---------|--------|
| §4 Tech stack "Not yet defined" | **Contradictory** |
| §10 mandatory ai-context reading | **Excessive** — ai-context is historical |
| Architecture rules | **Current** |
| Security rules | **Current** |

### `docs/CURRENT_STATE.md`

| Section | Status |
|---------|--------|
| Base branch `release/jh-gomes-outreach-supabase` | **Wrong for this audit** — hygiene uses `integration/jh-gomes-outreach-supabase-7d2` |
| Auth production status | **Overstates base** — test/dev auth on base; full OAuth on branches |
| Outreach persistence table | **Current** for 7d2 base |

### `docs/ai-context/00–11`

| File | Status |
|------|--------|
| `00-project-brief.md` | **Historical** — directionally valid |
| `01-product-vision.md` | **Historical** |
| `02-current-architecture.md` | **Superseded** — "not yet defined" throughout |
| `03-domain-knowledge.md` | **Partially current** |
| `04-decisions-log.md` | **Historical checkpoint** |
| `05-roadmap.md` | **Partially outdated** |
| `06-data-model-draft.md` | **Partially current** — schema evolved |
| `07-ui-ux-direction.md` | **Active reference** |
| `08-open-questions.md` | **Partially resolved** |
| `09-codex-startup-prompt.md` | **Superseded** |
| `10-cleanup-checklist.md` | **Historical** |
| `11-operational-foundation.md` | **Partially current** |

### `docs/email-outreach/integration-status.md`

**Historical checkpoint** — references `feat/email-outreach-mvp-integration` merge; Step 7D1 "not applied" is outdated for 7d2 base (migrations present).

### `docs/architecture/local-mvp-persistence.md`

**Superseded** — pre-Supabase schema versions (noted in CURRENT_STATE).

### `docs/product/outreach-mvp-implementation.md`

**Partially outdated** — pre-Supabase persistence notes.

---

## Contradictions requiring resolution

1. **Three "current state" authorities:** `README.md`, `docs/CURRENT_STATE.md`, `docs/ai-context/02-current-architecture.md` disagree on persistence and auth.
2. **Base branch naming:** CURRENT_STATE references `release/jh-gomes-outreach-supabase` while integration work uses `integration/jh-gomes-outreach-supabase-7d2`.
3. **Auth readiness:** Base has session scaffolding; production OAuth is branch-only — docs must distinguish.
4. **Smartlead vs Brevo:** Old docs and code references coexist; Brevo is current provider boundary.

---

## Recommended canonical hierarchy (post-hygiene)

1. `AGENTS.md` — agent rules + verified stack
2. `docs/CURRENT_STATE.md` — honest base vs branch checkpoint
3. `docs/DOCUMENT_STATUS.md` — index and status
4. Module docs under `docs/email-outreach/`, `docs/auth/`, etc.
5. `docs/ai-context/*` — **HISTORICAL_CHECKPOINT** only

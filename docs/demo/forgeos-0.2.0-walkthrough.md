# ForgeOS 0.2.0 JH Gomes Demo Walkthrough

**Duration:** 10–15 minutes  
**Locale:** `pt-PT` (switch to `en` briefly to show i18n)  
**Prerequisites:** `npm run demo:prepare` then `npm run demo:start`  
**URL:** http://localhost:3000/pt-PT

This walkthrough uses **synthetic demo data only**. No real email is sent and AI runs in **deterministic** mode.

---

## Stage 1 — Open and orient (1 min)

1. Open http://localhost:3000/pt-PT
2. Confirm dashboard greeting and JH Gomes branding
3. Point out sidebar: CRM, LeadOps link, production modules, settings
4. Optional: open http://localhost:3000/pt-PT/login and explain local preview login (not cloud OAuth)

**Talking point:** ForgeOS runs fully in the browser with IndexedDB; this demo DB is isolated as `forgeos:jhgomes:0.2.0-demo`.

---

## Stage 2 — Commercial pipeline overview (2 min)

1. Navigate to **Contactos comerciais** (`/pt-PT/leadops`)
2. Show seeded leads and campaign KPIs
3. Open a lead (e.g. seed lead `leadops_001`)
4. Show deterministic **Gerar email** — subject/body appear without paid AI
5. Mention approve / copy / open mail client actions (simulation only)

**Talking point:** LeadOps covers import, segmentation, outreach, and campaign simulation.

---

## Stage 3 — Lead import (2 min)

1. Return to `/pt-PT/leadops`
2. Use **Importar** with `e2e/fixtures/leads-mixed.csv` (synthetic file shipped in repo)
3. Walk through valid / duplicate / invalid counts
4. Confirm imported row appears in the table

**Talking point:** ExcelJS-based parser; no legacy `xlsx` dependency.

---

## Stage 4 — Campaign workflow (2 min)

1. Open **Campanhas** (`/pt-PT/leadops/campaigns`)
2. Open an existing seed campaign or create a segment
3. Show template drafts and review panel
4. Explain simulation send job — bounded batches in IndexedDB, no Brevo

**Talking point:** Real Brevo boundary exists server-side but is disabled in local demo.

---

## Stage 5 — Products and Cup Customizer (2 min)

1. Open **Produtos** (`/pt-PT/products`) — show PP cups and accessories from seed
2. Navigate to **Orçamentos** → **Personalizador de copos** (`/pt-PT/quotations/customizer`)
3. Adjust quantity/colors; save simulation
4. Reload to show persistence

**Talking point:** Cup Customizer links forward to quotations and production.

---

## Stage 6 — Quote to production (2 min)

**Option A — Guided demo page**

1. Open `/pt-PT/demo`
2. Run scripted steps: create lead → qualify → convert → quote → approve → production order → machine → inventory

**Option B — Direct modules**

1. `/pt-PT/quotations` — list quotes
2. `/pt-PT/production` — production orders
3. `/pt-PT/machines` and `/pt-PT/inventory` — operations context

**Talking point:** Single tenant (`JH Gomes`) with operational seed for machines and stock.

---

## Stage 7 — Customers and dashboard (1 min)

1. `/pt-PT/customers` — customer records linked from converted leads
2. Return to dashboard — onboarding checklist, notifications

---

## Stage 8 — Settings, backup, reset (2 min)

1. `/pt-PT/settings` — company profile, sender identity
2. Open **Dados e cópia de segurança**
3. Export JSON backup (no secrets in file)
4. Mention **Repor dados demo** on `/pt-PT/demo` — resets demo records but keeps operational leads created during the session

**Talking point:** Operators can migrate data via JSON backup without cloud dependency.

---

## Stage 9 — English locale (optional, 1 min)

1. Click **EN** in the header
2. Open `/en/customers` to confirm shared IndexedDB records persist across locale

---

## Reset between audiences

```bash
# With demo server running:
npm run demo:reset
```

Or from UI: `/pt-PT/demo` → **Repor dados demo**.

For a completely fresh environment:

```bash
npm run demo:reset   # requires demo:start
npm run demo:seed    # verify seed
```

---

## Smoke verification

```bash
npm run demo:smoke
```

Runs `e2e/acceptance/00-smoke-and-navigation.spec.ts` against port 3002 with the demo database.

---

## What not to promise in this demo

- Hosted Supabase sync or OAuth sign-in
- Real email delivery or Brevo webhooks
- Paid AI providers (Abacus/OpenAI)
- Maintenance CMMS (placeholder module)
- Production Vercel deployment

See `docs/demo/forgeos-0.2.0-demo-plan.md` for the full route matrix.

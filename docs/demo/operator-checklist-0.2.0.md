# ForgeOS 0.2.0 — Operator checklist

Use before a live JH Gomes demo or stakeholder walkthrough.

## Environment

- [ ] Node **22.x** and npm **10.9.8**
- [ ] Branch `release/forgeos-0.2.0-local-demo` (or approved RC tag)
- [ ] `npm ci` completed without errors
- [ ] No real API keys in `.env.local` required for demo (scripts inject safe defaults)

## Pre-demo reset

- [ ] `npm run demo:start` running on port **3000**
- [ ] `npm run demo:reset` executed successfully
- [ ] Browser opened at **http://localhost:3000/pt-PT**
- [ ] Settings → **Sobre o ForgeOS** shows:
  - Version **0.2.0**
  - Persistence **local**
  - Database **forgeos:jhgomes:0.2.0-demo**
  - Schema **13**, seed **5**
- [ ] Footer shows **Demo local** (not Produção)

## Data sanity

- [ ] LeadOps shows **9** seed leads
- [ ] Campaigns list shows **4** campaigns
- [ ] Customers module has **3** demo customers
- [ ] Production has **3** seed orders
- [ ] No real customer emails (only `*.example.invalid`)

## Critical routes (pt-PT)

- [ ] Dashboard `/pt-PT`
- [ ] Customers `/pt-PT/customers`
- [ ] Outreach `/pt-PT/leadops`
- [ ] Campaigns `/pt-PT/leadops/campaigns`
- [ ] Products `/pt-PT/products`
- [ ] Cup customizer `/pt-PT/quotations/customizer`
- [ ] Quotations `/pt-PT/quotations`
- [ ] Production `/pt-PT/production`
- [ ] Machines `/pt-PT/machines`
- [ ] Inventory `/pt-PT/inventory`
- [ ] Settings `/pt-PT/settings`
- [ ] Guided demo `/pt-PT/demo`

## Safety checks

- [ ] Browser DevTools → Network: no requests to Supabase, Brevo, OpenAI, or Abacus during demo flows
- [ ] Outreach send shows **simulation** banners only
- [ ] AI generation uses **deterministic** provider
- [ ] Backup export downloads JSON with `tenant_jh_gomes`

## Integrated workflows (optional automation)

```powershell
npm run test:demo-walkthrough
```

Covers: commercial outreach, cup customizer, CRM→production guide, local operations backup/reset.

## Post-demo

- [ ] Export backup if stakeholder changes should be preserved
- [ ] Run `demo:reset` before next session OR use **Restaurar estado demo original**
- [ ] Stop demo server (Ctrl+C in `demo:start` terminal)

## Escalation

| Issue | Document |
|-------|----------|
| Persistence / reset | `docs/demo/demo-reset-backup-restore.md` |
| UI regressions | `qa/ui/0.2.0-critical-route-audit.md` |
| Release gate | `qa/releases/0.2.0-release-gate.md` |

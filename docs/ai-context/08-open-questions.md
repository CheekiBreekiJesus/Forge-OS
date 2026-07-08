# 08 Open Questions

| Question | Why It Matters | Recommended Default Assumption | Priority |
|---|---|---|---|
| What exact framework is already in the repo? | Codex must align with actual code instead of assumed stack | Inspect repo before changing code | High |
| Should the app use Next.js? | Determines routing, backend, deployment, and data-fetching patterns | Use Next.js if repo is not already established | High |
| Which database should be used? | Affects schema, migrations, hosting, and ORM | PostgreSQL | High |
| Which ORM should be used? | Affects data model implementation | Prisma or Drizzle; decide after repo inspection | High |
| Which auth provider should be used? | Multi-tenant security depends on auth model | Use provider with organization/tenant support | High |
| How should tenant isolation be implemented? | Critical SaaS security requirement | Every business entity has `tenantId`; enforce in backend queries | High |
| What is the exact MVP scope? | Prevents overbuilding | Customers, products, orders, production jobs, technical sheets, inventory basics | High |
| Should production sheets be reusable templates, job-specific records, or both? | Affects data model and UI | Support reusable templates plus job-specific copies later | High |
| Should pricing/quoting be in MVP? | Important for operations but may increase scope | Postpone unless required for first deployment | Medium |
| Should inventory include stock movements in MVP? | Determines complexity of warehouse module | Start with basic stock records, add movements later | Medium |
| Should ForgeOS integrate with Brevo in MVP? | Marketing automation may depend on it | Postpone direct integration; build marketing content module first | Medium |
| Should UPS shipping quotes be in MVP? | Useful but requires external API setup | Post-MVP | Medium |
| Which AI provider should be used? | Affects privacy, cost, and architecture | Not yet defined; keep provider-agnostic | Medium |
| Should file uploads/artwork be stored in MVP? | Cup printing jobs may require artwork/logo files | Add later unless production sheets require it immediately | Medium |
| Should mobile scanning be supported in MVP? | Warehouse workflow may benefit from barcode scanning | Post-MVP unless simple browser-based scanning is enough | Low |
| What deployment platform should be used? | Affects environment, database, CI/CD | Not yet defined | High |
| What testing framework should be used? | Needed for maintainable development | Use framework defaults after stack is confirmed | Medium |
| Should Spanish localization be scaffolded now? | Future market support | Prepare architecture, do not translate yet | Low |

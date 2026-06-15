# 04 Decisions Log

| Date | Decision | Reason | Status | Consequences |
|---|---|---|---|---|
| 2026-05-30 | Project named ForgeOS | Represents an Industrial Operating System for manufacturing | Confirmed | Use ForgeOS as product name unless changed by owner |
| 2026-05-30 | Tagline: “One Operating System for the Modern Factory.” | Concise product positioning | Confirmed | Can be used in docs, landing pages, and pitch material |
| 2026-05-30 | First deployment target is JH Gomes | Real-world business context for MVP validation | Confirmed | MVP should prioritize JH Gomes workflows |
| 2026-05-30 | Build as multi-tenant SaaS from day one | Product should support multiple companies later | Confirmed | Tenant isolation must be designed early |
| 2026-05-30 | Backend/internal code should be English | Maintainability and developer consistency | Confirmed | Code, schema, APIs, comments use English |
| 2026-05-30 | Frontend should support Portuguese and English | JH Gomes needs Portuguese UI; broader product needs English | Confirmed | i18n required from early stage |
| 2026-05-30 | Spanish should be supported later | Future market expansion | Tentative | Avoid architecture that blocks adding Spanish |
| 2026-05-30 | Target industries include plastic injection, mold manufacturing, CNC, packaging, automation integrators, and assembly | Matches intended market | Confirmed | Domain model should remain generic enough for these sectors |
| 2026-05-30 | Suggested tech direction: Next/React/Tailwind | Matches intended modern web dashboard workflow | Tentative | Verify actual repo before enforcing |
| Unknown | AI copilot and agent workflows are part of long-term platform | AI workflows are core strategic direction | Tentative | Do not overbuild AI before operational core exists |
| Unknown | JH Gomes production module should include cup technical sheets | Direct operational need | Confirmed | Technical sheet entity/module should be part of MVP planning |
| Unknown | Use configurable operational parameters instead of hardcoded production constants | Production rates/setup times vary | Confirmed | Store tenant/product/machine-specific settings |

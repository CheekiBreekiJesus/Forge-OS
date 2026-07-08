# Email draft preview — personalization QA

**Date:** 2026-07-03  
**Scope:** Manual outreach draft personalization and sender persistence

## Verified (unit + integration)

- Municipality `Tábua` → `Exmos. Senhores,`, `Município de Tábua`, no `Municipality`
- No recipient website sentence in body
- Persisted sender name/email/phone in generated draft
- Approved snapshot immutable after sender profile change

## UI controls

- Settings sender identity edit with save feedback
- Campaign **Atualizar dados do remetente**
- Draft preview metadata panel (`campaign-draft-preview-fields`)
- Manual greeting and organization display overrides

## Remaining limitations

- Playwright coverage for full Settings → LeadOps flow should be extended in `e2e/` as needed
- English template subject/article rules are simpler than PT municipality forms
- `contactSalutation` gender must be set explicitly (no first-name inference)
